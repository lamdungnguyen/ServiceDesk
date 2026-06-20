package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.TicketAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketAuditLogRepository extends JpaRepository<TicketAuditLog, Long> {
    List<TicketAuditLog> findByTicketIdOrderByCreatedAtAscIdAsc(Long ticketId);
}
