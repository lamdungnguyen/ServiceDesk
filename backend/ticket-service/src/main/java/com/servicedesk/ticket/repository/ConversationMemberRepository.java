package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.ConversationMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConversationMemberRepository extends JpaRepository<ConversationMember, Long> {
    List<ConversationMember> findByConversationId(Long conversationId);
    boolean existsByConversationIdAndUserId(Long conversationId, Long userId);
    void deleteByConversationIdAndUserId(Long conversationId, Long userId);
}
