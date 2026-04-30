package com.servicedesk.ticket.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ConversationDto {
    private Long id;
    private String name;
    private String type;
    private Long createdBy;
    private LocalDateTime createdAt;
    private List<MemberInfo> members;
    private DirectMessageDto lastMessage;

    @Data
    @Builder
    public static class MemberInfo {
        private Long userId;
        private String userName;
        private String userRole;
    }
}
