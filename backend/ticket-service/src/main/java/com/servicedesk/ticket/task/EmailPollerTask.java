package com.servicedesk.ticket.task;

import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.enums.Priority;
import com.servicedesk.ticket.enums.TicketStatus;
import com.servicedesk.ticket.repository.TicketRepository;
import jakarta.mail.Flags;
import jakarta.mail.Folder;
import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.Store;
import jakarta.mail.search.FlagTerm;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Properties;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailPollerTask {

    private final TicketRepository ticketRepository;

    @Value("${spring.mail.host:imap.gmail.com}")
    private String host;

    @Value("${spring.mail.username:}")
    private String username;

    @Value("${spring.mail.password:}")
    private String password;

    @Scheduled(fixedDelay = 60000)
    public void pollEmails() {
        if (username == null || username.isEmpty() || password == null || password.isEmpty()) {
            log.debug("IMAP credentials not set, skipping email polling.");
            return;
        }

        try {
            Properties properties = new Properties();
            properties.put("mail.store.protocol", "imaps");
            properties.put("mail.imaps.host", host);
            properties.put("mail.imaps.port", "993");

            Session emailSession = Session.getDefaultInstance(properties);
            Store store = emailSession.getStore("imaps");
            store.connect(host, username, password);

            Folder inbox = store.getFolder("INBOX");
            inbox.open(Folder.READ_WRITE);

            Message[] messages = inbox.search(new FlagTerm(new Flags(Flags.Flag.SEEN), false));

            for (Message message : messages) {
                String subject = message.getSubject();
                String content = "";
                if (message.getContent() != null) {
                    content = message.getContent().toString();
                }

                Ticket ticket = Ticket.builder()
                        .title(subject != null ? subject : "No Subject")
                        .description(content)
                        .category("GENERAL")
                        .priority(Priority.MEDIUM) // Maps to NORMAL
                        .status(TicketStatus.NEW)
                        .build();

                ticketRepository.save(ticket);

                message.setFlag(Flags.Flag.SEEN, true);
                log.info("Created ticket from email: {}", subject);
            }

            inbox.close(false);
            store.close();

        } catch (Exception e) {
            log.error("Error polling emails", e);
        }
    }
}
