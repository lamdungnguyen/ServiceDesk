package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.AIResponse;
import com.servicedesk.ticket.dto.SettingsDto;
import com.servicedesk.ticket.dto.TicketCreateRequest;
import com.servicedesk.ticket.dto.TicketResponse;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.enums.Priority;
import com.servicedesk.ticket.repository.CustomFieldConfigRepository;
import com.servicedesk.ticket.repository.CommentRepository;
import com.servicedesk.ticket.repository.SettingsRepository;
import com.servicedesk.ticket.repository.TicketCustomFieldValueRepository;
import com.servicedesk.ticket.repository.TicketRepository;
import com.servicedesk.ticket.repository.UserRepository;
import com.servicedesk.ticket.security.UserContext;
import com.servicedesk.ticket.service.AIPredictionService;
import com.servicedesk.ticket.service.AIService;
import com.servicedesk.ticket.service.AccessControlService;
import com.servicedesk.ticket.service.EmailService;
import com.servicedesk.ticket.service.NotificationService;
import com.servicedesk.ticket.service.SettingsService;
import com.servicedesk.ticket.service.TicketAuditLogService;
import com.servicedesk.ticket.service.TicketSimilarityScorer;
import com.servicedesk.ticket.util.BusinessTimeCalculator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TicketServiceImplTest {

    private final TicketRepository ticketRepository = mock(TicketRepository.class);
    private final NotificationService notificationService = mock(NotificationService.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final AIService aiService = mock(AIService.class);
    private final AIPredictionService aiPredictionService = mock(AIPredictionService.class);
    private final AccessControlService accessControlService = mock(AccessControlService.class);
    private final TicketAuditLogService ticketAuditLogService = mock(TicketAuditLogService.class);
    private final EmailService emailService = mock(EmailService.class);
    private final SettingsService settingsService = mock(SettingsService.class);
    private final CommentRepository commentRepository = mock(CommentRepository.class);
    private final TicketSimilarityScorer ticketSimilarityScorer = new TicketSimilarityScorer();
    private final SettingsRepository settingsRepository = mock(SettingsRepository.class);
    private final BusinessTimeCalculator businessTimeCalculator = mock(BusinessTimeCalculator.class);
    private final CustomFieldConfigRepository customFieldConfigRepository = mock(CustomFieldConfigRepository.class);
    private final TicketCustomFieldValueRepository ticketCustomFieldValueRepository = mock(TicketCustomFieldValueRepository.class);
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate = mock(org.springframework.jdbc.core.JdbcTemplate.class);

    @AfterEach
    void clearUserContext() {
        UserContext.clear();
    }

    @Test
    void createTicketUsesAiCategoryWhenPredictionIsValid() {
        TicketServiceImpl service = createService();
        when(aiService.analyzeTicket(any(), any())).thenReturn(AIResponse.builder()
                .category("NETWORK")
                .priority("HIGH")
                .predictionSource("RULE_BASED")
                .confidenceScore(1.0)
                .build());

        TicketResponse response = service.createTicket(ticketRequest("SOFTWARE"));

        assertThat(response.getCategory()).isEqualTo("NETWORK");
        assertThat(response.getPriority()).isEqualTo(Priority.HIGH);
    }

    @Test
    void createTicketFallsBackToUserCategoryWhenAiFallsBack() {
        TicketServiceImpl service = createService();
        when(aiService.analyzeTicket(any(), any())).thenReturn(AIResponse.builder()
                .category("GENERAL")
                .priority("LOW")
                .predictionSource("FALLBACK")
                .confidenceScore(0.0)
                .build());

        TicketResponse response = service.createTicket(ticketRequest("ACCESS"));

        assertThat(response.getCategory()).isEqualTo("ACCOUNT");
        assertThat(response.getPriority()).isEqualTo(Priority.MEDIUM);
    }

    @Test
    void createTicketAcceptsUrgentPriorityFromAi() {
        TicketServiceImpl service = createService();
        when(aiService.analyzeTicket(any(), any())).thenReturn(AIResponse.builder()
                .category("INFRASTRUCTURE")
                .priority("URGENT")
                .predictionSource("RULE_BASED")
                .confidenceScore(1.0)
                .build());

        TicketResponse response = service.createTicket(ticketRequest("GENERAL"));

        assertThat(response.getCategory()).isEqualTo("INFRASTRUCTURE");
        assertThat(response.getPriority()).isEqualTo(Priority.URGENT);
    }

    @Test
    void createTicketStoresSuggestionWithoutAutoApplyingBelowThreshold() {
        TicketServiceImpl service = createService();
        when(aiService.analyzeTicket(any(), any())).thenReturn(AIResponse.builder()
                .category("NETWORK")
                .priority("HIGH")
                .predictionSource("ZERO_SHOT")
                .confidenceScore(0.6)
                .build());

        TicketResponse response = service.createTicket(ticketRequest("SOFTWARE"));

        assertThat(response.getCategory()).isEqualTo("SOFTWARE");
        assertThat(response.getPriority()).isEqualTo(Priority.MEDIUM);
        verify(aiPredictionService).saveInitialPrediction(
                eq(1L),
                eq("Cannot connect to VPN"),
                eq("The VPN connection keeps dropping."),
                any(AIResponse.class),
                eq("SUGGESTED"),
                eq(false)
        );
    }

    private TicketServiceImpl createService() {
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(invocation -> {
            Ticket ticket = invocation.getArgument(0);
            ticket.setId(1L);
            return ticket;
        });
        when(settingsRepository.findById(1L)).thenReturn(Optional.empty());
        when(settingsService.getSettings()).thenReturn(SettingsDto.builder().notifyEmail(false).build());
        when(ticketCustomFieldValueRepository.findByTicketId(1L)).thenReturn(List.of());

        return new TicketServiceImpl(
                ticketRepository,
                notificationService,
                userRepository,
                aiService,
                aiPredictionService,
                accessControlService,
                ticketAuditLogService,
                emailService,
                settingsService,
                commentRepository,
                ticketSimilarityScorer,
                settingsRepository,
                businessTimeCalculator,
                customFieldConfigRepository,
                ticketCustomFieldValueRepository,
                jdbcTemplate
        );
    }

    private TicketCreateRequest ticketRequest(String category) {
        TicketCreateRequest request = new TicketCreateRequest();
        request.setTitle("Cannot connect to VPN");
        request.setDescription("The VPN connection keeps dropping.");
        request.setPriority(Priority.MEDIUM);
        request.setCategory(category);
        return request;
    }
}
