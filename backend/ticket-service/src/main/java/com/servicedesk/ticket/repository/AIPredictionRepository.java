package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.AIPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AIPredictionRepository extends JpaRepository<AIPrediction, Long> {

    /**
     * Lấy prediction mới nhất của một ticket.
     * Dùng khi agent submit correction.
     */
    Optional<AIPrediction> findTopByTicketIdOrderByCreatedAtDesc(Long ticketId);

    /**
     * Lấy tất cả predictions của một ticket (history).
     */
    List<AIPrediction> findByTicketIdOrderByCreatedAtDesc(Long ticketId);

    // ── Analytics Queries ─────────────────────────────────────────────────────

    /**
     * Category accuracy per category (chỉ tính trên records đã verify).
     *
     * Accuracy được tính trên records có correctedCategory IS NOT NULL
     * (đã được Agent xem xét), KHÔNG dùng agentCorrected=false để suy ra đúng.
     *
     * Return: [predictedCategory, totalVerified, correctCount]
     */
    @Query("""
        SELECT
            p.predictedCategory,
            COUNT(p) AS totalVerified,
            SUM(CASE WHEN p.agentCorrected = false THEN 1L ELSE 0L END) AS correctCount
        FROM AIPrediction p
        WHERE p.correctedCategory IS NOT NULL
        GROUP BY p.predictedCategory
    """)
    List<Object[]> getCategoryAccuracyStats();

    /**
     * Priority accuracy per priority (chỉ tính trên records đã verify).
     *
     * Return: [predictedPriority, totalVerified, correctCount]
     */
    @Query("""
        SELECT
            p.predictedPriority,
            COUNT(p) AS totalVerified,
            SUM(CASE WHEN p.agentCorrected = false THEN 1L ELSE 0L END) AS correctCount
        FROM AIPrediction p
        WHERE p.correctedPriority IS NOT NULL
        GROUP BY p.predictedPriority
    """)
    List<Object[]> getPriorityAccuracyStats();

    /**
     * Rule-based vs Zero-shot accuracy (chỉ tính records đã verify).
     *
     * Return: [predictionSource, totalVerified, correctCount]
     */
    @Query("""
        SELECT
            p.predictionSource,
            COUNT(p) AS totalVerified,
            SUM(CASE WHEN p.agentCorrected = false THEN 1L ELSE 0L END) AS correctCount
        FROM AIPrediction p
        WHERE p.correctedCategory IS NOT NULL
        GROUP BY p.predictionSource
    """)
    List<Object[]> getSourceAccuracyStats();

    /**
     * Tổng số records đã verify (có correction).
     */
    @Query("SELECT COUNT(p) FROM AIPrediction p WHERE p.correctedCategory IS NOT NULL")
    long countVerifiedPredictions();

    /**
     * Tổng số records AI đã sửa (agent_corrected=true).
     */
    @Query("SELECT COUNT(p) FROM AIPrediction p WHERE p.agentCorrected = true")
    long countCorrectedPredictions();

    // ── Export Training Data ───────────────────────────────────────────────────

    /**
     * Export training data: chỉ lấy records đã verify.
     * correct_category = correctedCategory nếu có sửa, predictedCategory nếu AI đúng.
     */
    @Query("""
        SELECT p
        FROM AIPrediction p
        WHERE p.correctedCategory IS NOT NULL
        ORDER BY p.createdAt DESC
    """)
    List<AIPrediction> findVerifiedPredictionsForExport();
}
