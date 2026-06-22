package com.servicedesk.ticket.service;

import com.servicedesk.ticket.dto.AIAccuracyStatsDto;
import com.servicedesk.ticket.dto.AIFeedbackRequest;
import com.servicedesk.ticket.dto.AIFeedbackResponse;
import com.servicedesk.ticket.dto.AIResponse;

/**
 * Service quản lý AI Prediction lifecycle:
 * - Lưu prediction ban đầu khi tạo ticket
 * - Ghi nhận correction của Agent
 * - Cung cấp data cho analytics dashboard
 * - Export training data
 */
public interface AIPredictionService {

    /**
     * Lưu AI prediction ban đầu ngay sau khi tạo ticket.
     * Gọi từ TicketServiceImpl.createTicket().
     *
     * @param ticketId   ID ticket vừa được tạo
     * @param title      Tiêu đề ticket
     * @param description Mô tả ticket
     * @param aiResponse Full AI response (category, priority, sentiment, source, confidence)
     */
    void saveInitialPrediction(Long ticketId, String title, String description, AIResponse aiResponse);

    void saveInitialPrediction(
            Long ticketId,
            String title,
            String description,
            AIResponse aiResponse,
            String decisionStatus,
            boolean aiApplied
    );

    /**
     * Ghi nhận correction của Agent.
     * Tạo record mới — KHÔNG overwrite prediction cũ.
     *
     * Logic:
     * - Lấy prediction mới nhất theo ticketId
     * - So sánh predicted vs corrected
     * - Nếu khác: agentCorrected=true
     * - Nếu giống hoặc null: agentCorrected=false (AI đúng)
     *
     * @param request Correction request từ Agent
     * @return Response với đầy đủ thông tin correction
     */
    AIFeedbackResponse applyCorrection(AIFeedbackRequest request);

    /**
     * Tính AI accuracy statistics.
     * CHỈ tính trên verified records (Agent đã xem xét).
     */
    AIAccuracyStatsDto getAccuracyStats();
}
