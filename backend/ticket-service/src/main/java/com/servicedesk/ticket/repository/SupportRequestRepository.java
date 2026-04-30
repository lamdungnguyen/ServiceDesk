package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.SupportRequest;
import com.servicedesk.ticket.entity.SupportRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupportRequestRepository extends JpaRepository<SupportRequest, Long> {
    
    List<SupportRequest> findByStatusOrderByCreatedAtDesc(SupportRequestStatus status);
    
    List<SupportRequest> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    
    List<SupportRequest> findByAgentIdOrderByCreatedAtDesc(Long agentId);
    
    Optional<SupportRequest> findByCustomerIdAndStatus(Long customerId, SupportRequestStatus status);
    
    List<SupportRequest> findByStatusIn(List<SupportRequestStatus> statuses);
    
    long countByStatus(SupportRequestStatus status);
}
