package com.servicedesk.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class KnowledgeArticleRequest {
    @NotBlank
    private String title;

    private String category;

    @NotBlank
    private String content;

    private String tags;
}
