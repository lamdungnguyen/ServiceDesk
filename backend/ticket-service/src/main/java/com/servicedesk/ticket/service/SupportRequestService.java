package com.servicedesk.ticket.service;

import com.servicedesk.ticket.dto.SupportRequestRequest;
import com.servicedesk.ticket.dto.SupportRequestResponse;

import java.util.List;

public interface SupportRequestService {
    SupportRequestResponse createRequest(SupportRequestRequest request, Long customerId, String customerName);
    List<SupportRequestResponse> getWaitingRequests();
    List<SupportRequestResponse> getMyRequests(Long customerId);
    List<SupportRequestResponse> getMyActiveChats(Long agentId);
    SupportRequestResponse acceptRequest(Long requestId, Long agentId, String agentName);
    SupportRequestResponse closeRequest(Long requestId);
    SupportRequestResponse getRequestById(Long requestId);
    long getWaitingCount();
}
