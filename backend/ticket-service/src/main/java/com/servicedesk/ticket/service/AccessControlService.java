package com.servicedesk.ticket.service;

import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.enums.UserRole;

public interface AccessControlService {
    void requireRole(UserRole... allowedRoles);
    void requireCanViewTicket(Ticket ticket);
    void requireCanUpdateTicket(Ticket ticket);
    void requireCanAssignTicket(Long assigneeId);
}
