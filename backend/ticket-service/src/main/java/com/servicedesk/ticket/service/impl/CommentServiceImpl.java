package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.CommentCreateRequest;
import com.servicedesk.ticket.dto.CommentResponse;
import com.servicedesk.ticket.entity.Comment;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.enums.UserRole;
import com.servicedesk.ticket.exception.ResourceNotFoundException;
import com.servicedesk.ticket.exception.UnauthorizedAccessException;
import com.servicedesk.ticket.repository.CommentRepository;
import com.servicedesk.ticket.security.UserContext;
import com.servicedesk.ticket.repository.TicketRepository;
import com.servicedesk.ticket.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;

    @Override
    public CommentResponse addComment(CommentCreateRequest request) {
        Ticket ticket = ticketRepository.findById(request.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + request.getTicketId()));

        checkTicketAccess(ticket);

        Comment comment = Comment.builder()
                .ticketId(request.getTicketId())
                .userId(UserContext.getUserId())
                .content(request.getContent())
                .build();

        Comment savedComment = commentRepository.save(comment);
        return mapToResponse(savedComment);
    }

    @Override
    public List<CommentResponse> getCommentsByTicketId(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        checkTicketAccess(ticket);

        return commentRepository.findByTicketId(ticketId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private CommentResponse mapToResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .ticketId(comment.getTicketId())
                .userId(comment.getUserId())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    private void checkTicketAccess(Ticket ticket) {
        Long userId = UserContext.getUserId();
        UserRole role = UserContext.getUserRole();
        
        if (role == UserRole.CUSTOMER && !ticket.getReporterId().equals(userId)) {
            throw new UnauthorizedAccessException("You can only access comments for your own tickets");
        }
        if (role == UserRole.AGENT && (ticket.getAssigneeId() == null || !ticket.getAssigneeId().equals(userId))) {
            throw new UnauthorizedAccessException("You can only access comments for tickets assigned to you");
        }
    }
}
