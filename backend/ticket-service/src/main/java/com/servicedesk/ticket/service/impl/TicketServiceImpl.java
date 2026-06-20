package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.AIResponse;
import com.servicedesk.ticket.dto.TicketAuditLogResponse;
import com.servicedesk.ticket.dto.TicketCreateRequest;
import com.servicedesk.ticket.dto.TicketResponse;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.enums.Priority;
import com.servicedesk.ticket.enums.TicketAuditAction;
import com.servicedesk.ticket.enums.TicketStatus;
import com.servicedesk.ticket.enums.UserRole;
import com.servicedesk.ticket.exception.ResourceNotFoundException;
import com.servicedesk.ticket.exception.UnauthorizedAccessException;
import com.servicedesk.ticket.repository.TicketRepository;
import com.servicedesk.ticket.security.UserContext;
import com.servicedesk.ticket.service.AIPredictionService;
import com.servicedesk.ticket.service.AIService;
import com.servicedesk.ticket.service.AccessControlService;
import com.servicedesk.ticket.service.EmailService;
import com.servicedesk.ticket.service.NotificationService;
import com.servicedesk.ticket.service.SettingsService;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;
    private final com.servicedesk.ticket.repository.UserRepository userRepository;
    private final AIService aiService;
    private final AIPredictionService aiPredictionService;
    private final AccessControlService accessControlService;
    private final TicketAuditLogService ticketAuditLogService;
    private final EmailService emailService;
    private final SettingsService settingsService;
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

        AIResponse aiResponse = aiService.analyzeTicket(request.getTitle(), request.getDescription());

        String aiCategory = aiResponse.getCategory();
        if (aiCategory == null || aiCategory.trim().isEmpty()) {
            aiCategory = "GENERAL";
        }
        
        if (request.getCategory() != null && !request.getCategory().trim().isEmpty()) {
            ticket.setCategory(request.getCategory().toUpperCase());
        } else {
            ticket.setCategory(aiCategory.toUpperCase());
        }

        Priority finalPriority;
        try {
            finalPriority = Priority.valueOf(aiResponse.getPriority().toUpperCase());
        } catch (Exception e) {
            finalPriority = Priority.LOW;
        }

        String combinedText = (request.getTitle() + " " + request.getDescription()).toLowerCase();
        if (combinedText.contains("server down") || combinedText.contains("urgent")) {
            finalPriority = Priority.HIGH;
        }

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
                    aiResponse
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

        if (Boolean.TRUE.equals(settingsService.getSettings().getNotifyEmail())) {
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
}
