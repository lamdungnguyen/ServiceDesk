package com.servicedesk.ticket.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Settings {

    @Id
    private Long id;

    // ── Notification Settings ──────────────────────────────────────────────
    @Column(name = "notifications_enabled")
    @Builder.Default
    private Boolean notificationsEnabled = true;

    @Column(name = "notify_in_app")
    @Builder.Default
    private Boolean notifyInApp = true;

    @Column(name = "notify_email")
    @Builder.Default
    private Boolean notifyEmail = false;

    @Column(name = "notify_ticket_assigned")
    @Builder.Default
    private Boolean notifyTicketAssigned = true;

    @Column(name = "notify_ticket_resolved")
    @Builder.Default
    private Boolean notifyTicketResolved = true;

    @Column(name = "notify_sla_warning")
    @Builder.Default
    private Boolean notifySlaWarning = true;

    @Column(name = "notify_escalation")
    @Builder.Default
    private Boolean notifyEscalation = true;

    // ── SLA & Alert Settings ───────────────────────────────────────────────
    @Column(name = "max_response_time_minutes")
    @Builder.Default
    private Integer maxResponseTimeMinutes = 60;

    @Column(name = "escalation_threshold_minutes")
    @Builder.Default
    private Integer escalationThresholdMinutes = 240;

    @Column(name = "sla_warning_threshold_minutes")
    @Builder.Default
    private Integer slaWarningThresholdMinutes = 60;

    // ── Security Settings ──────────────────────────────────────────────────
    @Column(name = "session_timeout_minutes")
    @Builder.Default
    private Integer sessionTimeoutMinutes = 30;

    @Column(name = "agent_can_view_all_tickets")
    @Builder.Default
    private Boolean agentCanViewAllTickets = false;

    @Column(name = "agent_can_export_data")
    @Builder.Default
    private Boolean agentCanExportData = false;

    // ── AI Settings ────────────────────────────────────────────────────────
    @Column(name = "ai_service_url", length = 500)
    @Builder.Default
    private String aiServiceUrl = "http://localhost:8000";

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
