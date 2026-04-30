package com.servicedesk.ticket.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RatingResponse {
    private Long id;
    private Long ticketId;
    private Long agentId;
    private String agentName;
    private Long customerId;
    private String customerName;
    private Integer score;
    private String comment;
    private LocalDateTime createdAt;
}
