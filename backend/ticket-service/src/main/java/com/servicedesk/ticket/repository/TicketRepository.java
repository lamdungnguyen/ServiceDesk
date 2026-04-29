package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByAssigneeId(Long assigneeId);
    List<Ticket> findByReporterId(Long reporterId);
    List<Ticket> findByStatus(String status);
    
    @org.springframework.data.jpa.repository.Query("SELECT t FROM Ticket t WHERE t.status NOT IN ('RESOLVED', 'CLOSED')")
    List<Ticket> findActiveTickets();
}
