package com.servicedesk.ticket.dto;

import lombok.Data;

@Data
public class SupportRequestRequest {
    private String topic;
    private String description;
}
