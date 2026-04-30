package com.servicedesk.ticket.controller;

import com.servicedesk.ticket.dto.CallSignal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class CallController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/call.signal")
    public void signal(@Payload CallSignal signal) {
        log.info("Call signal type={} ticketId={} from senderId={}",
                signal.getType(), signal.getTicketId(), signal.getSenderId());

        // Always broadcast to the ticket-scoped topic (used by in-ticket CallPanel)
        messagingTemplate.convertAndSend("/topic/call/" + signal.getTicketId(), signal);

        // Also push CALL_REQUEST to the target user's personal topic
        // so agents receive the notification from anywhere in the app
        if ("CALL_REQUEST".equals(signal.getType()) && signal.getTargetUserId() != null) {
            messagingTemplate.convertAndSend("/topic/call/user/" + signal.getTargetUserId(), signal);
        }
    }
}
