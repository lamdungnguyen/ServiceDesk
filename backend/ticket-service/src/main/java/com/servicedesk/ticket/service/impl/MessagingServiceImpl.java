package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.ConversationDto;
import com.servicedesk.ticket.dto.CreateConversationRequest;
import com.servicedesk.ticket.dto.DirectMessageDto;
import com.servicedesk.ticket.dto.SendDmRequest;
import com.servicedesk.ticket.entity.Conversation;
import com.servicedesk.ticket.entity.ConversationMember;
import com.servicedesk.ticket.entity.DirectMessage;
import com.servicedesk.ticket.entity.User;
import com.servicedesk.ticket.repository.ConversationMemberRepository;
import com.servicedesk.ticket.repository.ConversationRepository;
import com.servicedesk.ticket.repository.DirectMessageRepository;
import com.servicedesk.ticket.repository.UserRepository;
import com.servicedesk.ticket.service.MessagingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessagingServiceImpl implements MessagingService {

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository memberRepository;
    private final DirectMessageRepository messageRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ConversationDto createConversation(Long creatorId, CreateConversationRequest request) {
        String type = request.getType() != null ? request.getType() : "DM";

        // For DM: reuse existing conversation if one already exists
        if ("DM".equals(type) && request.getMemberIds() != null && request.getMemberIds().size() == 1) {
            Long otherId = request.getMemberIds().get(0);
            List<Conversation> existing = conversationRepository.findDmBetween(creatorId, otherId);
            if (!existing.isEmpty()) {
                return toDto(existing.get(0), buildMemberInfos(existing.get(0).getId()), null);
            }
        }

        Conversation conversation = Conversation.builder()
                .name(request.getName())
                .type(type)
                .createdBy(creatorId)
                .build();
        conversation = conversationRepository.save(conversation);

        // Add creator
        memberRepository.save(ConversationMember.builder()
                .conversationId(conversation.getId())
                .userId(creatorId)
                .build());

        // Add other members
        if (request.getMemberIds() != null) {
            for (Long memberId : request.getMemberIds()) {
                if (!memberId.equals(creatorId)) {
                    memberRepository.save(ConversationMember.builder()
                            .conversationId(conversation.getId())
                            .userId(memberId)
                            .build());
                }
            }
        }

        return toDto(conversation, buildMemberInfos(conversation.getId()), null);
    }

    @Override
    public List<ConversationDto> getConversationsForUser(Long userId) {
        List<Conversation> conversations = conversationRepository.findByMemberId(userId);
        return conversations.stream()
                .map(c -> {
                    List<ConversationDto.MemberInfo> members = buildMemberInfos(c.getId());
                    List<DirectMessage> msgs = messageRepository.findByConversationIdOrderByCreatedAtAsc(c.getId());
                    DirectMessageDto last = msgs.isEmpty() ? null : toMessageDto(msgs.get(msgs.size() - 1));
                    return toDto(c, members, last);
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<DirectMessageDto> getMessages(Long conversationId, Long requestingUserId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(this::toMessageDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DirectMessageDto saveMessage(SendDmRequest request) {
        // Resolve sender name if missing
        String senderName = request.getSenderName();
        if (senderName == null || senderName.isBlank()) {
            senderName = userRepository.findById(request.getSenderId())
                    .map(User::getName)
                    .orElse("User");
        }

        DirectMessage msg = DirectMessage.builder()
                .conversationId(request.getConversationId())
                .senderId(request.getSenderId())
                .senderName(senderName)
                .content(request.getContent())
                .messageType(request.getMessageType() != null ? request.getMessageType() : "TEXT")
                .fileUrl(request.getFileUrl())
                .fileName(request.getFileName())
                .build();
        return toMessageDto(messageRepository.save(msg));
    }

    @Override
    @Transactional
    public void addMember(Long conversationId, Long userId, Long requestingUserId) {
        if (!memberRepository.existsByConversationIdAndUserId(conversationId, userId)) {
            memberRepository.save(ConversationMember.builder()
                    .conversationId(conversationId)
                    .userId(userId)
                    .build());
        }
    }

    @Override
    @Transactional
    public void removeMember(Long conversationId, Long userId, Long requestingUserId) {
        memberRepository.deleteByConversationIdAndUserId(conversationId, userId);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private List<ConversationDto.MemberInfo> buildMemberInfos(Long conversationId) {
        List<ConversationMember> members = memberRepository.findByConversationId(conversationId);
        List<Long> userIds = members.stream().map(ConversationMember::getUserId).collect(Collectors.toList());
        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<ConversationDto.MemberInfo> result = new ArrayList<>();
        for (ConversationMember m : members) {
            User u = userMap.get(m.getUserId());
            String roleStr = "";
            if (u != null && u.getRole() != null) {
                roleStr = u.getRole().name();
            }
            result.add(ConversationDto.MemberInfo.builder()
                    .userId(m.getUserId())
                    .userName(u != null ? u.getName() : "Unknown")
                    .userRole(roleStr)
                    .build());
        }
        return result;
    }

    private ConversationDto toDto(Conversation c, List<ConversationDto.MemberInfo> members, DirectMessageDto last) {
        return ConversationDto.builder()
                .id(c.getId())
                .name(c.getName())
                .type(c.getType())
                .createdBy(c.getCreatedBy())
                .createdAt(c.getCreatedAt())
                .members(members)
                .lastMessage(last)
                .build();
    }

    private DirectMessageDto toMessageDto(DirectMessage m) {
        return DirectMessageDto.builder()
                .id(m.getId())
                .conversationId(m.getConversationId())
                .senderId(m.getSenderId())
                .senderName(m.getSenderName())
                .content(m.getContent())
                .messageType(m.getMessageType())
                .fileUrl(m.getFileUrl())
                .fileName(m.getFileName())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
