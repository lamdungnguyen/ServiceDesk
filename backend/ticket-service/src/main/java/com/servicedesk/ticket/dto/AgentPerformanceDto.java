package com.servicedesk.ticket.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AgentPerformanceDto {
    private Long agentId;
    private String name;
    private long totalAssigned;
    private long totalResolved;
    private double avgResolutionTime;
    private long overdueTickets;
}
