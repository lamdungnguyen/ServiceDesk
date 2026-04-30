package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {
    List<Ticket> findByAssigneeId(Long assigneeId);
    List<Ticket> findByReporterId(Long reporterId);
    List<Ticket> findByStatus(String status);

    @org.springframework.data.jpa.repository.Query("SELECT t FROM Ticket t WHERE t.status NOT IN ('RESOLVED', 'CLOSED')")
    List<Ticket> findActiveTickets();

    List<Ticket> findByEscalatedTrue();

    List<Ticket> findByAssigneeIdAndStatus(Long assigneeId, com.servicedesk.ticket.enums.TicketStatus status);

    long countByReporterId(Long reporterId);

    long countByReporterIdAndStatusNotIn(Long reporterId, List<com.servicedesk.ticket.enums.TicketStatus> statuses);

    long countByAssigneeIdAndStatusNotIn(Long assigneeId, List<com.servicedesk.ticket.enums.TicketStatus> statuses);

    long countByAssigneeIdAndStatusNotInAndDueDateBefore(Long assigneeId, List<com.servicedesk.ticket.enums.TicketStatus> statuses, LocalDateTime now);

    long countByAssigneeIdAndResolvedAtAfter(Long assigneeId, LocalDateTime since);

    long countByAssigneeIdAndStatus(Long assigneeId, com.servicedesk.ticket.enums.TicketStatus status);
}
