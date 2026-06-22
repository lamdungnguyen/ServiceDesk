package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.UserPresenceResponse;
import com.servicedesk.ticket.repository.UserRepository;
import com.servicedesk.ticket.service.UserPresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserPresenceServiceImpl implements UserPresenceService {

    private final UserRepository userRepository;
    private final Map<String, Long> sessionUsers = new HashMap<>();
    private final Map<Long, Set<String>> userSessions = new HashMap<>();
    private final Map<Long, LocalDateTime> lastSeenByUser = new HashMap<>();

    @Override
    public synchronized UserPresenceResponse markOnline(String sessionId, Long userId) {
        sessionUsers.put(sessionId, userId);
        userSessions.computeIfAbsent(userId, ignored -> new HashSet<>()).add(sessionId);
        return new UserPresenceResponse(userId, "ONLINE", lastSeenByUser.get(userId));
    }

    @Override
    public synchronized UserPresenceResponse markOffline(String sessionId) {
        Long userId = sessionUsers.remove(sessionId);
        if (userId == null) {
            return null;
        }

        Set<String> sessions = userSessions.get(userId);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (!sessions.isEmpty()) {
                return new UserPresenceResponse(userId, "ONLINE", lastSeenByUser.get(userId));
            }
            userSessions.remove(userId);
        }

        LocalDateTime lastSeenAt = LocalDateTime.now();
        lastSeenByUser.put(userId, lastSeenAt);
        return new UserPresenceResponse(userId, "OFFLINE", lastSeenAt);
    }

    @Override
    public synchronized List<UserPresenceResponse> getAllPresence() {
        List<UserPresenceResponse> responses = new ArrayList<>();
        userRepository.findAll().forEach(user -> {
            boolean online = userSessions.containsKey(user.getId());
            responses.add(new UserPresenceResponse(
                    user.getId(),
                    online ? "ONLINE" : "OFFLINE",
                    lastSeenByUser.get(user.getId())
            ));
        });
        return responses;
    }
}
