package com.servicedesk.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettingsDto {

    // Notification
    private Boolean notificationsEnabled;
    private Boolean notifyInApp;
    private Boolean notifyEmail;
    private Boolean notifyTicketAssigned;
    private Boolean notifyTicketResolved;
    private Boolean notifySlaWarning;
    private Boolean notifyEscalation;

    // SLA
    private Integer maxResponseTimeMinutes;
    private Integer escalationThresholdMinutes;
    private Integer slaWarningThresholdMinutes;

    // Security
    private Integer sessionTimeoutMinutes;
    private Boolean agentCanViewAllTickets;
    private Boolean agentCanExportData;

    // AI
    private String aiServiceUrl;
}
