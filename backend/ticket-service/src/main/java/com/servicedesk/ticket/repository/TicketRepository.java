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
}
