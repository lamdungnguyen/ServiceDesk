package com.servicedesk.ticket.dto;

import com.servicedesk.ticket.entity.TicketAuditLog;
import com.servicedesk.ticket.enums.TicketAuditAction;
import com.servicedesk.ticket.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TicketAuditLogResponse {
    private Long id;
    private Long ticketId;
    private Long actorId;
    private String actorName;
    private UserRole actorRole;
    private TicketAuditAction action;
    private String fieldName;
    private String oldValue;
    private String newValue;
    private String details;
    private LocalDateTime createdAt;

    public static TicketAuditLogResponse from(TicketAuditLog log) {
        return TicketAuditLogResponse.builder()
                .id(log.getId())
                .ticketId(log.getTicketId())
                .actorId(log.getActorId())
                .actorName(log.getActorName())
                .actorRole(log.getActorRole())
                .action(log.getAction())
                .fieldName(log.getFieldName())
                .oldValue(log.getOldValue())
                .newValue(log.getNewValue())
                .details(log.getDetails())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
