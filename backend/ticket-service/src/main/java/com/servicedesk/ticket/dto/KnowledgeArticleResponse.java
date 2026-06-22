package com.servicedesk.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeArticleResponse {
    private Long id;
    private String title;
    private String category;
    private String content;
    private String tags;
    private Boolean active;
    private Boolean embeddingGenerated;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
