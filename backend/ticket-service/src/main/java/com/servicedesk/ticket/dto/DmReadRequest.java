package com.servicedesk.ticket.dto;

import lombok.Data;

@Data
public class DmReadRequest {
    private Long conversationId;
    private Long messageId;
    private Long userId;
}
