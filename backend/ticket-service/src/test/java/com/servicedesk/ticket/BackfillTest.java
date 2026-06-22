package com.servicedesk.ticket;

import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.repository.AIPredictionRepository;
import com.servicedesk.ticket.repository.TicketRepository;
import com.servicedesk.ticket.service.AIPredictionService;
import com.servicedesk.ticket.service.AIService;
import com.servicedesk.ticket.dto.AIResponse;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@Slf4j
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
public class BackfillTest {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private AIPredictionRepository aiPredictionRepository;

    @Autowired
    private AIService aiService;

    @Autowired
    private AIPredictionService aiPredictionService;

    @Test
    public void backfillPredictions() {
        List<Ticket> tickets = ticketRepository.findAll();
        int count = 0;
        for (Ticket ticket : tickets) {
            boolean exists = aiPredictionRepository.findTopByTicketIdOrderByCreatedAtDesc(ticket.getId()).isPresent();
            if (!exists) {
                try {
                    log.info("Generating AI prediction for ticket #{}", ticket.getId());
                    AIResponse response = aiService.analyzeTicket(ticket.getTitle(), ticket.getDescription());
                    aiPredictionService.saveInitialPrediction(
                            ticket.getId(),
                            ticket.getTitle(),
                            ticket.getDescription(),
                            response,
                            "SUGGESTED",
                            false
                    );
                    count++;
                } catch (Exception e) {
                    log.error("Failed to generate prediction for ticket #{}: {}", ticket.getId(), e.getMessage());
                }
            }
        }
        log.info("Successfully backfilled {} tickets with AI predictions.", count);
    }
}
