package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.TicketCustomFieldValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketCustomFieldValueRepository extends JpaRepository<TicketCustomFieldValue, Long> {
    List<TicketCustomFieldValue> findByTicketId(Long ticketId);
}
