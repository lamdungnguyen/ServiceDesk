package com.servicedesk.ticket.service;

import com.servicedesk.ticket.dto.AgentMiniDashboardDto;
import com.servicedesk.ticket.dto.AgentPerformanceDto;
import com.servicedesk.ticket.dto.SlaStatsDto;

import java.util.List;

public interface DashboardService {
    SlaStatsDto getSlaStats();
    List<AgentPerformanceDto> getAgentPerformance();
    AgentMiniDashboardDto getAgentMiniDashboard();
}
