package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.AIRequest;
import com.servicedesk.ticket.dto.AIResponse;
import com.servicedesk.ticket.service.AIService;
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
    
    @Value("${ai.service.url:http://localhost:8000/analyze}")
    private String aiServiceUrl;

    public AIServiceImpl(RestTemplateBuilder restTemplateBuilder) {
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofMillis(3000))
                .setReadTimeout(Duration.ofMillis(3000))
                .build();
    }

    @Override
    public AIResponse analyzeTicket(String title, String description) {
        String combinedText = String.format("Title: %s. Description: %s", 
                title != null ? title : "", 
                description != null ? description : "");
                
        log.info("Sending to AI: {}", combinedText);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            AIRequest requestBody = new AIRequest(combinedText);
            HttpEntity<AIRequest> requestEntity = new HttpEntity<>(requestBody, headers);

            AIResponse response = restTemplate.postForObject(aiServiceUrl, requestEntity, AIResponse.class);
            
            log.info("AI response: {}", response);
            
            if (response != null) {
                return response;
            }
        } catch (Exception e) {
            log.error("AI service failed or timed out: {}", e.getMessage());
        }

        // Graceful fallback
        return AIResponse.builder()
                .category("GENERAL")
                .priority("LOW")
                .sentiment("NEUTRAL")
                .build();
    }
}
