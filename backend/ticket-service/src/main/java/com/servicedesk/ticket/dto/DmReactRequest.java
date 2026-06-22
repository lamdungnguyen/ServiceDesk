package com.servicedesk.ticket.dto;

import lombok.Data;

@Data
public class DmReactRequest {
    private Long conversationId;
    private Long messageId;
    private Long userId;
    private String reaction;
}
