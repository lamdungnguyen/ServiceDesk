package com.servicedesk.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class UserPresenceResponse {
    private Long userId;
    private String activityStatus;
    private LocalDateTime lastSeenAt;
}
