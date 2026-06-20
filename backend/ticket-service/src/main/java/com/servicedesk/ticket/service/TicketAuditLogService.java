package com.servicedesk.ticket.service;

import com.servicedesk.ticket.dto.TicketAuditLogResponse;
import com.servicedesk.ticket.enums.TicketAuditAction;

import java.util.List;

public interface TicketAuditLogService {
    void log(Long ticketId, TicketAuditAction action, String fieldName, String oldValue, String newValue, String details);
    void log(Long ticketId, TicketAuditAction action, String fieldName, String oldValue, String newValue, String details, String actorNameOverride);
    List<TicketAuditLogResponse> getLogsForTicket(Long ticketId);
}
