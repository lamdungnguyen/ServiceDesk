package com.servicedesk.ticket.dto;

import lombok.Data;

@Data
public class DmTypingRequest {
    private Long conversationId;
    private Long userId;
    private String userName;
    private boolean isTyping;
}
