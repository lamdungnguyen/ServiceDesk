package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {

    Optional<Rating> findByTicketId(Long ticketId);

    List<Rating> findByAgentIdOrderByCreatedAtDesc(Long agentId);

    List<Rating> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    @Query("SELECT AVG(r.score) FROM Rating r WHERE r.agentId = :agentId")
    Double getAverageScoreByAgentId(@Param("agentId") Long agentId);

    @Query("SELECT COUNT(r) FROM Rating r WHERE r.agentId = :agentId")
    Long countByAgentId(@Param("agentId") Long agentId);

    @Query("SELECT r.agentId, AVG(r.score), COUNT(r) FROM Rating r GROUP BY r.agentId")
    List<Object[]> getAgentRatingStats();
}
