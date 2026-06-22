package com.servicedesk.ticket.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/ai-feedback")
@RequiredArgsConstructor
public class AIFeedbackController {

    private final AIPredictionService aiPredictionService;
    private final AIPredictionRepository aiPredictionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping
    public ResponseEntity<AIFeedbackResponse> submitFeedback(
            @Valid @RequestBody AIFeedbackRequest request
    ) {
        log.info("[AIFeedback] Agent correction for ticket #{}: cat={}, prio={}",
                request.getTicketId(),
                request.getCorrectedCategory(),
                request.getCorrectedPriority()
        );

        return ResponseEntity.ok(aiPredictionService.applyCorrection(request));
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<AIPrediction> getLatestPrediction(@PathVariable Long ticketId) {
        return aiPredictionRepository
                .findTopByTicketIdOrderByCreatedAtDesc(ticketId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/export/csv")
    public void exportTrainingData(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"ai_training_data.csv\"");

        List<AIPrediction> records = aiPredictionRepository.findVerifiedPredictionsForExport();
        PrintWriter writer = response.getWriter();
        writer.write('\uFEFF');
        writer.println("ticket_text,correct_category,correct_priority,predicted_category,predicted_priority,predicted_sentiment,predicted_impact,impact_reason,urgency_signals,prediction_source,confidence_score,model_version,agent_corrected,created_at");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        for (AIPrediction record : records) {
            writer.println(String.join(",",
                    escapeCsvField(record.getTicketText()),
                    escapeCsvField(resolveCorrectCategory(record)),
                    escapeCsvField(resolveCorrectPriority(record)),
                    escapeCsvField(record.getPredictedCategory()),
                    escapeCsvField(record.getPredictedPriority()),
                    escapeCsvField(record.getPredictedSentiment()),
                    escapeCsvField(record.getPredictedImpact()),
                    escapeCsvField(record.getImpactReason()),
                    escapeCsvField(record.getUrgencySignals()),
                    escapeCsvField(record.getPredictionSource()),
                    String.format("%.4f", record.getConfidenceScore() != null ? record.getConfidenceScore() : 0.0),
                    escapeCsvField(record.getModelVersion()),
                    record.getAgentCorrected() != null ? record.getAgentCorrected().toString() : "false",
                    escapeCsvField(record.getCreatedAt() != null ? dtf.format(record.getCreatedAt()) : "")
            ));
        }

        writer.flush();
        log.info("[AIFeedback] Exported {} training records to CSV", records.size());
    }

    @GetMapping("/export/jsonl")
    public void exportTrainingDataJsonl(HttpServletResponse response) throws IOException {
        response.setContentType("application/x-ndjson; charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"ai_training_data.jsonl\"");

        List<AIPrediction> records = aiPredictionRepository.findVerifiedPredictionsForExport();
        PrintWriter writer = response.getWriter();

        for (AIPrediction record : records) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("text", record.getTicketText());
            row.put("labels", Map.of(
                    "category", valueOrEmpty(resolveCorrectCategory(record)),
                    "priority", valueOrEmpty(resolveCorrectPriority(record)),
                    "impact", valueOrEmpty(record.getPredictedImpact())
            ));
            row.put("prediction", Map.of(
                    "category", valueOrEmpty(record.getPredictedCategory()),
                    "priority", valueOrEmpty(record.getPredictedPriority()),
                    "sentiment", valueOrEmpty(record.getPredictedSentiment()),
                    "impact", valueOrEmpty(record.getPredictedImpact()),
                    "impactReason", valueOrEmpty(record.getImpactReason()),
                    "urgencySignals", valueOrEmpty(record.getUrgencySignals()),
                    "source", valueOrEmpty(record.getPredictionSource()),
                    "confidenceScore", record.getConfidenceScore() != null ? record.getConfidenceScore() : 0.0,
                    "modelVersion", valueOrEmpty(record.getModelVersion()),
                    "agentCorrected", record.getAgentCorrected() != null && record.getAgentCorrected()
            ));
            row.put("createdAt", record.getCreatedAt() != null ? record.getCreatedAt().toString() : null);
            writer.println(objectMapper.writeValueAsString(row));
        }

        writer.flush();
        log.info("[AIFeedback] Exported {} training records to JSONL", records.size());
    }

    private String escapeCsvField(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\n") || escaped.contains("\r") || escaped.contains("\"")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }

    private String resolveCorrectCategory(AIPrediction record) {
        return record.getCorrectedCategory() != null
                ? record.getCorrectedCategory()
                : record.getPredictedCategory();
    }

    private String resolveCorrectPriority(AIPrediction record) {
        return record.getCorrectedPriority() != null
                ? record.getCorrectedPriority()
                : record.getPredictedPriority();
    }

    private String valueOrEmpty(String value) {
        return value != null ? value : "";
    }
}
