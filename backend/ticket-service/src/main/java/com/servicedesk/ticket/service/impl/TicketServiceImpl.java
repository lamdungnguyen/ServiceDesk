package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.TicketCreateRequest;
import com.servicedesk.ticket.dto.TicketResponse;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.exception.ResourceNotFoundException;
import com.servicedesk.ticket.repository.TicketRepository;
import com.servicedesk.ticket.enums.Priority;
import com.servicedesk.ticket.enums.TicketStatus;
import com.servicedesk.ticket.enums.UserRole;
import com.servicedesk.ticket.security.UserContext;
import com.servicedesk.ticket.service.TicketService;
import com.servicedesk.ticket.exception.UnauthorizedAccessException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;

    @Override
    @Transactional
    public TicketResponse createTicket(TicketCreateRequest request) {
        Long userId = UserContext.getUserId();
        UserRole role = UserContext.getUserRole();
        
        if (userId != null && role != UserRole.CUSTOMER) {
            throw new UnauthorizedAccessException("Only CUSTOMER can create tickets when logged in");
        }

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .reporterId(userId)
                .reporterName(userId == null ? request.getReporterName() : null)
                .reporterEmail(userId == null ? request.getReporterEmail() : null)
                .status(TicketStatus.NEW)
                .priority(request.getPriority())
                .category("GENERAL") // Mặc định, sau này AI sẽ quyết định
                .dueDate(calculateDueDate(request.getPriority()))
                .build();

        // TODO: Gọi AI Service để lấy category, priority, suggested_agent
        
        Ticket savedTicket = ticketRepository.save(ticket);
        return mapToResponse(savedTicket);
    }

    @Override
    public TicketResponse getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));
        
        Long userId = UserContext.getUserId();
        UserRole role = UserContext.getUserRole();
        
        if (role == UserRole.CUSTOMER && !ticket.getReporterId().equals(userId)) {
            throw new UnauthorizedAccessException("You can only view your own tickets");
        }
        if (role == UserRole.AGENT && (ticket.getAssigneeId() == null || !ticket.getAssigneeId().equals(userId))) {
            throw new UnauthorizedAccessException("You can only view tickets assigned to you");
        }
        
        return mapToResponse(ticket);
    }

    @Override
    public List<TicketResponse> getAllTickets() {
        Long userId = UserContext.getUserId();
        UserRole role = UserContext.getUserRole();
        
        List<Ticket> tickets;
        if (role == UserRole.CUSTOMER) {
            tickets = ticketRepository.findByReporterId(userId);
        } else if (role == UserRole.AGENT) {
            tickets = ticketRepository.findByAssigneeId(userId);
        } else {
            // ADMIN
            tickets = ticketRepository.findAll();
        }
        
        return tickets.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TicketResponse updateTicketStatus(Long id, TicketStatus status) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));
        
        Long userId = UserContext.getUserId();
        UserRole role = UserContext.getUserRole();
        
        if (role == UserRole.CUSTOMER) {
            throw new UnauthorizedAccessException("Customers cannot update ticket status");
        }
        if (role == UserRole.AGENT && (ticket.getAssigneeId() == null || !ticket.getAssigneeId().equals(userId))) {
            throw new UnauthorizedAccessException("Agents can only update status of tickets assigned to them");
        }
        
        ticket.setStatus(status);
        Ticket updatedTicket = ticketRepository.save(ticket);
        return mapToResponse(updatedTicket);
    }

    @Override
    @Transactional
    public TicketResponse assignTicket(Long id, Long assigneeId) {
        if (UserContext.getUserRole() != UserRole.ADMIN) {
            throw new UnauthorizedAccessException("Only ADMIN can assign tickets");
        }
        
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));
                
        ticket.setAssigneeId(assigneeId);
        
        // Cập nhật trạng thái nếu đang NEW
        if (ticket.getStatus() == TicketStatus.NEW) {
            ticket.setStatus(TicketStatus.ASSIGNED);
        }
        
        Ticket updatedTicket = ticketRepository.save(ticket);
        return mapToResponse(updatedTicket);
    }

    private TicketResponse mapToResponse(Ticket ticket) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .category(ticket.getCategory())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .dueDate(ticket.getDueDate())
                .reporterId(ticket.getReporterId())
                .reporterName(ticket.getReporterName())
                .reporterEmail(ticket.getReporterEmail())
                .assigneeId(ticket.getAssigneeId())
                .build();
    }

    private LocalDateTime calculateDueDate(Priority priority) {
        LocalDateTime now = LocalDateTime.now();
        if (priority == null) return now.plusDays(3);
        switch (priority) {
            case URGENT:
                return now.plusHours(4);
            case HIGH:
                return now.plusHours(24);
            case LOW:
                return now.plusDays(5);
            case MEDIUM:
            default:
                return now.plusDays(3);
        }
    }
}
