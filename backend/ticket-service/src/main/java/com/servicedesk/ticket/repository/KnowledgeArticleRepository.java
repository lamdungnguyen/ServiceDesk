package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.KnowledgeArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeArticleRepository extends JpaRepository<KnowledgeArticle, Long> {
    List<KnowledgeArticle> findByActiveOrderByUpdatedAtDesc(Boolean active);

    @Query("""
        SELECT a
        FROM KnowledgeArticle a
        WHERE a.active = true
          AND (:category IS NULL OR UPPER(a.category) = UPPER(:category))
          AND (:query IS NULL OR
               LOWER(a.title) LIKE LOWER(CONCAT(CONCAT('%', :query), '%')) OR
               LOWER(a.content) LIKE LOWER(CONCAT(CONCAT('%', :query), '%')) OR
               LOWER(a.tags) LIKE LOWER(CONCAT(CONCAT('%', :query), '%')))
          AND (:tags IS NULL OR LOWER(a.tags) LIKE LOWER(CONCAT(CONCAT('%', :tags), '%')))
        ORDER BY a.updatedAt DESC
    """)
    List<KnowledgeArticle> searchActive(
            @Param("query") String query,
            @Param("category") String category,
            @Param("tags") String tags
    );
}
