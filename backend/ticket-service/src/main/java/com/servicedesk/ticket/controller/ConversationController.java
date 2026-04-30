package com.servicedesk.ticket.controller;

import com.servicedesk.ticket.dto.ConversationDto;
import com.servicedesk.ticket.dto.CreateConversationRequest;
import com.servicedesk.ticket.dto.DirectMessageDto;
import com.servicedesk.ticket.service.MessagingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConversationController {

    private final MessagingService messagingService;

    @PostMapping("/conversations")
    public ResponseEntity<ConversationDto> createConversation(
            @RequestParam Long creatorId,
            @RequestBody CreateConversationRequest request) {
        return ResponseEntity.ok(messagingService.createConversation(creatorId, request));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDto>> getConversations(@RequestParam Long userId) {
        return ResponseEntity.ok(messagingService.getConversationsForUser(userId));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<DirectMessageDto>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(messagingService.getMessages(conversationId, userId));
    }

    @PostMapping("/conversations/{conversationId}/members")
    public ResponseEntity<Void> addMember(
            @PathVariable Long conversationId,
            @RequestParam Long userId,
            @RequestParam Long requestingUserId) {
        messagingService.addMember(conversationId, userId, requestingUserId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/conversations/{conversationId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long conversationId,
            @PathVariable Long userId,
            @RequestParam Long requestingUserId) {
        messagingService.removeMember(conversationId, userId, requestingUserId);
        return ResponseEntity.ok().build();
    }
}
