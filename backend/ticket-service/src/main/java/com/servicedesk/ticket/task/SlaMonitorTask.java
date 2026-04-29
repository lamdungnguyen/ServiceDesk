package com.servicedesk.ticket.task;

import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.repository.TicketRepository;
import com.servicedesk.ticket.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SlaMonitorTask {

    private final TicketRepository ticketRepository;
    private final NotificationService notificationService;

    // Run every minute
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void checkSlaAndOverdue() {
        log.debug("Running SLA monitor task...");
        List<Ticket> activeTickets = ticketRepository.findActiveTickets();
        LocalDateTime now = LocalDateTime.now();

        for (Ticket ticket : activeTickets) {
            if (ticket.getDueDate() == null) continue;

            // 1. Check if overdue
            if (now.isAfter(ticket.getDueDate()) && !ticket.getOverdueNotified()) {
                log.info("Ticket #{} is overdue. Notifying ADMIN.", ticket.getId());
                notificationService.notifyAdmins(
                        "Ticket #" + ticket.getId() + " is overdue!",
                        "ALERT"
                );
                ticket.setOverdueNotified(true);
                ticketRepository.save(ticket);
            } 
            // 2. Check if near SLA (within 1 hour)
            else if (!ticket.getOverdueNotified() && !ticket.getSlaNotified() && ticket.getAssigneeId() != null) {
                if (now.plusHours(1).isAfter(ticket.getDueDate()) && now.isBefore(ticket.getDueDate())) {
                    log.info("Ticket #{} is near SLA. Notifying AGENT.", ticket.getId());
                    notificationService.createNotification(
                            ticket.getAssigneeId(),
                            "Ticket #" + ticket.getId() + " is near SLA deadline!",
                            "WARNING"
                    );
                    ticket.setSlaNotified(true);
                    ticketRepository.save(ticket);
                }
            }
        }
    }
}
