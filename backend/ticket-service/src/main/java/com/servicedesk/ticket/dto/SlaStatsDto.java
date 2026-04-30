package com.servicedesk.ticket.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SlaStatsDto {
    private long totalTickets;
    private long onTime;
    private long overdue;
    private long nearDeadline;
    private double slaCompliance;
}
