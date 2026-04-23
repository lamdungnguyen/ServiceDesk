package com.servicedesk.ticket.controller;

import com.servicedesk.ticket.dto.CommentCreateRequest;
import com.servicedesk.ticket.dto.CommentResponse;
import com.servicedesk.ticket.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets/{ticketId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long ticketId,
            @Valid @RequestBody CommentCreateRequest request) {
        
        // Ensure the ticketId in path matches the request
        request.setTicketId(ticketId);
        
        CommentResponse response = commentService.addComment(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getCommentsByTicketId(@PathVariable Long ticketId) {
        List<CommentResponse> responses = commentService.getCommentsByTicketId(ticketId);
        return ResponseEntity.ok(responses);
    }
}
