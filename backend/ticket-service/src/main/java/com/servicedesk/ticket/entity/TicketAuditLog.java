package com.servicedesk.ticket.entity;

import com.servicedesk.ticket.enums.TicketAuditAction;
import com.servicedesk.ticket.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ticket_audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "actor_name", columnDefinition = "NVARCHAR(255)")
    private String actorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_role")
    private UserRole actorRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private TicketAuditAction action;

    @Column(name = "field_name")
    private String fieldName;

    @Column(name = "old_value", columnDefinition = "NVARCHAR(MAX)")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "NVARCHAR(MAX)")
    private String newValue;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String details;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
