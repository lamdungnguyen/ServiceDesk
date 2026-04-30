package com.servicedesk.ticket.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AgentMiniDashboardDto {
    private long assigned;
    private long inProgress;
    private long overdue;
    private long resolvedToday;
}
