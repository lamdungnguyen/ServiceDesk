package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.AgentMiniDashboardDto;
import com.servicedesk.ticket.dto.AgentPerformanceDto;
import com.servicedesk.ticket.dto.SlaStatsDto;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.entity.User;
import com.servicedesk.ticket.enums.TicketStatus;
import com.servicedesk.ticket.enums.UserRole;
import com.servicedesk.ticket.repository.TicketRepository;
import com.servicedesk.ticket.repository.UserRepository;
import com.servicedesk.ticket.security.UserContext;
import com.servicedesk.ticket.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    @Override
    public SlaStatsDto getSlaStats() {
        List<Ticket> allTickets = ticketRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        long totalTickets = allTickets.size();

        long overdue = allTickets.stream()
                .filter(t -> t.getDueDate() != null
                        && now.isAfter(t.getDueDate())
                        && t.getStatus() != TicketStatus.RESOLVED
                        && t.getStatus() != TicketStatus.CLOSED)
                .count();

        long nearDeadline = allTickets.stream()
                .filter(t -> t.getDueDate() != null
                        && !now.isAfter(t.getDueDate())
                        && now.plusMinutes(30).isAfter(t.getDueDate())
                        && t.getStatus() != TicketStatus.RESOLVED
                        && t.getStatus() != TicketStatus.CLOSED)
                .count();

        long onTime = totalTickets - overdue;
        double slaCompliance = totalTickets > 0
                ? Math.round((onTime * 100.0 / totalTickets) * 10.0) / 10.0
                : 100.0;

        return SlaStatsDto.builder()
                .totalTickets(totalTickets)
                .onTime(onTime)
                .overdue(overdue)
                .nearDeadline(nearDeadline)
                .slaCompliance(slaCompliance)
                .build();
    }

    @Override
    public List<AgentPerformanceDto> getAgentPerformance() {
        List<User> agents = userRepository.findByRole(UserRole.AGENT);
        List<Ticket> allTickets = ticketRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        List<AgentPerformanceDto> result = new ArrayList<>();

        for (User agent : agents) {
            List<Ticket> assigned = allTickets.stream()
                    .filter(t -> agent.getId().equals(t.getAssigneeId()))
                    .collect(Collectors.toList());

            long totalAssigned = assigned.size();

            List<Ticket> resolved = assigned.stream()
                    .filter(t -> t.getStatus() == TicketStatus.RESOLVED
                            || t.getStatus() == TicketStatus.CLOSED)
                    .collect(Collectors.toList());

            long totalResolved = resolved.size();

            double avgResolutionTime = resolved.stream()
                    .filter(t -> t.getResolvedAt() != null && t.getCreatedAt() != null)
                    .mapToLong(t -> Duration.between(t.getCreatedAt(), t.getResolvedAt()).toMinutes())
                    .average()
                    .orElse(0.0);

            long overdueTickets = assigned.stream()
                    .filter(t -> t.getDueDate() != null
                            && now.isAfter(t.getDueDate())
                            && t.getStatus() != TicketStatus.RESOLVED
                            && t.getStatus() != TicketStatus.CLOSED)
                    .count();

            result.add(AgentPerformanceDto.builder()
                    .agentId(agent.getId())
                    .name(agent.getName())
                    .totalAssigned(totalAssigned)
                    .totalResolved(totalResolved)
                    .avgResolutionTime(Math.round(avgResolutionTime * 10.0) / 10.0)
                    .overdueTickets(overdueTickets)
                    .build());
        }

        return result;
    }

    @Override
    public AgentMiniDashboardDto getAgentMiniDashboard() {
        Long userId = UserContext.getUserId();
        List<TicketStatus> closedStatuses = Arrays.asList(TicketStatus.RESOLVED, TicketStatus.CLOSED);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);

        long assigned = ticketRepository.countByAssigneeIdAndStatusNotIn(userId, closedStatuses);
        long inProgress = ticketRepository.countByAssigneeIdAndStatus(userId, TicketStatus.IN_PROGRESS);
        long overdue = ticketRepository.countByAssigneeIdAndStatusNotInAndDueDateBefore(userId, closedStatuses, now);
        long resolvedToday = ticketRepository.countByAssigneeIdAndResolvedAtAfter(userId, todayStart);

        return AgentMiniDashboardDto.builder()
                .assigned(assigned)
                .inProgress(inProgress)
                .overdue(overdue)
                .resolvedToday(resolvedToday)
                .build();
    }
}
