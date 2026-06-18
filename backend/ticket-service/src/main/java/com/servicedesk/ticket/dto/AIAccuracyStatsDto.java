package com.servicedesk.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Response cho GET /api/v1/dashboard/ai-accuracy
 *
 * QUAN TRỌNG về methodology:
 * - Accuracy CHỈ tính trên verified records (Agent đã xem xét).
 * - KHÔNG dùng agentCorrected=false để suy ra "AI đúng" trên toàn bộ.
 * - Agent chưa sửa ≠ AI đúng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIAccuracyStatsDto {

    // ── Category Accuracy ──────────────────────────────────────────────────

    /**
     * Accuracy theo từng predicted category (chỉ verified records).
     * Key: "NETWORK", "HARDWARE", ...
     * Value: accuracy % (0.0 - 100.0)
     * Ví dụ: {"NETWORK": 90.0, "HARDWARE": 72.5}
     */
    private Map<String, Double> categoryAccuracy;

    /**
     * Tổng số verified records per category.
     * Key: category, Value: count
     */
    private Map<String, Long> categoryVerifiedCount;

    // ── Priority Accuracy ──────────────────────────────────────────────────

    /**
     * Accuracy theo từng predicted priority (chỉ verified records).
     * Ví dụ: {"LOW": 88.0, "HIGH": 67.0}
     */
    private Map<String, Double> priorityAccuracy;

    private Map<String, Long> priorityVerifiedCount;

    // ── Source Accuracy ────────────────────────────────────────────────────

    /**
     * So sánh RULE_BASED vs ZERO_SHOT accuracy.
     * Ví dụ: {"RULE_BASED": 95.0, "ZERO_SHOT": 78.0}
     */
    private Map<String, Double> sourceAccuracy;

    private Map<String, Long> sourceVerifiedCount;

    // ── Overall ────────────────────────────────────────────────────────────

    /**
     * Overall category accuracy (tính trên tất cả verified records).
     */
    private Double overallCategoryAccuracy;

    /**
     * Overall priority accuracy (tính trên tất cả verified records).
     */
    private Double overallPriorityAccuracy;

    /**
     * Tổng số predictions đã verify (Agent đã xem xét).
     */
    private Long totalVerified;

    /**
     * Số records AI sai (agentCorrected=true).
     */
    private Long totalCorrected;

    /**
     * Số records AI đúng (verified và không sửa).
     */
    private Long totalCorrect;
}
