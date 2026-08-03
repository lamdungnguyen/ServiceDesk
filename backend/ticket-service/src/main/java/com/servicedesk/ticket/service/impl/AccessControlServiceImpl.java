package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.enums.UserRole;
import com.servicedesk.ticket.exception.UnauthorizedAccessException;
import com.servicedesk.ticket.security.UserContext;
import com.servicedesk.ticket.service.AccessControlService;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Objects;

@Service
public class AccessControlServiceImpl implements AccessControlService {

    @Override
    public void requireRole(UserRole... allowedRoles) {
        UserRole role = UserContext.getUserRole();
        if (role == null || Arrays.stream(allowedRoles).noneMatch(allowed -> allowed == role)) {
            throw new UnauthorizedAccessException("You do not have permission to perform this action");
        }
    }

    @Override
    public void requireCanViewTicket(Ticket ticket) {
        if (ticket == null) {
            throw new UnauthorizedAccessException("Ticket not found");
        }
        Long userId = UserContext.getUserId();
        UserRole role = UserContext.getUserRole();

        if (userId == null || role == null) {
            throw new UnauthorizedAccessException("Authentication required");
        }

        if (role == UserRole.ADMIN) {
            return;
        }
        if (role == UserRole.CUSTOMER && Objects.equals(ticket.getReporterId(), userId)) {
            return;
        }
        if (role == UserRole.AGENT && Objects.equals(ticket.getAssigneeId(), userId)) {
            return;
        }

        throw new UnauthorizedAccessException("You can only access tickets assigned to you or owned by you");
    }

    @Override
    public void requireCanUpdateTicket(Ticket ticket) {
        if (ticket == null) {
            throw new UnauthorizedAccessException("Ticket not found");
        }
        Long userId = UserContext.getUserId();
        UserRole role = UserContext.getUserRole();

        if (userId == null || role == null) {
            throw new UnauthorizedAccessException("Authentication required");
        }

        if (role == UserRole.ADMIN) {
            return;
        }
        if (role == UserRole.AGENT && Objects.equals(ticket.getAssigneeId(), userId)) {
            return;
        }
        if (role == UserRole.CUSTOMER) {
            throw new UnauthorizedAccessException("Customers cannot update ticket status");
        }

        throw new UnauthorizedAccessException("Agents can only update tickets assigned to them");
    }

    @Override
    public void requireCanAssignTicket(Long assigneeId) {
        Long userId = UserContext.getUserId();
        UserRole role = UserContext.getUserRole();

        if (userId == null || role == null) {
            throw new UnauthorizedAccessException("Authentication required");
        }

        if (role == UserRole.ADMIN) {
            return;
        }
        if (role == UserRole.AGENT && Objects.equals(assigneeId, userId)) {
            return;
        }
        if (role == UserRole.CUSTOMER) {
            throw new UnauthorizedAccessException("Customers cannot assign tickets");
        }

        throw new UnauthorizedAccessException("Agents can only assign tickets to themselves");
    }
}