package com.servicedesk.ticket.service.impl;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.servicedesk.ticket.dto.AIRequest;
import com.servicedesk.ticket.dto.AIResponse;
import com.servicedesk.ticket.service.AIService;
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

@Slf4j
@Service
public class AIServiceImpl implements AIService {

    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8000}/analyze")
    private String aiServiceUrl;

    public AIServiceImpl(RestTemplateBuilder restTemplateBuilder) {
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
                    aiServiceUrl, requestEntity, RawAIResponse.class
            );

            if (rawResponse != null) {
                AIResponse mapped = AIResponse.builder()
                        .category(rawResponse.getCategory())
                        .priority(rawResponse.getPriority())
                        .sentiment(rawResponse.getSentiment())
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
                .reason("AI service unavailable — fallback defaults applied")
                .predictionSource("ZERO_SHOT")
                .confidenceScore(0.0)
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
        private String reason;

        @JsonProperty("prediction_source")
        private String predictionSource;

        @JsonProperty("confidence_score")
        private Double confidenceScore;
    }
}
