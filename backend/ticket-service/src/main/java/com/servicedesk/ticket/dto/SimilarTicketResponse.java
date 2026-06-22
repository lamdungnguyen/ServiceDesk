package com.servicedesk.ticket.dto;

import com.servicedesk.ticket.enums.Priority;
import com.servicedesk.ticket.enums.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimilarTicketResponse {
    private Long id;
    private String title;
    private String category;
    private Priority priority;
    private TicketStatus status;
    private Double score;
    private List<String> matchedTerms;
    private LocalDateTime createdAt;
}
