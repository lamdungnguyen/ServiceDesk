package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.AIResponse;
import com.servicedesk.ticket.dto.AITicketSummaryComment;
import com.servicedesk.ticket.dto.AITicketSummaryRequest;
import com.servicedesk.ticket.dto.RoutingSuggestionResponse;
import com.servicedesk.ticket.dto.SimilarTicketResponse;
import com.servicedesk.ticket.dto.SettingsDto;
import com.servicedesk.ticket.dto.TicketAiSummaryResponse;
import com.servicedesk.ticket.dto.TicketAuditLogResponse;
import com.servicedesk.ticket.dto.TicketCreateRequest;
import com.servicedesk.ticket.dto.TicketResponse;
import com.servicedesk.ticket.entity.Comment;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.enums.Priority;
import com.servicedesk.ticket.enums.TicketAuditAction;
import com.servicedesk.ticket.enums.TicketStatus;
import com.servicedesk.ticket.enums.UserRole;
import com.servicedesk.ticket.enums.UserStatus;
import com.servicedesk.ticket.exception.ResourceNotFoundException;
import com.servicedesk.ticket.exception.UnauthorizedAccessException;
import com.servicedesk.ticket.repository.TicketRepository;
import com.servicedesk.ticket.repository.CommentRepository;
import com.servicedesk.ticket.security.UserContext;
import com.servicedesk.ticket.service.AIPredictionService;
import com.servicedesk.ticket.service.AIService;
import com.servicedesk.ticket.service.AccessControlService;
import com.servicedesk.ticket.service.EmailService;
import com.servicedesk.ticket.service.NotificationService;
import com.servicedesk.ticket.service.SettingsService;
import com.servicedesk.ticket.service.TicketSimilarityScorer;
import com.servicedesk.ticket.service.TicketAuditLogService;
import com.servicedesk.ticket.service.TicketService;
import com.servicedesk.ticket.dto.TicketCustomFieldValueDto;
import com.servicedesk.ticket.entity.TicketCustomFieldValue;
import com.servicedesk.ticket.repository.CustomFieldConfigRepository;
import com.servicedesk.ticket.repository.TicketCustomFieldValueRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private static final Set<String> CANONICAL_CATEGORIES = Set.of(
            "GENERAL", "NETWORK", "INFRASTRUCTURE", "ACCOUNT", "SOFTWARE", "HARDWARE"
    );

    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;
    private final com.servicedesk.ticket.repository.UserRepository userRepository;
    private final AIService aiService;
    private final AIPredictionService aiPredictionService;
    private final AccessControlService accessControlService;
    private final TicketAuditLogService ticketAuditLogService;
    private final EmailService emailService;
    private final SettingsService settingsService;
    private final CommentRepository commentRepository;
    private final TicketSimilarityScorer ticketSimilarityScorer;
    private final com.servicedesk.ticket.repository.SettingsRepository settingsRepository;
    private final com.servicedesk.ticket.util.BusinessTimeCalculator businessTimeCalculator;
    private final CustomFieldConfigRepository customFieldConfigRepository;
    private final TicketCustomFieldValueRepository ticketCustomFieldValueRepository;

    @Override
    @Transactional
    public TicketResponse createTicket(TicketCreateRequest request) {
        Long userId = UserContext.getUserId();
        UserRole role = UserContext.getUserRole();

        if (userId != null && role != UserRole.CUSTOMER) {
            throw new UnauthorizedAccessException("Only CUSTOMER can create tickets when logged in");
        }

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .reporterId(userId)
                .reporterName(userId == null ? request.getReporterName() : null)
                .reporterEmail(userId == null ? request.getReporterEmail() : null)
                .status(TicketStatus.NEW)
                .build();

        SettingsDto settings = settingsService.getSettings();
        AIResponse aiResponse = aiService.analyzeTicket(request.getTitle(), request.getDescription());
        AIClassificationDecision aiDecision = resolveAIClassificationDecision(aiResponse, request, settings);

        ticket.setCategory(aiDecision.category);

        Priority finalPriority = aiDecision.priority;

        ticket.setPriority(finalPriority);
        ticket.setDueDate(calculateDueDate(finalPriority));

        Ticket savedTicket = ticketRepository.save(ticket);

        if (request.getCustomFields() != null && !request.getCustomFields().isEmpty()) {
            for (TicketCustomFieldValueDto dto : request.getCustomFields()) {
                customFieldConfigRepository.findById(dto.getFieldId()).ifPresent(config -> {
                    TicketCustomFieldValue value = TicketCustomFieldValue.builder()
                            .ticketId(savedTicket.getId())
                            .fieldConfig(config)
                            .fieldValue(dto.getValue())
                            .build();
                    ticketCustomFieldValueRepository.save(value);
                });
            }
        }

        try {
            aiPredictionService.saveInitialPrediction(
                    savedTicket.getId(),
                    request.getTitle(),
                    request.getDescription(),
                    aiResponse,
                    aiDecision.decisionStatus,
                    aiDecision.aiApplied
            );
        } catch (Exception e) {
            log.warn("[Ticket] Failed to save AI prediction for ticket #{}: {}",
                    savedTicket.getId(), e.getMessage());
        }

        notificationService.notifyAdmins("New ticket created: #" + savedTicket.getId() + " - " + savedTicket.getTitle(), "INFO");
        ticketAuditLogService.log(
                savedTicket.getId(),
                TicketAuditAction.CREATE,
                null,
                null,
                savedTicket.getStatus().name(),
                "Ticket created",
                userId == null ? request.getReporterName() : null
        );

        if (Boolean.TRUE.equals(settings.getNotifyEmail())) {
            if (savedTicket.getReporterEmail() != null) {
                emailService.sendEmail(savedTicket.getReporterEmail(), "Ticket Created: " + savedTicket.getTitle(), "Your ticket #" + savedTicket.getId() + " has been created.");
            } else if (savedTicket.getReporterId() != null) {
                userRepository.findById(savedTicket.getReporterId()).ifPresent(u -> {
                    if (u.getEmail() != null) {
                        emailService.sendEmail(u.getEmail(), "Ticket Created: " + savedTicket.getTitle(), "Your ticket #" + savedTicket.getId() + " has been created.");
                    }
                });
            }
        }

        return mapToResponse(savedTicket);
    }

    @Override
    public TicketResponse getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));

        accessControlService.requireCanViewTicket(ticket);

        return mapToResponse(ticket);
    }

    @Override
    public List<TicketResponse> getAllTickets() {
        Long userId = UserContext.getUserId();
        UserRole role = UserContext.getUserRole();

        List<Ticket> tickets;
        if (role == UserRole.CUSTOMER) {
            tickets = ticketRepository.findByReporterId(userId);
        } else if (role == UserRole.AGENT) {
            tickets = ticketRepository.findByAssigneeId(userId);
        } else {
            tickets = ticketRepository.findAll();
        }

        return tickets.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TicketResponse updateTicketStatus(Long id, TicketStatus status) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));

        accessControlService.requireCanUpdateTicket(ticket);

        TicketStatus oldStatus = ticket.getStatus();
        ticket.setStatus(status);
        if (status == TicketStatus.RESOLVED && ticket.getResolvedAt() == null) {
            ticket.setResolvedAt(LocalDateTime.now());
        }
        Ticket updatedTicket = ticketRepository.save(ticket);

        if (status == TicketStatus.RESOLVED && ticket.getReporterId() != null) {
            notificationService.createNotification(ticket.getReporterId(), "Your ticket #" + ticket.getId() + " has been resolved.", "INFO");
        }

        if (!Objects.equals(oldStatus, status)) {
            ticketAuditLogService.log(
                    ticket.getId(),
                    getStatusAuditAction(status),
                    "status",
                    valueOf(oldStatus),
                    valueOf(status),
                    "Ticket status changed"
            );
        }

        return mapToResponse(updatedTicket);
    }

    @Override
    @Transactional
    public TicketResponse assignTicket(Long id, Long assigneeId) {
        accessControlService.requireCanAssignTicket(assigneeId);

        com.servicedesk.ticket.entity.User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignee not found with id: " + assigneeId));

        if (assignee.getRole() != UserRole.AGENT && assignee.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Assignee must be an AGENT or ADMIN");
        }

        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));

        Long oldAssigneeId = ticket.getAssigneeId();
        TicketStatus oldStatus = ticket.getStatus();
        ticket.setAssigneeId(assigneeId);

        if (ticket.getStatus() == TicketStatus.NEW) {
            ticket.setStatus(TicketStatus.ASSIGNED);
        }

        Ticket updatedTicket = ticketRepository.save(ticket);

        notificationService.createNotification(assigneeId, "You have been assigned to ticket #" + ticket.getId(), "INFO");
        ticketAuditLogService.log(
                ticket.getId(),
                TicketAuditAction.ASSIGNED,
                "assigneeId",
                valueOf(oldAssigneeId),
                valueOf(assigneeId),
                "Ticket assigned to " + assignee.getName()
        );
        if (!Objects.equals(oldStatus, ticket.getStatus())) {
            ticketAuditLogService.log(
                    ticket.getId(),
                    TicketAuditAction.STATUS_CHANGED,
                    "status",
                    valueOf(oldStatus),
                    valueOf(ticket.getStatus()),
                    "Ticket status changed during assignment"
            );
        }

        if (Boolean.TRUE.equals(settingsService.getSettings().getNotifyEmail())) {
            if (assignee.getEmail() != null) {
                emailService.sendEmail(assignee.getEmail(), "Ticket Assigned: " + ticket.getTitle(), "You have been assigned to ticket #" + ticket.getId());
            }
        }

        return mapToResponse(updatedTicket);
    }

    @Override
    public List<TicketResponse> getFilteredTickets(String status, String priority, Boolean overdue, String keyword, Boolean assignedToMe) {
        Long userId = UserContext.getUserId();
        UserRole role = UserContext.getUserRole();

        Specification<Ticket> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (role == UserRole.CUSTOMER) {
                predicates.add(cb.equal(root.get("reporterId"), userId));
            } else if (role == UserRole.AGENT) {
                predicates.add(cb.equal(root.get("assigneeId"), userId));
            } else if (role == UserRole.ADMIN && Boolean.TRUE.equals(assignedToMe)) {
                predicates.add(cb.equal(root.get("assigneeId"), userId));
            }

            if (status != null && !status.trim().isEmpty()) {
                try {
                    TicketStatus statusEnum = TicketStatus.valueOf(status.toUpperCase());
                    predicates.add(cb.equal(root.get("status"), statusEnum));
                } catch (IllegalArgumentException ignored) {
                }
            }

            if (priority != null && !priority.trim().isEmpty()) {
                try {
                    Priority priorityEnum = Priority.valueOf(priority.toUpperCase());
                    predicates.add(cb.equal(root.get("priority"), priorityEnum));
                } catch (IllegalArgumentException ignored) {
                }
            }

            if (overdue != null && overdue) {
                predicates.add(cb.lessThan(root.get("dueDate"), LocalDateTime.now()));
                predicates.add(cb.notEqual(root.get("status"), TicketStatus.RESOLVED));
                predicates.add(cb.notEqual(root.get("status"), TicketStatus.CLOSED));
            }

            if (keyword != null && !keyword.trim().isEmpty()) {
                String pattern = "%" + keyword.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titleMatch, descMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return ticketRepository.findAll(spec).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TicketResponse> getEscalatedTickets() {
        Long userId = UserContext.getUserId();
        UserRole role = UserContext.getUserRole();

        return ticketRepository.findByEscalatedTrue()
                .stream()
                .filter(ticket -> role == UserRole.ADMIN
                        || (role == UserRole.AGENT && Objects.equals(ticket.getAssigneeId(), userId))
                        || (role == UserRole.CUSTOMER && Objects.equals(ticket.getReporterId(), userId)))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<TicketAuditLogResponse> getAuditLogsForTicket(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));

        accessControlService.requireCanViewTicket(ticket);

        return ticketAuditLogService.getLogsForTicket(id);
    }

    @Override
    public List<SimilarTicketResponse> getSimilarTickets(Long id) {
        Ticket source = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));

        accessControlService.requireCanViewTicket(source);

        Long userId = UserContext.getUserId();
        UserRole role = UserContext.getUserRole();

        return ticketRepository.findActiveTickets().stream()
                .filter(candidate -> !Objects.equals(candidate.getId(), source.getId()))
                .filter(candidate -> canCurrentUserSeeCandidate(candidate, userId, role))
                .map(candidate -> {
                    TicketSimilarityScorer.SimilarityScore score = ticketSimilarityScorer.score(source, candidate);
                    return SimilarTicketResponse.builder()
                            .id(candidate.getId())
                            .title(candidate.getTitle())
                            .category(candidate.getCategory())
                            .priority(candidate.getPriority())
                            .status(candidate.getStatus())
                            .score(Math.round(score.getScore() * 100.0) / 100.0)
                            .matchedTerms(score.getMatchedTerms())
                            .createdAt(candidate.getCreatedAt())
                            .build();
                })
                .filter(candidate -> candidate.getScore() > 0.0)
                .sorted(Comparator.comparing(SimilarTicketResponse::getScore).reversed())
                .limit(5)
                .collect(Collectors.toList());
    }

    @Override
    public TicketAiSummaryResponse getAiSummary(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));

        accessControlService.requireCanViewTicket(ticket);

        List<AITicketSummaryComment> comments = commentRepository.findByTicketId(ticket.getId()).stream()
                .map(this::mapSummaryComment)
                .collect(Collectors.toList());

        AITicketSummaryRequest request = AITicketSummaryRequest.builder()
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .category(ticket.getCategory())
                .priority(ticket.getPriority() != null ? ticket.getPriority().name() : null)
                .comments(comments)
                .build();

        return aiService.summarizeTicket(request);
    }

    @Override
    public List<RoutingSuggestionResponse> getRoutingSuggestions(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));

        accessControlService.requireCanViewTicket(ticket);

        return Stream.concat(
                        userRepository.findByRole(UserRole.AGENT).stream(),
                        userRepository.findByRole(UserRole.ADMIN).stream()
                )
                .filter(agent -> agent.getStatus() == UserStatus.ACTIVE)
                .map(agent -> buildRoutingSuggestion(ticket, agent))
                .sorted(Comparator.comparing(RoutingSuggestionResponse::getScore).reversed())
                .limit(3)
                .collect(Collectors.toList());
    }

    private boolean canCurrentUserSeeCandidate(Ticket candidate, Long userId, UserRole role) {
        return role == UserRole.ADMIN
                || (role == UserRole.AGENT && Objects.equals(candidate.getAssigneeId(), userId))
                || (role == UserRole.CUSTOMER && Objects.equals(candidate.getReporterId(), userId));
    }

    private AITicketSummaryComment mapSummaryComment(Comment comment) {
        String authorName = userRepository.findById(comment.getUserId())
                .map(com.servicedesk.ticket.entity.User::getName)
                .orElse("User #" + comment.getUserId());

        return AITicketSummaryComment.builder()
                .userId(comment.getUserId())
                .authorName(authorName)
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    private RoutingSuggestionResponse buildRoutingSuggestion(
            Ticket ticket,
            com.servicedesk.ticket.entity.User agent
    ) {
        long matchingResolved = ticket.getCategory() == null
                ? 0
                : ticketRepository.countResolvedByAssigneeAndCategory(agent.getId(), ticket.getCategory());
        long openTicketCount = ticketRepository.countByAssigneeIdAndStatusNotIn(
                agent.getId(),
                List.of(TicketStatus.RESOLVED, TicketStatus.CLOSED)
        );

        double expertiseScore = Math.min(0.45, matchingResolved * 0.09);
        double availabilityScore = Math.max(0.0, 0.35 - (openTicketCount * 0.04));
        double roleScore = agent.getRole() == UserRole.AGENT ? 0.15 : 0.08;
        double priorityBoost = ticket.getPriority() == Priority.URGENT ? 0.05 : 0.0;
        double score = Math.min(1.0, expertiseScore + availabilityScore + roleScore + priorityBoost);

        String reason = matchingResolved > 0
                ? "Handled " + matchingResolved + " resolved " + ticket.getCategory() + " tickets; " + openTicketCount + " open tickets now."
                : "Low current workload with " + openTicketCount + " open tickets; no same-category history yet.";

        return RoutingSuggestionResponse.builder()
                .assigneeId(agent.getId())
                .assigneeName(agent.getName())
                .role(agent.getRole().name())
                .agentType(agent.getAgentType())
                .score(Math.round(score * 100.0) / 100.0)
                .matchingResolvedTickets(matchingResolved)
                .openTicketCount(openTicketCount)
                .reason(reason)
                .build();
    }

    private TicketResponse mapToResponse(Ticket ticket) {
        List<TicketCustomFieldValueDto> customFieldDtos = ticketCustomFieldValueRepository.findByTicketId(ticket.getId())
                .stream()
                .map(v -> {
                    TicketCustomFieldValueDto dto = new TicketCustomFieldValueDto();
                    dto.setFieldId(v.getFieldConfig().getId());
                    dto.setFieldName(v.getFieldConfig().getFieldName());
                    dto.setFieldType(v.getFieldConfig().getFieldType());
                    dto.setValue(v.getFieldValue());
                    return dto;
                }).collect(Collectors.toList());

        return TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .category(ticket.getCategory())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .dueDate(ticket.getDueDate())
                .reporterId(ticket.getReporterId())
                .reporterName(ticket.getReporterName())
                .reporterEmail(ticket.getReporterEmail())
                .assigneeId(ticket.getAssigneeId())
                .escalated(ticket.getEscalated())
                .resolvedAt(ticket.getResolvedAt())
                .commentCount(ticket.getCommentCount())
                .customFields(customFieldDtos)
                .build();
    }

    private LocalDateTime calculateDueDate(Priority priority) {
        LocalDateTime now = LocalDateTime.now();
        int hoursSLA = 72; // default 3 days
        if (priority != null) {
            switch (priority) {
                case URGENT:
                    hoursSLA = 4;
                    break;
                case HIGH:
                    hoursSLA = 24;
                    break;
                case LOW:
                    hoursSLA = 120; // 5 days
                    break;
                case MEDIUM:
                default:
                    hoursSLA = 72;
                    break;
            }
        }

        com.servicedesk.ticket.entity.Settings settings = settingsRepository.findById(1L).orElse(null);
        if (settings != null) {
            return businessTimeCalculator.calculateDueDate(now, hoursSLA, settings);
        }
        return now.plusHours(hoursSLA);
    }

    private TicketAuditAction getStatusAuditAction(TicketStatus status) {
        if (status == TicketStatus.RESOLVED) {
            return TicketAuditAction.RESOLVED;
        }
        if (status == TicketStatus.CLOSED) {
            return TicketAuditAction.CLOSED;
        }
        return TicketAuditAction.STATUS_CHANGED;
    }

    private String valueOf(Object value) {
        return value == null ? null : value.toString();
    }

    private AIClassificationDecision resolveAIClassificationDecision(
            AIResponse aiResponse,
            TicketCreateRequest request,
            SettingsDto settings
    ) {
        String aiCategory = normalizeCategory(aiResponse.getCategory());
        boolean aiFallback = "FALLBACK".equalsIgnoreCase(aiResponse.getPredictionSource())
                || (aiResponse.getConfidenceScore() != null && aiResponse.getConfidenceScore() == 0.0);
        double confidence = aiResponse.getConfidenceScore() != null ? aiResponse.getConfidenceScore() : 0.0;
        boolean autoApplyEnabled = settings.getAiAutoApplyEnabled() == null || settings.getAiAutoApplyEnabled();
        double autoThreshold = settings.getAiAutoApplyThreshold() != null ? settings.getAiAutoApplyThreshold() : 0.8;
        double suggestThreshold = settings.getAiSuggestThreshold() != null ? settings.getAiSuggestThreshold() : 0.5;

        if (aiCategory != null && !aiFallback && autoApplyEnabled && confidence >= autoThreshold) {
            return new AIClassificationDecision(
                    aiCategory,
                    resolvePriority(aiResponse.getPriority(), request.getPriority()),
                    "AUTO_APPLIED",
                    true
            );
        }

        String userCategory = normalizeCategory(request.getCategory());
        Priority fallbackPriority = request.getPriority() != null ? request.getPriority() : Priority.LOW;

        if (aiCategory != null && !aiFallback && confidence >= suggestThreshold) {
            return new AIClassificationDecision(
                    userCategory != null ? userCategory : "GENERAL",
                    fallbackPriority,
                    "SUGGESTED",
                    false
            );
        }

        return new AIClassificationDecision(
                userCategory != null ? userCategory : "GENERAL",
                fallbackPriority,
                "FALLBACK",
                false
        );
    }

    private String normalizeCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            return null;
        }

        String normalized = category.trim().toUpperCase();
        if ("ACCESS".equals(normalized)) {
            normalized = "ACCOUNT";
        } else if ("OTHER".equals(normalized)) {
            normalized = "GENERAL";
        }

        return CANONICAL_CATEGORIES.contains(normalized) ? normalized : null;
    }

    private Priority resolvePriority(String priority, Priority fallback) {
        if (priority == null || priority.trim().isEmpty()) {
            return fallback != null ? fallback : Priority.LOW;
        }

        try {
            return Priority.valueOf(priority.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return fallback != null ? fallback : Priority.LOW;
        }
    }

    private static class AIClassificationDecision {
        private final String category;
        private final Priority priority;
        private final String decisionStatus;
        private final boolean aiApplied;

        private AIClassificationDecision(String category, Priority priority, String decisionStatus, boolean aiApplied) {
            this.category = category;
            this.priority = priority;
            this.decisionStatus = decisionStatus;
            this.aiApplied = aiApplied;
        }
    }
}
