package com.servicedesk.ticket.controller;

import com.servicedesk.ticket.dto.AgentRatingStats;
import com.servicedesk.ticket.dto.RatingRequest;
import com.servicedesk.ticket.dto.RatingResponse;
import com.servicedesk.ticket.security.UserContext;
import com.servicedesk.ticket.service.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @PostMapping
    public ResponseEntity<RatingResponse> submitRating(@RequestBody RatingRequest request) {
        Long userId = UserContext.getUserId();
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(ratingService.submitRating(request));
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<RatingResponse> getRatingByTicket(@PathVariable Long ticketId) {
        RatingResponse rating = ratingService.getRatingByTicketId(ticketId);
        if (rating == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(rating);
    }

    @GetMapping("/agent/{agentId}")
    public ResponseEntity<List<RatingResponse>> getAgentRatings(@PathVariable Long agentId) {
        return ResponseEntity.ok(ratingService.getRatingsByAgentId(agentId));
    }

    @GetMapping("/agent/{agentId}/stats")
    public ResponseEntity<AgentRatingStats> getAgentStats(@PathVariable Long agentId) {
        return ResponseEntity.ok(ratingService.getAgentRatingStats(agentId));
    }

    @GetMapping("/stats")
    public ResponseEntity<List<AgentRatingStats>> getAllAgentStats() {
        return ResponseEntity.ok(ratingService.getAllAgentRatingStats());
    }
}
