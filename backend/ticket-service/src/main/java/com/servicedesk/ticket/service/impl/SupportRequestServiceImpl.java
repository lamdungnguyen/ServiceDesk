package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.CreateConversationRequest;
import com.servicedesk.ticket.dto.SupportRequestRequest;
import com.servicedesk.ticket.dto.SupportRequestResponse;
import com.servicedesk.ticket.entity.SupportRequest;
import com.servicedesk.ticket.entity.SupportRequestStatus;
import com.servicedesk.ticket.repository.SupportRequestRepository;
import com.servicedesk.ticket.service.MessagingService;
import com.servicedesk.ticket.service.NotificationService;
import com.servicedesk.ticket.service.SupportRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupportRequestServiceImpl implements SupportRequestService {

    private final SupportRequestRepository supportRequestRepository;
    private final MessagingService messagingService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public SupportRequestResponse createRequest(SupportRequestRequest request, Long customerId, String customerName) {
        // Check if customer already has a waiting/active request
        var existing = supportRequestRepository.findByCustomerIdAndStatus(customerId, SupportRequestStatus.WAITING);
        if (existing.isPresent()) {
            return mapToResponse(existing.get());
        }
        
        var active = supportRequestRepository.findByCustomerIdAndStatus(customerId, SupportRequestStatus.ACTIVE);
        if (active.isPresent()) {
            return mapToResponse(active.get());
        }

        SupportRequest sr = SupportRequest.builder()
                .customerId(customerId)
                .customerName(customerName)
                .topic(request.getTopic())
                .description(request.getDescription())
                .build();

        SupportRequest saved = supportRequestRepository.save(sr);
        SupportRequestResponse response = mapToResponse(saved);

        // Notify agents via WebSocket about new support request
        messagingTemplate.convertAndSend("/topic/support/requests", response);

        // Create notification for all agents
        notificationService.notifyAdmins(
            "New support request: " + customerName + " needs help with " + request.getTopic(),
            "SUPPORT_REQUEST"
        );

        return response;
    }

    @Override
    public List<SupportRequestResponse> getWaitingRequests() {
        return supportRequestRepository.findByStatusOrderByCreatedAtDesc(SupportRequestStatus.WAITING)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<SupportRequestResponse> getMyRequests(Long customerId) {
        return supportRequestRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<SupportRequestResponse> getMyActiveChats(Long agentId) {
        return supportRequestRepository.findByAgentIdOrderByCreatedAtDesc(agentId)
                .stream()
                .filter(sr -> sr.getStatus() == SupportRequestStatus.ACTIVE)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SupportRequestResponse acceptRequest(Long requestId, Long agentId, String agentName) {
        SupportRequest sr = supportRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Support request not found"));

        if (sr.getStatus() != SupportRequestStatus.WAITING) {
            throw new RuntimeException("Request already handled");
        }

        // Create DM conversation between customer and agent
        CreateConversationRequest convRequest = new CreateConversationRequest();
        convRequest.setType("DM");
        convRequest.setMemberIds(Collections.singletonList(sr.getCustomerId()));
        
        var conversation = messagingService.createConversation(agentId, convRequest);

        // Update support request
        sr.setStatus(SupportRequestStatus.ACTIVE);
        sr.setAgentId(agentId);
        sr.setAgentName(agentName);
        sr.setConversationId(conversation.getId());

        SupportRequest saved = supportRequestRepository.save(sr);
        SupportRequestResponse response = mapToResponse(saved);

        // Notify customer that agent has joined
        notificationService.createNotification(
            sr.getCustomerId(),
            agentName + " has accepted your support request for " + sr.getTopic(),
            "SUPPORT_ACCEPTED",
            null
        );

        // Notify via WebSocket to customer
        messagingTemplate.convertAndSend("/topic/support/customer/" + sr.getCustomerId(), response);

        // Notify agents that request was taken
        messagingTemplate.convertAndSend("/topic/support/requests/taken", response);

        return response;
    }

    @Override
    @Transactional
    public SupportRequestResponse closeRequest(Long requestId) {
        SupportRequest sr = supportRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Support request not found"));

        sr.setStatus(SupportRequestStatus.CLOSED);
        SupportRequest saved = supportRequestRepository.save(sr);
        
        SupportRequestResponse response = mapToResponse(saved);
        
        // Notify customer
        if (sr.getAgentName() != null) {
            notificationService.createNotification(
                sr.getCustomerId(),
                "Support chat with " + sr.getAgentName() + " has ended",
                "SUPPORT_CLOSED",
                null
            );
        }

        messagingTemplate.convertAndSend("/topic/support/customer/" + sr.getCustomerId(), response);

        return response;
    }

    @Override
    public SupportRequestResponse getRequestById(Long requestId) {
        return supportRequestRepository.findById(requestId)
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Override
    public long getWaitingCount() {
        return supportRequestRepository.countByStatus(SupportRequestStatus.WAITING);
    }

    private SupportRequestResponse mapToResponse(SupportRequest sr) {
        return SupportRequestResponse.builder()
                .id(sr.getId())
                .customerId(sr.getCustomerId())
                .customerName(sr.getCustomerName())
                .topic(sr.getTopic())
                .status(sr.getStatus())
                .agentId(sr.getAgentId())
                .agentName(sr.getAgentName())
                .conversationId(sr.getConversationId())
                .description(sr.getDescription())
                .createdAt(sr.getCreatedAt())
                .updatedAt(sr.getUpdatedAt())
                .build();
    }
}
