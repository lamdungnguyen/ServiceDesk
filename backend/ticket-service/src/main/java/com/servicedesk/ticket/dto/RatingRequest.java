package com.servicedesk.ticket.dto;

import lombok.Data;

@Data
public class RatingRequest {
    private Long ticketId;
    private Integer score; // 1-5
    private String comment;
}
