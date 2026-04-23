package com.servicedesk.ticket.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class CommentResponse {
    private Long id;
    private Long ticketId;
    private Long userId;
    private String content;
    private LocalDateTime createdAt;
}
