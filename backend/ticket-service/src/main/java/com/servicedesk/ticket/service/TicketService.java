package com.servicedesk.ticket.service;

import com.servicedesk.ticket.dto.TicketCreateRequest;
import com.servicedesk.ticket.dto.TicketResponse;
import com.servicedesk.ticket.enums.TicketStatus;

import java.util.List;

public interface TicketService {
    TicketResponse createTicket(TicketCreateRequest request);
    TicketResponse getTicketById(Long id);
    List<TicketResponse> getAllTickets();
    List<TicketResponse> getFilteredTickets(String status, String priority, Boolean overdue, String keyword);
    TicketResponse updateTicketStatus(Long id, TicketStatus status);
    TicketResponse assignTicket(Long id, Long assigneeId);
    List<TicketResponse> getEscalatedTickets();
}
