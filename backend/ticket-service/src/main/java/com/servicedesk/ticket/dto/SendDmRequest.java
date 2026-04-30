package com.servicedesk.ticket.dto;

import lombok.Data;

@Data
public class SendDmRequest {
    private Long conversationId;
    private Long senderId;
    private String senderName;
    private String content;
    private String messageType; // TEXT, IMAGE, FILE, VOICE
    private String fileUrl;
    private String fileName;
}
