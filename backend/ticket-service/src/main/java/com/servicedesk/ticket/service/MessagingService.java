package com.servicedesk.ticket.service;

import com.servicedesk.ticket.dto.ConversationDto;
import com.servicedesk.ticket.dto.CreateConversationRequest;
import com.servicedesk.ticket.dto.DirectMessageDto;
import com.servicedesk.ticket.dto.SendDmRequest;

import java.util.List;

public interface MessagingService {
    ConversationDto createConversation(Long creatorId, CreateConversationRequest request);
    List<ConversationDto> getConversationsForUser(Long userId);
    List<DirectMessageDto> getMessages(Long conversationId, Long requestingUserId);
    DirectMessageDto saveMessage(SendDmRequest request);
    void addMember(Long conversationId, Long userId, Long requestingUserId);
    void removeMember(Long conversationId, Long userId, Long requestingUserId);
}
