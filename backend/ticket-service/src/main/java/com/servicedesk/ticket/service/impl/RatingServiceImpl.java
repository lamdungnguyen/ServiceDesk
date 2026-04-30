package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.AgentRatingStats;
import com.servicedesk.ticket.dto.RatingRequest;
import com.servicedesk.ticket.dto.RatingResponse;
import com.servicedesk.ticket.entity.Rating;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.entity.User;
import com.servicedesk.ticket.enums.TicketStatus;
import com.servicedesk.ticket.exception.ResourceNotFoundException;
import com.servicedesk.ticket.exception.UnauthorizedAccessException;
import com.servicedesk.ticket.repository.RatingRepository;
import com.servicedesk.ticket.repository.TicketRepository;
import com.servicedesk.ticket.repository.UserRepository;
import com.servicedesk.ticket.security.UserContext;
import com.servicedesk.ticket.service.NotificationService;
import com.servicedesk.ticket.service.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RatingServiceImpl implements RatingService {

    private final RatingRepository ratingRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public RatingResponse submitRating(RatingRequest request) {
        Long customerId = UserContext.getUserId();
        if (customerId == null) {
            throw new UnauthorizedAccessException("Must be logged in to submit a rating");
        }

        Ticket ticket = ticketRepository.findById(request.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + request.getTicketId()));

        // Only the reporter (customer) can rate
        if (!ticket.getReporterId().equals(customerId)) {
            throw new UnauthorizedAccessException("Only the ticket reporter can rate the agent");
        }

        // Ticket must be RESOLVED or CLOSED
        if (ticket.getStatus() != TicketStatus.RESOLVED && ticket.getStatus() != TicketStatus.CLOSED) {
            throw new IllegalStateException("Can only rate after ticket is resolved or closed");
        }

        // Ticket must have an assignee
        if (ticket.getAssigneeId() == null) {
            throw new IllegalStateException("Cannot rate: no agent was assigned to this ticket");
        }

        // Check if already rated
        if (ratingRepository.findByTicketId(request.getTicketId()).isPresent()) {
            throw new IllegalStateException("This ticket has already been rated");
        }

        // Validate score
        if (request.getScore() < 1 || request.getScore() > 5) {
            throw new IllegalArgumentException("Score must be between 1 and 5");
        }

        Rating rating = Rating.builder()
                .ticketId(ticket.getId())
                .agentId(ticket.getAssigneeId())
                .customerId(customerId)
                .score(request.getScore())
                .comment(request.getComment())
                .build();

        Rating saved = ratingRepository.save(rating);

        // Notify the agent about the rating
        String customerName = userRepository.findById(customerId)
                .map(User::getName).orElse("Customer");
        notificationService.createNotification(
                ticket.getAssigneeId(),
                customerName + " rated you " + request.getScore() + "/5 on ticket #" + ticket.getId(),
                "INFO",
                ticket.getId()
        );

        return mapToResponse(saved);
    }

    @Override
    public RatingResponse getRatingByTicketId(Long ticketId) {
        Rating rating = ratingRepository.findByTicketId(ticketId)
                .orElse(null);
        return rating != null ? mapToResponse(rating) : null;
    }

    @Override
    public List<RatingResponse> getRatingsByAgentId(Long agentId) {
        return ratingRepository.findByAgentIdOrderByCreatedAtDesc(agentId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<AgentRatingStats> getAllAgentRatingStats() {
        List<Object[]> rawStats = ratingRepository.getAgentRatingStats();

        // Get all agent ids
        List<Long> agentIds = rawStats.stream()
                .map(row -> (Long) row[0])
                .collect(Collectors.toList());

        // Fetch agent names
        Map<Long, String> agentNames = userRepository.findAllById(agentIds).stream()
                .collect(Collectors.toMap(User::getId, User::getName));

        // Fetch all ratings grouped by agent for recent ratings
        Map<Long, List<Rating>> ratingsByAgent = ratingRepository.findAll().stream()
                .collect(Collectors.groupingBy(Rating::getAgentId));

        List<AgentRatingStats> result = new ArrayList<>();
        for (Object[] row : rawStats) {
            Long agentId = (Long) row[0];
            Double avgScore = (Double) row[1];
            Long totalRatings = (Long) row[2];

            List<RatingResponse> recentRatings = ratingsByAgent.getOrDefault(agentId, List.of())
                    .stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .limit(5)
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());

            result.add(AgentRatingStats.builder()
                    .agentId(agentId)
                    .agentName(agentNames.getOrDefault(agentId, "Agent #" + agentId))
                    .averageScore(Math.round(avgScore * 10.0) / 10.0)
                    .totalRatings(totalRatings)
                    .recentRatings(recentRatings)
                    .build());
        }

        // Sort by average score descending
        result.sort((a, b) -> Double.compare(b.getAverageScore(), a.getAverageScore()));
        return result;
    }

    @Override
    public AgentRatingStats getAgentRatingStats(Long agentId) {
        Double avg = ratingRepository.getAverageScoreByAgentId(agentId);
        Long count = ratingRepository.countByAgentId(agentId);
        String agentName = userRepository.findById(agentId)
                .map(User::getName).orElse("Agent #" + agentId);

        List<RatingResponse> recentRatings = ratingRepository.findByAgentIdOrderByCreatedAtDesc(agentId)
                .stream().limit(10).map(this::mapToResponse).collect(Collectors.toList());

        return AgentRatingStats.builder()
                .agentId(agentId)
                .agentName(agentName)
                .averageScore(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0)
                .totalRatings(count)
                .recentRatings(recentRatings)
                .build();
    }

    private RatingResponse mapToResponse(Rating rating) {
        String agentName = userRepository.findById(rating.getAgentId())
                .map(User::getName).orElse("Agent #" + rating.getAgentId());
        String customerName = userRepository.findById(rating.getCustomerId())
                .map(User::getName).orElse("Customer #" + rating.getCustomerId());

        return RatingResponse.builder()
                .id(rating.getId())
                .ticketId(rating.getTicketId())
                .agentId(rating.getAgentId())
                .agentName(agentName)
                .customerId(rating.getCustomerId())
                .customerName(customerName)
                .score(rating.getScore())
                .comment(rating.getComment())
                .createdAt(rating.getCreatedAt())
                .build();
    }
}
