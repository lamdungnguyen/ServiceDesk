package com.servicedesk.ticket.controller;

import com.servicedesk.ticket.dto.TicketCreateRequest;
import com.servicedesk.ticket.dto.TicketResponse;
import com.servicedesk.ticket.service.TicketService;
import com.servicedesk.ticket.enums.TicketStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(@Valid @RequestBody TicketCreateRequest request) {
        TicketResponse response = ticketService.createTicket(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicketById(@PathVariable Long id) {
        TicketResponse response = ticketService.getTicketById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<TicketResponse>> getAllTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Boolean overdue,
            @RequestParam(required = false) String keyword) {
        if (status != null || priority != null || overdue != null || (keyword != null && !keyword.trim().isEmpty())) {
            return ResponseEntity.ok(ticketService.getFilteredTickets(status, priority, overdue, keyword));
        }
        List<TicketResponse> responses = ticketService.getAllTickets();
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateTicketStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> statusUpdate) {
        String newStatus = statusUpdate.get("status");
        if (newStatus == null || newStatus.trim().isEmpty()) {
            throw new IllegalArgumentException("Status is required");
        }
        
        TicketStatus statusEnum;
        try {
            statusEnum = TicketStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status value: " + newStatus);
        }
        
        TicketResponse response = ticketService.updateTicketStatus(id, statusEnum);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/escalated")
    public ResponseEntity<List<TicketResponse>> getEscalatedTickets() {
        return ResponseEntity.ok(ticketService.getEscalatedTickets());
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable Long id,
            @RequestBody Map<String, Long> assignUpdate) {
        Long assigneeId = assignUpdate.get("assigneeId");
        if (assigneeId == null) {
            throw new IllegalArgumentException("assigneeId is required");
        }
        
        TicketResponse response = ticketService.assignTicket(id, assigneeId);
        return ResponseEntity.ok(response);
    }
}
