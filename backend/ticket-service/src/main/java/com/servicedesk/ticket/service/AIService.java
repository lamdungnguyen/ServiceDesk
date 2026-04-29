package com.servicedesk.ticket.service;

import com.servicedesk.ticket.dto.AIResponse;

public interface AIService {
    AIResponse analyzeTicket(String title, String description);
}
