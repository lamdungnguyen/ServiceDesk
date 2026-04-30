package com.servicedesk.ticket.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AgentRatingStats {
    private Long agentId;
    private String agentName;
    private Double averageScore;
    private Long totalRatings;
    private List<RatingResponse> recentRatings;
}
