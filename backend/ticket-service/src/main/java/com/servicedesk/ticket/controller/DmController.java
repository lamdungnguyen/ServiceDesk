package com.servicedesk.ticket.controller;

import com.servicedesk.ticket.dto.DirectMessageDto;
import com.servicedesk.ticket.dto.SendDmRequest;
import com.servicedesk.ticket.service.MessagingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class DmController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessagingService messagingService;

    @MessageMapping("/dm.send")
    public void sendMessage(@Payload SendDmRequest request) {
        log.info("DM received conversationId={} from senderId={}", request.getConversationId(), request.getSenderId());

        DirectMessageDto saved = messagingService.saveMessage(request);

        messagingTemplate.convertAndSend(
                "/topic/dm/" + request.getConversationId(),
                saved
        );
    }
}
