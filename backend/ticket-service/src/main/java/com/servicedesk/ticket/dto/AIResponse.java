package com.servicedesk.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIResponse {
    private String category;
    private String priority;
    private String sentiment;
    private String reason;

    /**
     * Nguồn prediction: RULE_BASED | ZERO_SHOT
     */
    @Builder.Default
    private String predictionSource = "ZERO_SHOT";

    /**
     * Confidence score từ model.
     * 1.0 nếu RULE_BASED, model score nếu ZERO_SHOT.
     */
    @Builder.Default
    private Double confidenceScore = 0.0;
}
