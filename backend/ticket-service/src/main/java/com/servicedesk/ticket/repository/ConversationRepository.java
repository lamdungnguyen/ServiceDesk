package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("SELECT c FROM Conversation c WHERE c.id IN " +
           "(SELECT m.conversationId FROM ConversationMember m WHERE m.userId = :userId) " +
           "ORDER BY c.createdAt DESC")
    List<Conversation> findByMemberId(@Param("userId") Long userId);

    @Query("SELECT c FROM Conversation c WHERE c.type = 'DM' AND c.id IN " +
           "(SELECT m.conversationId FROM ConversationMember m WHERE m.userId = :userId1) " +
           "AND c.id IN " +
           "(SELECT m.conversationId FROM ConversationMember m WHERE m.userId = :userId2)")
    List<Conversation> findDmBetween(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}
