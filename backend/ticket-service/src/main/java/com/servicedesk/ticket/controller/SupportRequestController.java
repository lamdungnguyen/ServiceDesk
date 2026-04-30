package com.servicedesk.ticket.controller;

import com.servicedesk.ticket.dto.SupportRequestRequest;
import com.servicedesk.ticket.dto.SupportRequestResponse;
import com.servicedesk.ticket.security.UserContext;
import com.servicedesk.ticket.service.SupportRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/support")
@RequiredArgsConstructor
public class SupportRequestController {

    private final SupportRequestService supportRequestService;

    @PostMapping("/requests")
    public ResponseEntity<SupportRequestResponse> createRequest(@RequestBody SupportRequestRequest request) {
        Long customerId = UserContext.getUserId();
        String customerName = UserContext.getUsername();
        if (customerId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(supportRequestService.createRequest(request, customerId, customerName));
    }

    @GetMapping("/requests/waiting")
    public ResponseEntity<List<SupportRequestResponse>> getWaitingRequests() {
        return ResponseEntity.ok(supportRequestService.getWaitingRequests());
    }

    @GetMapping("/requests/my")
    public ResponseEntity<List<SupportRequestResponse>> getMyRequests() {
        Long customerId = UserContext.getUserId();
        if (customerId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(supportRequestService.getMyRequests(customerId));
    }

    @GetMapping("/requests/active")
    public ResponseEntity<List<SupportRequestResponse>> getMyActiveChats() {
        Long agentId = UserContext.getUserId();
        if (agentId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(supportRequestService.getMyActiveChats(agentId));
    }

    @PostMapping("/requests/{id}/accept")
    public ResponseEntity<SupportRequestResponse> acceptRequest(@PathVariable Long id) {
        Long agentId = UserContext.getUserId();
        String agentName = UserContext.getUsername();
        if (agentId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(supportRequestService.acceptRequest(id, agentId, agentName));
    }

    @PostMapping("/requests/{id}/close")
    public ResponseEntity<SupportRequestResponse> closeRequest(@PathVariable Long id) {
        return ResponseEntity.ok(supportRequestService.closeRequest(id));
    }

    @GetMapping("/requests/waiting/count")
    public ResponseEntity<Long> getWaitingCount() {
        return ResponseEntity.ok(supportRequestService.getWaitingCount());
    }
}
