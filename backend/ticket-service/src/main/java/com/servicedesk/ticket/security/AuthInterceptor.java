package com.servicedesk.ticket.security;

import com.servicedesk.ticket.enums.UserRole;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String userIdStr = request.getHeader("X-User-Id");
        String roleStr = request.getHeader("X-User-Role");
        String uri = request.getRequestURI();
        String method = request.getMethod();

        // Allow preflight CORS
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        // Public endpoints — no auth required
        if (uri.equals("/api/v1/users/login") || uri.equals("/api/v1/users/register")) {
            return true;
        }

        // Allow guest to create ticket (no headers)
        if ("POST".equalsIgnoreCase(method) && "/api/v1/tickets".equals(uri)) {
            if (userIdStr == null || roleStr == null) {
                return true; // Guest submission
            }
        }

        // Block if auth headers missing
        if (userIdStr == null || roleStr == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing authentication headers (X-User-Id, X-User-Role)");
            return false;
        }

        try {
            Long userId = Long.parseLong(userIdStr);
            UserRole role = UserRole.valueOf(roleStr.toUpperCase());
            String username = request.getHeader("X-User-Name");
            UserContext.setUserId(userId);
            UserContext.setUserRole(role);
            if (username != null) {
                UserContext.setUsername(username);
            }
        } catch (IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid User ID or Role format");
            return false;
        }

        return true;
    }


    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }
}
