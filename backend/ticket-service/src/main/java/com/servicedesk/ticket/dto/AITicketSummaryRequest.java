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
public class AITicketSummaryRequest {
    private String title;
    private String description;
    private String category;
    private String priority;
    private List<AITicketSummaryComment> comments;
}
