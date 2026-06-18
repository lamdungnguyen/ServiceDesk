package com.servicedesk.ticket.controller;

import com.servicedesk.ticket.dto.AIFeedbackRequest;
import com.servicedesk.ticket.dto.AIFeedbackResponse;
import com.servicedesk.ticket.entity.AIPrediction;
import com.servicedesk.ticket.repository.AIPredictionRepository;
import com.servicedesk.ticket.service.AIPredictionService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * REST API cho Agent Correction Feedback và CSV Export.
 *
 * Endpoints:
 *   POST   /api/v1/ai-feedback          — Agent submit correction
 *   GET    /api/v1/ai-feedback/export/csv — Export training data
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ai-feedback")
@RequiredArgsConstructor
public class AIFeedbackController {

    private final AIPredictionService aiPredictionService;
    private final AIPredictionRepository aiPredictionRepository;

    // ──────────────────────────────────────────────────────────────────────────
    // POST /api/v1/ai-feedback — Agent Submit Correction
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Agent submit correction cho AI prediction.
     *
     * Body:
     * {
     *   "ticketId": 123,
     *   "correctedCategory": "HARDWARE",   // null nếu đồng ý với AI
     *   "correctedPriority": "HIGH"        // null nếu đồng ý với AI
     * }
     *
     * Quy tắc:
     * - corrected* null = Agent đồng ý với AI
     * - Chỉ set agentCorrected=true khi có field thực sự khác
     * - KHÔNG overwrite prediction cũ — tạo record mới
     */
    @PostMapping
    public ResponseEntity<AIFeedbackResponse> submitFeedback(
            @Valid @RequestBody AIFeedbackRequest request
    ) {
        log.info("[AIFeedback] Agent correction for ticket #{}: cat={}, prio={}",
                request.getTicketId(),
                request.getCorrectedCategory(),
                request.getCorrectedPriority()
        );

        AIFeedbackResponse response = aiPredictionService.applyCorrection(request);
        return ResponseEntity.ok(response);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // GET /api/v1/ai-feedback/ticket/{ticketId} — Lấy prediction mới nhất
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Trả về AI prediction mới nhất cho một ticket.
     * Agent dùng để xem dự đoán AI khi mở ticket.
     * Trả 404 nếu ticket chưa có prediction.
     */
    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<AIPrediction> getLatestPrediction(@PathVariable Long ticketId) {
        return aiPredictionRepository
                .findTopByTicketIdOrderByCreatedAtDesc(ticketId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }



    /**
     * Export training data dưới dạng CSV.
     *
     * Chỉ export records đã được Agent verify (correctedCategory IS NOT NULL).
     * correct_category = correctedCategory nếu AI sai, predictedCategory nếu AI đúng.
     *
     * Columns:
     *   ticket_text, correct_category, correct_priority,
     *   prediction_source, confidence_score, agent_corrected
     *
     * Format: UTF-8 BOM (tương thích Excel + Python pandas)
     *
     * Dùng cho:
     *   - PhoBERT fine-tuning
     *   - XLM-Roberta training
     *   - Dataset analysis
     */
    @GetMapping("/export/csv")
    public void exportTrainingData(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        response.setHeader(
                "Content-Disposition",
                "attachment; filename=\"ai_training_data.csv\""
        );

        List<AIPrediction> records = aiPredictionRepository.findVerifiedPredictionsForExport();

        PrintWriter writer = response.getWriter();

        // UTF-8 BOM — tương thích Excel khi mở file
        writer.write('\uFEFF');

        // Header
        writer.println("ticket_text,correct_category,correct_priority,prediction_source,confidence_score,agent_corrected");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        for (AIPrediction record : records) {
            // correct_category: nếu AI đúng → dùng predictedCategory
            String correctCategory = record.getAgentCorrected()
                    ? record.getCorrectedCategory()
                    : record.getPredictedCategory();

            String correctPriority = record.getAgentCorrected()
                    ? record.getCorrectedPriority()
                    : record.getPredictedPriority();

            writer.println(String.join(",",
                    escapeCsvField(record.getTicketText()),
                    escapeCsvField(correctCategory),
                    escapeCsvField(correctPriority),
                    escapeCsvField(record.getPredictionSource()),
                    String.format("%.4f", record.getConfidenceScore() != null ? record.getConfidenceScore() : 0.0),
                    record.getAgentCorrected() != null ? record.getAgentCorrected().toString() : "false"
            ));
        }

        writer.flush();
        log.info("[AIFeedback] Exported {} training records to CSV", records.size());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Escape CSV field: wrap trong quotes nếu có dấu phẩy, newline, hoặc quotes.
     * Escape double-quote thành hai double-quotes (RFC 4180).
     */
    private String escapeCsvField(String value) {
        if (value == null) return "";
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\n") || escaped.contains("\"")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }
}
