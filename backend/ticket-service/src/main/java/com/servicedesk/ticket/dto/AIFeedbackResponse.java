package com.servicedesk.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response sau khi Agent submit correction.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIFeedbackResponse {

    private Long predictionId;
    private Long ticketId;

    private String predictedCategory;
    private String correctedCategory;

    private String predictedPriority;
    private String correctedPriority;

    private String predictionSource;   // RULE_BASED | ZERO_SHOT
    private Double confidenceScore;

    /**
     * true  → AI đã sai, correction được ghi nhận
     * false → AI đúng, Agent xác nhận
     */
    private Boolean agentCorrected;

    private LocalDateTime createdAt;

    private String message;
}
