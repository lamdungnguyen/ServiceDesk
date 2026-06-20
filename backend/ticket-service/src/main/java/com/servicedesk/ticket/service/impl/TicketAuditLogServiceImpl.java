package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.TicketAuditLogResponse;
import com.servicedesk.ticket.entity.TicketAuditLog;
import com.servicedesk.ticket.enums.TicketAuditAction;
import com.servicedesk.ticket.repository.TicketAuditLogRepository;
import com.servicedesk.ticket.security.UserContext;
import com.servicedesk.ticket.service.TicketAuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketAuditLogServiceImpl implements TicketAuditLogService {

    private final TicketAuditLogRepository ticketAuditLogRepository;

    @Override
    public void log(Long ticketId, TicketAuditAction action, String fieldName, String oldValue, String newValue, String details) {
        log(ticketId, action, fieldName, oldValue, newValue, details, null);
    }

    @Override
    @Transactional
    public void log(Long ticketId, TicketAuditAction action, String fieldName, String oldValue, String newValue, String details, String actorNameOverride) {
        if (ticketId == null || action == null) {
            return;
        }

        Long actorId = UserContext.getUserId();
        String actorName = actorNameOverride;
        if (actorName == null || actorName.trim().isEmpty()) {
            actorName = UserContext.getUsername();
        }
        if (actorName == null || actorName.trim().isEmpty()) {
            actorName = actorId == null ? "Guest" : "User " + actorId;
        }

        TicketAuditLog auditLog = TicketAuditLog.builder()
                .ticketId(ticketId)
                .actorId(actorId)
                .actorName(actorName)
                .actorRole(UserContext.getUserRole())
                .action(action)
                .fieldName(fieldName)
                .oldValue(oldValue)
                .newValue(newValue)
                .details(details)
                .build();

        ticketAuditLogRepository.save(auditLog);
    }

    @Override
    public List<TicketAuditLogResponse> getLogsForTicket(Long ticketId) {
        return ticketAuditLogRepository.findByTicketIdOrderByCreatedAtAscIdAsc(ticketId).stream()
                .map(TicketAuditLogResponse::from)
                .collect(Collectors.toList());
    }
}
