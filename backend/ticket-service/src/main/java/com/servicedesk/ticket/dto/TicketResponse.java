package com.servicedesk.ticket.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import com.servicedesk.ticket.enums.TicketStatus;
import com.servicedesk.ticket.enums.Priority;

@Data
@Builder
public class TicketResponse {
    private Long id;
    private String title;
    private String description;
    private TicketStatus status;
    private Priority priority;
    private String category;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime dueDate;
    private Long reporterId;
    private String reporterName;
    private String reporterEmail;
    private Long assigneeId;
    private Boolean escalated;
    private LocalDateTime resolvedAt;
}
