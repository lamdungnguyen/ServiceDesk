package com.servicedesk.ticket.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Lưu AI prediction và agent correction cho mỗi ticket.
 *
 * Design principles:
 * - KHÔNG overwrite: mỗi lần agent sửa → tạo record mới
 * - agent_corrected=true chỉ khi AI sai (predicted != corrected)
 * - embedding_generated: placeholder cho future Vector DB integration
 */
@Entity
@Table(
    name = "ai_predictions",
    indexes = {
        @Index(name = "idx_ai_pred_ticket_id", columnList = "ticket_id"),
        @Index(name = "idx_ai_pred_agent_corrected", columnList = "agent_corrected, predicted_category, predicted_priority")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Ticket Reference ─────────────────────────────────────────────────────

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "title", length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    /**
     * Combined text gửi cho AI: "Title: X. Description: Y"
     * Dùng làm training data cho PhoBERT/XLM-Roberta.
     */
    @Column(name = "ticket_text", columnDefinition = "NVARCHAR(MAX)")
    private String ticketText;

    // ── AI Predictions ───────────────────────────────────────────────────────

    @Column(name = "predicted_category", length = 50)
    private String predictedCategory;

    @Column(name = "predicted_priority", length = 20)
    private String predictedPriority;

    @Column(name = "predicted_sentiment", length = 20)
    private String predictedSentiment;

    @Column(name = "predicted_impact", length = 40)
    private String predictedImpact;

    @Column(name = "impact_reason", length = 500)
    private String impactReason;

    @Column(name = "urgency_signals", length = 1000)
    private String urgencySignals;

    // ── Agent Corrections (NULL nếu chưa verify) ─────────────────────────────

    @Column(name = "corrected_category", length = 50)
    private String correctedCategory;

    @Column(name = "corrected_priority", length = 20)
    private String correctedPriority;

    // ── Metadata ─────────────────────────────────────────────────────────────

    /**
     * Nguồn prediction: RULE_BASED | ZERO_SHOT
     */
    @Column(name = "prediction_source", nullable = false, length = 20)
    @Builder.Default
    private String predictionSource = "ZERO_SHOT";

    /**
     * Confidence score.
     * 1.0 nếu RULE_BASED, model score (0-1) nếu ZERO_SHOT.
     */
    @Column(name = "confidence_score")
    @Builder.Default
    private Double confidenceScore = 0.0;

    @Column(name = "model_version", length = 100)
    private String modelVersion;

    @Column(name = "decision_status", length = 30)
    @Builder.Default
    private String decisionStatus = "FALLBACK";

    @Column(name = "ai_applied", nullable = false)
    @Builder.Default
    private Boolean aiApplied = false;

    /**
     * true  → Agent đã verify VÀ AI sai (predicted != corrected)
     * false → Chưa verify, HOẶC đã verify nhưng AI đúng
     *
     * Accuracy chỉ được tính trên records đã verify (correctedCategory IS NOT NULL).
     */
    @Column(name = "agent_corrected", nullable = false)
    @Builder.Default
    private Boolean agentCorrected = false;

    /**
     * Placeholder cho future Vector DB integration.
     * false: chưa generate embedding
     * true:  embedding đã được lưu trong Vector DB
     */
    @Column(name = "embedding_generated", nullable = false)
    @Builder.Default
    private Boolean embeddingGenerated = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
