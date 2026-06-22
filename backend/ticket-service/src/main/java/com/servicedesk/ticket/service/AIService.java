package com.servicedesk.ticket.service;

import com.servicedesk.ticket.dto.AIResponse;
import com.servicedesk.ticket.dto.AITicketSummaryRequest;
import com.servicedesk.ticket.dto.TicketAiSummaryResponse;

public interface AIService {
    AIResponse analyzeTicket(String title, String description);
    TicketAiSummaryResponse summarizeTicket(AITicketSummaryRequest request);
}
