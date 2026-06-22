package com.servicedesk.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoutingSuggestionResponse {
    private Long assigneeId;
    private String assigneeName;
    private String role;
    private String agentType;
    private Double score;
    private Long matchingResolvedTickets;
    private Long openTicketCount;
    private String reason;
}
