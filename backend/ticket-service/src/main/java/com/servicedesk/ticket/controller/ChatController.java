package com.servicedesk.ticket.controller;

import com.servicedesk.ticket.dto.ChatMessage;
import com.servicedesk.ticket.entity.Comment;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.entity.User;
import com.servicedesk.ticket.repository.CommentRepository;
import com.servicedesk.ticket.repository.TicketRepository;
import com.servicedesk.ticket.repository.UserRepository;
import com.servicedesk.ticket.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        log.info("Chat message received for ticket #{}: {}", chatMessage.getTicketId(), chatMessage.getContent());

        // Resolve sender name from DB if not provided
        String senderName = chatMessage.getSenderName();
        if (senderName == null || senderName.isBlank()) {
            senderName = userRepository.findById(chatMessage.getSenderId())
                    .map(User::getName)
                    .orElse("User");
            chatMessage.setSenderName(senderName);
        }

        // Save to Comment table
        Comment comment = Comment.builder()
                .ticketId(chatMessage.getTicketId())
                .userId(chatMessage.getSenderId())
                .content(chatMessage.getContent())
                .build();
        Comment saved = commentRepository.save(comment);

        // Set DB-generated fields on the response
        chatMessage.setId(saved.getId());
        chatMessage.setTimestamp(saved.getCreatedAt() != null
                ? saved.getCreatedAt().toString()
                : LocalDateTime.now().toString());

        // Broadcast to all subscribers of this ticket's topic
        String destination = "/topic/ticket/" + chatMessage.getTicketId();
        messagingTemplate.convertAndSend(destination, chatMessage);

        // Send notification to the other party
        try {
            Ticket ticket = ticketRepository.findById(chatMessage.getTicketId()).orElse(null);
            if (ticket != null) {
                Long senderId = chatMessage.getSenderId();
                String notifMessage = senderName + " sent a message on ticket #" + ticket.getId();

                // Notify assignee if sender is reporter (customer)
                if (ticket.getReporterId() != null && ticket.getReporterId().equals(senderId)) {
                    if (ticket.getAssigneeId() != null) {
                        notificationService.createNotification(
                                ticket.getAssigneeId(), notifMessage, "MESSAGE", ticket.getId());
                    }
                }
                // Notify reporter if sender is assignee (agent)
                else if (ticket.getAssigneeId() != null && ticket.getAssigneeId().equals(senderId)) {
                    if (ticket.getReporterId() != null) {
                        notificationService.createNotification(
                                ticket.getReporterId(), notifMessage, "MESSAGE", ticket.getId());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to send chat notification for ticket #{}", chatMessage.getTicketId(), e);
        }

        log.info("Message broadcast to {}", destination);
    }
}
