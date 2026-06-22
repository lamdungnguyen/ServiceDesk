package com.servicedesk.ticket.service;

import com.servicedesk.ticket.dto.KnowledgeArticleRequest;
import com.servicedesk.ticket.dto.KnowledgeArticleResponse;

import java.util.List;

public interface KnowledgeArticleService {
    List<KnowledgeArticleResponse> list(Boolean active);
    KnowledgeArticleResponse get(Long id);
    KnowledgeArticleResponse create(KnowledgeArticleRequest request);
    KnowledgeArticleResponse update(Long id, KnowledgeArticleRequest request);
    KnowledgeArticleResponse setActive(Long id, boolean active);
    void deactivate(Long id);
    List<KnowledgeArticleResponse> search(String query, String category, String tags, int limit);
}
