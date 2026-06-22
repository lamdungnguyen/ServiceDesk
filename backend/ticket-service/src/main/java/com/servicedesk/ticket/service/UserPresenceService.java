package com.servicedesk.ticket.service;

import com.servicedesk.ticket.dto.UserPresenceResponse;

import java.util.List;

public interface UserPresenceService {
    UserPresenceResponse markOnline(String sessionId, Long userId);
    UserPresenceResponse markOffline(String sessionId);
    List<UserPresenceResponse> getAllPresence();
}
