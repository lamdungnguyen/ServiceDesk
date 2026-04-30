package com.servicedesk.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    private Long ticketId;
    private Long senderId;
    private String senderName;
    private String senderRole;
    private String content;
    private String timestamp;

    // Fields populated after save (returned to client)
    private Long id;
}
