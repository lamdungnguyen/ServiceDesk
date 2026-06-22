package com.servicedesk.ticket.service;

import com.servicedesk.ticket.dto.TicketAuditLogResponse;
import com.servicedesk.ticket.dto.SimilarTicketResponse;
import com.servicedesk.ticket.dto.RoutingSuggestionResponse;
import com.servicedesk.ticket.dto.TicketCreateRequest;
import com.servicedesk.ticket.dto.TicketAiSummaryResponse;
import com.servicedesk.ticket.dto.TicketResponse;
import com.servicedesk.ticket.enums.TicketStatus;

import java.util.List;

public interface TicketService {
    TicketResponse createTicket(TicketCreateRequest request);
    TicketResponse getTicketById(Long id);
    List<TicketResponse> getAllTickets();
    List<TicketResponse> getFilteredTickets(String status, String priority, Boolean overdue, String keyword, Boolean assignedToMe);
    TicketResponse updateTicketStatus(Long id, TicketStatus status);
    TicketResponse assignTicket(Long id, Long assigneeId);
    List<TicketResponse> getEscalatedTickets();
    List<TicketAuditLogResponse> getAuditLogsForTicket(Long id);
    List<SimilarTicketResponse> getSimilarTickets(Long id);
    TicketAiSummaryResponse getAiSummary(Long id);
    List<RoutingSuggestionResponse> getRoutingSuggestions(Long id);
    void deleteTicket(Long id);
    void deleteTickets(List<Long> ids);
}
