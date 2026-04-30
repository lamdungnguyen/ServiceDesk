package com.servicedesk.ticket.dto;

import com.servicedesk.ticket.entity.SupportRequestStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SupportRequestResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private String topic;
    private SupportRequestStatus status;
    private Long agentId;
    private String agentName;
    private Long conversationId;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Helper for wait time display
    public String getWaitTimeDisplay() {
        if (createdAt == null) return "";
        long minutes = java.time.Duration.between(createdAt, LocalDateTime.now()).toMinutes();
        if (minutes < 1) return "Vừa xong";
        if (minutes < 60) return minutes + " phút";
        long hours = minutes / 60;
        if (hours < 24) return hours + " giờ";
        return (hours / 24) + " ngày";
    }
}
