package com.servicedesk.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketAiSummaryResponse {
    private String summary;
    private String customerProblem;
    private List<String> attemptedSteps;
    private List<String> suggestedNextSteps;
    private String suggestedReply;
    private String source;
}
