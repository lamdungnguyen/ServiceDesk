package com.servicedesk.ticket.controller;

import com.servicedesk.ticket.dto.AgentMiniDashboardDto;
import com.servicedesk.ticket.dto.AgentPerformanceDto;
import com.servicedesk.ticket.dto.SlaStatsDto;
import com.servicedesk.ticket.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/sla")
    public ResponseEntity<SlaStatsDto> getSlaStats() {
        return ResponseEntity.ok(dashboardService.getSlaStats());
    }

    @GetMapping("/agents")
    public ResponseEntity<List<AgentPerformanceDto>> getAgentPerformance() {
        return ResponseEntity.ok(dashboardService.getAgentPerformance());
    }

    @GetMapping("/agent/me")
    public ResponseEntity<AgentMiniDashboardDto> getAgentMiniDashboard() {
        return ResponseEntity.ok(dashboardService.getAgentMiniDashboard());
    }
}
