package com.servicedesk.ticket.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "direct_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "sender_name", columnDefinition = "NVARCHAR(255)")
    private String senderName;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @Column(name = "message_type", length = 10)
    @Builder.Default
    private String messageType = "TEXT"; // TEXT, IMAGE, FILE, VOICE

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "file_name", columnDefinition = "NVARCHAR(255)")
    private String fileName;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
