package com.servicedesk.ticket.service;

import com.servicedesk.ticket.dto.AgentRatingStats;
import com.servicedesk.ticket.dto.RatingRequest;
import com.servicedesk.ticket.dto.RatingResponse;

import java.util.List;

public interface RatingService {
    RatingResponse submitRating(RatingRequest request);
    RatingResponse getRatingByTicketId(Long ticketId);
    List<RatingResponse> getRatingsByAgentId(Long agentId);
    List<AgentRatingStats> getAllAgentRatingStats();
    AgentRatingStats getAgentRatingStats(Long agentId);
}
