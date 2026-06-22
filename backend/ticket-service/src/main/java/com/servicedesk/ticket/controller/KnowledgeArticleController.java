package com.servicedesk.ticket.controller;

import com.servicedesk.ticket.dto.KnowledgeArticleRequest;
import com.servicedesk.ticket.dto.KnowledgeArticleResponse;
import com.servicedesk.ticket.service.KnowledgeArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/knowledge-articles")
@RequiredArgsConstructor
public class KnowledgeArticleController {

    private final KnowledgeArticleService knowledgeArticleService;

    @GetMapping
    public ResponseEntity<List<KnowledgeArticleResponse>> list(@RequestParam(required = false) Boolean active) {
        return ResponseEntity.ok(knowledgeArticleService.list(active));
    }

    @GetMapping("/{id}")
    public ResponseEntity<KnowledgeArticleResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(knowledgeArticleService.get(id));
    }

    @PostMapping
    public ResponseEntity<KnowledgeArticleResponse> create(@Valid @RequestBody KnowledgeArticleRequest request) {
        return new ResponseEntity<>(knowledgeArticleService.create(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<KnowledgeArticleResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody KnowledgeArticleRequest request
    ) {
        return ResponseEntity.ok(knowledgeArticleService.update(id, request));
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<KnowledgeArticleResponse> setActive(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body
    ) {
        Boolean active = body.get("active");
        if (active == null) {
            throw new IllegalArgumentException("active is required");
        }
        return ResponseEntity.ok(knowledgeArticleService.setActive(id, active));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        knowledgeArticleService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<KnowledgeArticleResponse>> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tags,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ResponseEntity.ok(knowledgeArticleService.search(query, category, tags, limit));
    }
}
