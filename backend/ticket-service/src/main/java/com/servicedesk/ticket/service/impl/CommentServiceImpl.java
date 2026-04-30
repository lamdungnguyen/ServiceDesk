package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.CommentCreateRequest;
import com.servicedesk.ticket.dto.CommentResponse;
import com.servicedesk.ticket.entity.Comment;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.enums.UserRole;
import com.servicedesk.ticket.exception.ResourceNotFoundException;
import com.servicedesk.ticket.exception.UnauthorizedAccessException;
import com.servicedesk.ticket.repository.CommentRepository;
import com.servicedesk.ticket.repository.UserRepository;
import com.servicedesk.ticket.security.UserContext;
import com.servicedesk.ticket.repository.TicketRepository;
import com.servicedesk.ticket.service.CommentService;
import com.servicedesk.ticket.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

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

        // Notification Logic
        Long currentUserId = UserContext.getUserId();
        UserRole role = UserContext.getUserRole();
        
        if (role == UserRole.CUSTOMER && ticket.getAssigneeId() != null) {
            notificationService.createNotification(
                    ticket.getAssigneeId(),
                    "New comment from customer on ticket #" + ticket.getId(),
                    "INFO",
                    ticket.getId()
            );
        } else if (role == UserRole.AGENT && ticket.getReporterId() != null) {
            notificationService.createNotification(
                    ticket.getReporterId(),
                    "New comment from agent on ticket #" + ticket.getId(),
                    "INFO",
                    ticket.getId()
            );
        }

        return mapToResponse(savedComment);
    }

    @Override
    public List<CommentResponse> getCommentsByTicketId(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        checkTicketAccess(ticket);

        List<Comment> comments = commentRepository.findByTicketId(ticketId);
        
        List<Long> userIds = comments.stream()
                .map(Comment::getUserId)
                .distinct()
                .collect(Collectors.toList());
                
        java.util.Map<Long, String> userNames = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(
                        com.servicedesk.ticket.entity.User::getId, 
                        com.servicedesk.ticket.entity.User::getName
                ));

        return comments.stream()
                .map(comment -> mapToResponse(comment, userNames.getOrDefault(comment.getUserId(), "User " + comment.getUserId())))
                .collect(Collectors.toList());
    }

    private CommentResponse mapToResponse(Comment comment) {
        String authorName = userRepository.findById(comment.getUserId())
                .map(u -> u.getName())
                .orElse("User " + comment.getUserId());
        return mapToResponse(comment, authorName);
    }

    private CommentResponse mapToResponse(Comment comment, String authorName) {
        return CommentResponse.builder()
                .id(comment.getId())
                .ticketId(comment.getTicketId())
                .userId(comment.getUserId())
                .authorId(comment.getUserId())
                .authorName(authorName)
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
