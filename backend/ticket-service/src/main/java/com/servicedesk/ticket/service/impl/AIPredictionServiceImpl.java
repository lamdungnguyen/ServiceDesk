package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.AIAccuracyStatsDto;
import com.servicedesk.ticket.dto.AIFeedbackRequest;
import com.servicedesk.ticket.dto.AIFeedbackResponse;
import com.servicedesk.ticket.dto.AIResponse;
import com.servicedesk.ticket.entity.AIPrediction;
import com.servicedesk.ticket.exception.ResourceNotFoundException;
import com.servicedesk.ticket.repository.AIPredictionRepository;
import com.servicedesk.ticket.service.AIPredictionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIPredictionServiceImpl implements AIPredictionService {

    private final AIPredictionRepository aiPredictionRepository;

    // ──────────────────────────────────────────────────────────────────────────
    // SAVE INITIAL PREDICTION
    // ──────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void saveInitialPrediction(
            Long ticketId,
            String title,
            String description,
            AIResponse aiResponse
    ) {
        saveInitialPrediction(ticketId, title, description, aiResponse, "FALLBACK", false);
    }

    @Override
    @Transactional
    public void saveInitialPrediction(
            Long ticketId,
            String title,
            String description,
            AIResponse aiResponse,
            String decisionStatus,
            boolean aiApplied
    ) {
        String combinedText = buildTicketText(title, description);

        AIPrediction prediction = AIPrediction.builder()
                .ticketId(ticketId)
                .title(title)
                .description(description)
                .ticketText(combinedText)
                .predictedCategory(aiResponse.getCategory())
                .predictedPriority(aiResponse.getPriority())
                .predictedSentiment(aiResponse.getSentiment())
                .predictedImpact(aiResponse.getImpact())
                .impactReason(aiResponse.getImpactReason())
                .urgencySignals(joinSignals(aiResponse.getUrgencySignals()))
                .predictionSource(
                    aiResponse.getPredictionSource() != null
                        ? aiResponse.getPredictionSource()
                        : "ZERO_SHOT"
                )
                .confidenceScore(
                    aiResponse.getConfidenceScore() != null
                        ? aiResponse.getConfidenceScore()
                        : 0.0
                )
                .modelVersion(aiResponse.getModelVersion())
                .decisionStatus(decisionStatus != null ? decisionStatus : "FALLBACK")
                .aiApplied(aiApplied)
                .agentCorrected(false)
                .embeddingGenerated(false)
                .build();

        aiPredictionRepository.save(prediction);
        log.info("[AIPrediction] Saved initial prediction for ticket #{}: cat={}, prio={}, src={}, conf={:.2f}",
                ticketId,
                aiResponse.getCategory(),
                aiResponse.getPriority(),
                aiResponse.getPredictionSource(),
                aiResponse.getConfidenceScore() != null ? aiResponse.getConfidenceScore() : 0.0
        );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // APPLY CORRECTION
    // ──────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AIFeedbackResponse applyCorrection(AIFeedbackRequest request) {
        // 1. Lấy prediction mới nhất của ticket này
        AIPrediction latestPrediction = aiPredictionRepository
                .findTopByTicketIdOrderByCreatedAtDesc(request.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No AI prediction found for ticket #" + request.getTicketId()
                ));

        // 2. Resolve effective corrected values
        //    null từ request = Agent không sửa field đó → dùng predicted value
        String effectiveCorrectedCategory = resolveCorrection(
                request.getCorrectedCategory(),
                latestPrediction.getPredictedCategory()
        );
        String effectiveCorrectedPriority = resolveCorrection(
                request.getCorrectedPriority(),
                latestPrediction.getPredictedPriority()
        );

        // 3. So sánh để xác định agentCorrected
        boolean categoryChanged = !Objects.equals(
                latestPrediction.getPredictedCategory(),
                effectiveCorrectedCategory
        );
        boolean priorityChanged = !Objects.equals(
                latestPrediction.getPredictedPriority(),
                effectiveCorrectedPriority
        );
        boolean agentCorrected = categoryChanged || priorityChanged;

        // 4. Tạo correction record MỚI (không overwrite latestPrediction)
        AIPrediction correctionRecord = AIPrediction.builder()
                .ticketId(latestPrediction.getTicketId())
                .title(latestPrediction.getTitle())
                .description(latestPrediction.getDescription())
                .ticketText(latestPrediction.getTicketText())
                // Giữ nguyên prediction gốc
                .predictedCategory(latestPrediction.getPredictedCategory())
                .predictedPriority(latestPrediction.getPredictedPriority())
                .predictedSentiment(latestPrediction.getPredictedSentiment())
                .predictedImpact(latestPrediction.getPredictedImpact())
                .impactReason(latestPrediction.getImpactReason())
                .urgencySignals(latestPrediction.getUrgencySignals())
                .predictionSource(latestPrediction.getPredictionSource())
                .confidenceScore(latestPrediction.getConfidenceScore())
                .modelVersion(latestPrediction.getModelVersion())
                .decisionStatus(latestPrediction.getDecisionStatus())
                .aiApplied(latestPrediction.getAiApplied())
                // Correction
                .correctedCategory(effectiveCorrectedCategory)
                .correctedPriority(effectiveCorrectedPriority)
                .agentCorrected(agentCorrected)
                .embeddingGenerated(false)
                .build();

        AIPrediction saved = aiPredictionRepository.save(correctionRecord);

        log.info("[AIPrediction] Correction for ticket #{}: cat {} → {}, prio {} → {}, agentCorrected={}",
                request.getTicketId(),
                latestPrediction.getPredictedCategory(), effectiveCorrectedCategory,
                latestPrediction.getPredictedPriority(), effectiveCorrectedPriority,
                agentCorrected
        );

        // 5. Build response
        String message = agentCorrected
                ? "Correction recorded. AI prediction updated with agent feedback."
                : "AI prediction confirmed correct. No changes needed.";

        return AIFeedbackResponse.builder()
                .predictionId(saved.getId())
                .ticketId(saved.getTicketId())
                .predictedCategory(saved.getPredictedCategory())
                .correctedCategory(saved.getCorrectedCategory())
                .predictedPriority(saved.getPredictedPriority())
                .correctedPriority(saved.getCorrectedPriority())
                .predictedImpact(saved.getPredictedImpact())
                .impactReason(saved.getImpactReason())
                .urgencySignals(saved.getUrgencySignals())
                .predictionSource(saved.getPredictionSource())
                .confidenceScore(saved.getConfidenceScore())
                .modelVersion(saved.getModelVersion())
                .decisionStatus(saved.getDecisionStatus())
                .aiApplied(saved.getAiApplied())
                .agentCorrected(saved.getAgentCorrected())
                .createdAt(saved.getCreatedAt())
                .message(message)
                .build();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ACCURACY ANALYTICS
    // ──────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public AIAccuracyStatsDto getAccuracyStats() {
        // Category accuracy
        List<Object[]> catRows   = aiPredictionRepository.getCategoryAccuracyStats();
        List<Object[]> prioRows  = aiPredictionRepository.getPriorityAccuracyStats();
        List<Object[]> srcRows   = aiPredictionRepository.getSourceAccuracyStats();

        long totalVerified  = aiPredictionRepository.countVerifiedPredictions();
        long totalCorrected = aiPredictionRepository.countCorrectedPredictions();
        long totalCorrect   = aiPredictionRepository.countFullyCorrectPredictions();

        Map<String, Double> categoryAccuracy      = new LinkedHashMap<>();
        Map<String, Long>   categoryVerifiedCount = new LinkedHashMap<>();

        long catTotalVerified = 0;
        long catTotalCorrect  = 0;

        for (Object[] row : catRows) {
            String category       = (String) row[0];
            long   totalV         = toLong(row[1]);
            long   correctCount   = toLong(row[2]);
            double accuracy       = totalV > 0 ? round2((correctCount * 100.0) / totalV) : 0.0;

            categoryAccuracy.put(category, accuracy);
            categoryVerifiedCount.put(category, totalV);
            catTotalVerified += totalV;
            catTotalCorrect  += correctCount;
        }

        double overallCategoryAccuracy = catTotalVerified > 0
                ? round2((catTotalCorrect * 100.0) / catTotalVerified)
                : 0.0;

        Map<String, Double> priorityAccuracy      = new LinkedHashMap<>();
        Map<String, Long>   priorityVerifiedCount = new LinkedHashMap<>();

        long prioTotalVerified = 0;
        long prioTotalCorrect  = 0;

        for (Object[] row : prioRows) {
            String priority     = (String) row[0];
            long   totalV       = toLong(row[1]);
            long   correctCount = toLong(row[2]);
            double accuracy     = totalV > 0 ? round2((correctCount * 100.0) / totalV) : 0.0;

            priorityAccuracy.put(priority, accuracy);
            priorityVerifiedCount.put(priority, totalV);
            prioTotalVerified += totalV;
            prioTotalCorrect  += correctCount;
        }

        double overallPriorityAccuracy = prioTotalVerified > 0
                ? round2((prioTotalCorrect * 100.0) / prioTotalVerified)
                : 0.0;

        Map<String, Double> sourceAccuracy      = new LinkedHashMap<>();
        Map<String, Long>   sourceVerifiedCount = new LinkedHashMap<>();

        for (Object[] row : srcRows) {
            String source       = (String) row[0];
            long   totalV       = toLong(row[1]);
            long   correctCount = toLong(row[2]);
            double accuracy     = totalV > 0 ? round2((correctCount * 100.0) / totalV) : 0.0;

            sourceAccuracy.put(source, accuracy);
            sourceVerifiedCount.put(source, totalV);
        }

        return AIAccuracyStatsDto.builder()
                .categoryAccuracy(categoryAccuracy)
                .categoryVerifiedCount(categoryVerifiedCount)
                .priorityAccuracy(priorityAccuracy)
                .priorityVerifiedCount(priorityVerifiedCount)
                .sourceAccuracy(sourceAccuracy)
                .sourceVerifiedCount(sourceVerifiedCount)
                .overallCategoryAccuracy(overallCategoryAccuracy)
                .overallPriorityAccuracy(overallPriorityAccuracy)
                .totalVerified(totalVerified)
                .totalCorrected(totalCorrected)
                .totalCorrect(totalCorrect)
                .build();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ──────────────────────────────────────────────────────────────────────────

    private String buildTicketText(String title, String description) {
        return String.format("Title: %s. Description: %s",
                title != null ? title.trim() : "",
                description != null ? description.trim() : ""
        );
    }

    /**
     * Resolve correction value.
     * Nếu agentValue null hoặc blank → giữ nguyên predictedValue (AI đúng).
     */
    private String resolveCorrection(String agentValue, String predictedValue) {
        if (agentValue == null || agentValue.trim().isEmpty()) {
            return predictedValue;
        }
        return agentValue.trim().toUpperCase();
    }

    private String joinSignals(List<String> signals) {
        if (signals == null || signals.isEmpty()) {
            return null;
        }
        return String.join(" | ", signals);
    }

    private long toLong(Object value) {
        if (value instanceof Long) return (Long) value;
        if (value instanceof Number) return ((Number) value).longValue();
        return 0L;
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
