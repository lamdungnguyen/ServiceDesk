package com.servicedesk.ticket.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DirectMessageDto {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderName;
    private String content;
    private String messageType; // TEXT, IMAGE, FILE, VOICE
    private String fileUrl;
    private String fileName;
    private LocalDateTime createdAt;
}
