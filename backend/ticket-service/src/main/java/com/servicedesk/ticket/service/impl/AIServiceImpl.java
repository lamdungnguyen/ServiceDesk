package com.servicedesk.ticket.service.impl;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.servicedesk.ticket.dto.AIRequest;
import com.servicedesk.ticket.dto.AIResponse;
import com.servicedesk.ticket.dto.AITicketSummaryRequest;
import com.servicedesk.ticket.dto.TicketAiSummaryResponse;
import com.servicedesk.ticket.service.AIService;
import com.servicedesk.ticket.service.SettingsService;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;

@Slf4j
@Service
public class AIServiceImpl implements AIService {

    private final RestTemplate restTemplate;
    private final SettingsService settingsService;

    @Value("${ai.service.url:http://localhost:8000}")
    private String defaultAiServiceUrl;

    public AIServiceImpl(RestTemplateBuilder restTemplateBuilder, SettingsService settingsService) {
        this.settingsService = settingsService;
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofMillis(5000))
                .setReadTimeout(Duration.ofMillis(10000))
                .build();
    }

    @Override
    public AIResponse analyzeTicket(String title, String description) {
        String combinedText = String.format("Title: %s. Description: %s",
                title != null ? title : "",
                description != null ? description : "");

        log.info("[AIService] Sending to AI service: {}", combinedText);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            AIRequest requestBody = new AIRequest(combinedText);
            HttpEntity<AIRequest> requestEntity = new HttpEntity<>(requestBody, headers);

            // Dùng internal DTO để map snake_case từ Python
            RawAIResponse rawResponse = restTemplate.postForObject(
                    resolveAnalyzeUrl(), requestEntity, RawAIResponse.class
            );

            if (rawResponse != null) {
                AIResponse mapped = AIResponse.builder()
                        .category(rawResponse.getCategory())
                        .priority(rawResponse.getPriority())
                        .sentiment(rawResponse.getSentiment())
                        .impact(rawResponse.getImpact() != null ? rawResponse.getImpact() : "NONE")
                        .impactReason(rawResponse.getImpactReason())
                        .urgencySignals(rawResponse.getUrgencySignals() != null ? rawResponse.getUrgencySignals() : List.of())
                        .reason(rawResponse.getReason())
                        .predictionSource(
                            rawResponse.getPredictionSource() != null
                                ? rawResponse.getPredictionSource()
                                : "ZERO_SHOT"
                        )
                        .confidenceScore(
                            rawResponse.getConfidenceScore() != null
                                ? rawResponse.getConfidenceScore()
                                : 0.0
                        )
                        .modelVersion(
                            rawResponse.getModelVersion() != null
                                ? rawResponse.getModelVersion()
                                : "hybrid-v2.1"
                        )
                        .build();

                log.info("[AIService] Response: cat={}, prio={}, src={}, conf={}",
                        mapped.getCategory(), mapped.getPriority(),
                        mapped.getPredictionSource(), mapped.getConfidenceScore());
                return mapped;
            }
        } catch (Exception e) {
            log.error("[AIService] AI service failed or timed out: {}", e.getMessage());
        }

        // Graceful fallback — không crash ticket creation
        log.warn("[AIService] Using graceful fallback defaults");
        return AIResponse.builder()
                .category("GENERAL")
                .priority("LOW")
                .sentiment("NEUTRAL")
                .impact("NONE")
                .impactReason("AI service unavailable")
                .urgencySignals(List.of())
                .reason("AI service unavailable — fallback defaults applied")
                .predictionSource("FALLBACK")
                .confidenceScore(0.0)
                .modelVersion("fallback")
                .build();
    }

    @Override
    public TicketAiSummaryResponse summarizeTicket(AITicketSummaryRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<AITicketSummaryRequest> requestEntity = new HttpEntity<>(request, headers);

            RawTicketSummaryResponse rawResponse = restTemplate.postForObject(
                    resolveEndpointUrl("/summarize-ticket"), requestEntity, RawTicketSummaryResponse.class
            );

            if (rawResponse != null) {
                return TicketAiSummaryResponse.builder()
                        .summary(rawResponse.getSummary())
                        .customerProblem(rawResponse.getCustomerProblem())
                        .attemptedSteps(rawResponse.getAttemptedSteps() != null ? rawResponse.getAttemptedSteps() : List.of())
                        .suggestedNextSteps(rawResponse.getSuggestedNextSteps() != null ? rawResponse.getSuggestedNextSteps() : List.of())
                        .suggestedReply(rawResponse.getSuggestedReply())
                        .source(rawResponse.getSource() != null ? rawResponse.getSource() : "AI_SERVICE")
                        .build();
            }
        } catch (Exception e) {
            log.warn("[AIService] Ticket summary failed, using fallback: {}", e.getMessage());
        }

        return fallbackSummary(request);
    }

    private String resolveAnalyzeUrl() {
        return resolveEndpointUrl("/analyze");
    }

    private String resolveEndpointUrl(String endpoint) {
        String baseUrl = defaultAiServiceUrl;
        try {
            String configuredUrl = settingsService.getSettings().getAiServiceUrl();
            if (configuredUrl != null && !configuredUrl.trim().isEmpty()) {
                baseUrl = configuredUrl.trim();
            }
        } catch (Exception e) {
            log.warn("[AIService] Could not read AI service URL from settings, using application config: {}", e.getMessage());
        }

        String trimmed = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        if (trimmed.endsWith("/analyze")) {
            trimmed = trimmed.substring(0, trimmed.length() - "/analyze".length());
        }
        return trimmed + endpoint;
    }

    private TicketAiSummaryResponse fallbackSummary(AITicketSummaryRequest request) {
        String title = request != null && request.getTitle() != null ? request.getTitle() : "this ticket";
        return TicketAiSummaryResponse.builder()
                .summary("Ticket requires review: " + title)
                .customerProblem(request != null ? request.getDescription() : "")
                .attemptedSteps(List.of())
                .suggestedNextSteps(List.of(
                        "Review the ticket details and recent comments.",
                        "Confirm the affected user, device, and business impact.",
                        "Post a concise update before changing ticket status."
                ))
                .suggestedReply("Thanks for the details. I am reviewing this ticket and will update you with the next steps shortly.")
                .source("FALLBACK")
                .build();
    }

    /**
     * Internal DTO để deserialize Python snake_case response.
     * Python trả: prediction_source, confidence_score
     * Java field naming: predictionSource, confidenceScore
     */
    @Data
    private static class RawAIResponse {
        private String category;
        private String priority;
        private String sentiment;
        private String impact;
        private String reason;

        @JsonProperty("impact_reason")
        private String impactReason;

        @JsonProperty("urgency_signals")
        private List<String> urgencySignals;

        @JsonProperty("prediction_source")
        private String predictionSource;

        @JsonProperty("confidence_score")
        private Double confidenceScore;

        @JsonProperty("model_version")
        private String modelVersion;
    }

    @Data
    private static class RawTicketSummaryResponse {
        private String summary;

        @JsonProperty("customer_problem")
        private String customerProblem;

        @JsonProperty("attempted_steps")
        private List<String> attemptedSteps;

        @JsonProperty("suggested_next_steps")
        private List<String> suggestedNextSteps;

        @JsonProperty("suggested_reply")
        private String suggestedReply;

        private String source;
    }
}
