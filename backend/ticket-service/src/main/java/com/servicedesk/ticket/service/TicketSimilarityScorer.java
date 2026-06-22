package com.servicedesk.ticket.service;

import com.servicedesk.ticket.entity.Ticket;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class TicketSimilarityScorer {

    public SimilarityScore score(Ticket source, Ticket candidate) {
        Set<String> sourceTokens = tokenize(source.getTitle() + " " + source.getDescription());
        Set<String> candidateTokens = tokenize(candidate.getTitle() + " " + candidate.getDescription());

        List<String> matchedTerms = sourceTokens.stream()
                .filter(candidateTokens::contains)
                .sorted(Comparator.naturalOrder())
                .limit(8)
                .toList();

        double score = 0.0;
        if (!sourceTokens.isEmpty()) {
            score += matchedTerms.size() * 0.65 / sourceTokens.size();
        }
        if (source.getCategory() != null && source.getCategory().equalsIgnoreCase(candidate.getCategory())) {
            score += 0.25;
        }
        if (source.getPriority() != null && source.getPriority() == candidate.getPriority()) {
            score += 0.10;
        }

        return new SimilarityScore(Math.min(1.0, score), matchedTerms);
    }

    private Set<String> tokenize(String text) {
        Set<String> tokens = new HashSet<>();
        if (text == null || text.isBlank()) {
            return tokens;
        }

        String[] parts = text.toLowerCase(Locale.ROOT).split("[^a-z0-9]+");
        for (String part : parts) {
            if (part.length() >= 3 && !isStopWord(part)) {
                tokens.add(part);
            }
        }
        return tokens;
    }

    private boolean isStopWord(String token) {
        return List.of("the", "and", "for", "with", "that", "this", "from", "have", "has").contains(token);
    }

    @Data
    @AllArgsConstructor
    public static class SimilarityScore {
        private double score;
        private List<String> matchedTerms;
    }
}
