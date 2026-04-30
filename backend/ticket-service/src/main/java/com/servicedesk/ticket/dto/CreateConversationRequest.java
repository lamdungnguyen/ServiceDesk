package com.servicedesk.ticket.dto;

import lombok.Data;

import java.util.List;

@Data
public class CreateConversationRequest {
    private String type; // DM or GROUP
    private String name; // required for GROUP
    private List<Long> memberIds; // user IDs to add (excluding creator)
}
