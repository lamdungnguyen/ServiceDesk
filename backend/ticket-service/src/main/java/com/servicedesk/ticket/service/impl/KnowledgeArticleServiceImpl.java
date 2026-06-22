package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.KnowledgeArticleRequest;
import com.servicedesk.ticket.dto.KnowledgeArticleResponse;
import com.servicedesk.ticket.entity.KnowledgeArticle;
import com.servicedesk.ticket.enums.UserRole;
import com.servicedesk.ticket.exception.ResourceNotFoundException;
import com.servicedesk.ticket.repository.KnowledgeArticleRepository;
import com.servicedesk.ticket.service.AccessControlService;
import com.servicedesk.ticket.service.KnowledgeArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KnowledgeArticleServiceImpl implements KnowledgeArticleService {

    private final KnowledgeArticleRepository knowledgeArticleRepository;
    private final AccessControlService accessControlService;

    @Override
    public List<KnowledgeArticleResponse> list(Boolean active) {
        accessControlService.requireRole(UserRole.ADMIN);
        List<KnowledgeArticle> articles = active == null
                ? knowledgeArticleRepository.findAll()
                : knowledgeArticleRepository.findByActiveOrderByUpdatedAtDesc(active);

        return articles.stream()
                .sorted(Comparator.comparing(KnowledgeArticle::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public KnowledgeArticleResponse get(Long id) {
        accessControlService.requireRole(UserRole.AGENT, UserRole.ADMIN);
        return mapToResponse(findArticle(id));
    }

    @Override
    @Transactional
    public KnowledgeArticleResponse create(KnowledgeArticleRequest request) {
        accessControlService.requireRole(UserRole.ADMIN);
        KnowledgeArticle article = KnowledgeArticle.builder()
                .title(request.getTitle().trim())
                .category(normalizeCategory(request.getCategory()))
                .content(request.getContent().trim())
                .tags(normalizeTags(request.getTags()))
                .active(true)
                .embeddingGenerated(false)
                .build();

        return mapToResponse(knowledgeArticleRepository.save(article));
    }

    @Override
    @Transactional
    public KnowledgeArticleResponse update(Long id, KnowledgeArticleRequest request) {
        accessControlService.requireRole(UserRole.ADMIN);
        KnowledgeArticle article = findArticle(id);
        article.setTitle(request.getTitle().trim());
        article.setCategory(normalizeCategory(request.getCategory()));
        article.setContent(request.getContent().trim());
        article.setTags(normalizeTags(request.getTags()));
        article.setEmbeddingGenerated(false);
        article.setVectorId(null);

        return mapToResponse(knowledgeArticleRepository.save(article));
    }

    @Override
    @Transactional
    public KnowledgeArticleResponse setActive(Long id, boolean active) {
        accessControlService.requireRole(UserRole.ADMIN);
        KnowledgeArticle article = findArticle(id);
        article.setActive(active);
        return mapToResponse(knowledgeArticleRepository.save(article));
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        setActive(id, false);
    }

    @Override
    public List<KnowledgeArticleResponse> search(String query, String category, String tags, int limit) {
        accessControlService.requireRole(UserRole.AGENT, UserRole.ADMIN);
        int safeLimit = Math.max(1, Math.min(limit <= 0 ? 10 : limit, 50));
        return knowledgeArticleRepository.searchActive(blankToNull(query), normalizeCategory(category), blankToNull(tags))
                .stream()
                .limit(safeLimit)
                .map(this::mapToResponse)
                .toList();
    }

    private KnowledgeArticle findArticle(Long id) {
        return knowledgeArticleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Knowledge article not found with id: " + id));
    }

    private KnowledgeArticleResponse mapToResponse(KnowledgeArticle article) {
        return KnowledgeArticleResponse.builder()
                .id(article.getId())
                .title(article.getTitle())
                .category(article.getCategory())
                .content(article.getContent())
                .tags(article.getTags())
                .active(article.getActive())
                .embeddingGenerated(article.getEmbeddingGenerated())
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .build();
    }

    private String normalizeCategory(String category) {
        return blankToNull(category) == null ? null : category.trim().toUpperCase();
    }

    private String normalizeTags(String tags) {
        return blankToNull(tags) == null ? null : tags.trim();
    }

    private String blankToNull(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }
}
