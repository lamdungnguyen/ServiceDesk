package com.servicedesk.ticket.config;

import com.servicedesk.ticket.dto.UserPresenceResponse;
import com.servicedesk.ticket.security.JwtService;
import com.servicedesk.ticket.service.UserPresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserPresenceEventListener {

    private static final String PRESENCE_TOPIC = "/topic/presence/users";

    private final JwtService jwtService;
    private final UserPresenceService userPresenceService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleSessionConnected(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        String authorization = accessor.getFirstNativeHeader("Authorization");

        if (sessionId == null || authorization == null || !authorization.startsWith("Bearer ")) {
            return;
        }

        try {
            JwtService.AuthenticatedUser user = jwtService.parseToken(authorization.substring(7));
            UserPresenceResponse presence = userPresenceService.markOnline(sessionId, user.userId());
            messagingTemplate.convertAndSend(PRESENCE_TOPIC, presence);
        } catch (Exception ex) {
            log.warn("Could not register websocket presence for session {}", sessionId, ex);
        }
    }

    @EventListener
    public void handleSessionDisconnected(SessionDisconnectEvent event) {
        UserPresenceResponse presence = userPresenceService.markOffline(event.getSessionId());
        if (presence != null) {
            messagingTemplate.convertAndSend(PRESENCE_TOPIC, presence);
        }
    }
}
