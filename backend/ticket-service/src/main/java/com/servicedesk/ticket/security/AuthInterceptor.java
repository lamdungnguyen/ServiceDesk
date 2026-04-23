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

        // Allow OPTIONS requests for CORS
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        // Allow guest to create ticket
        if ("POST".equalsIgnoreCase(request.getMethod()) && "/api/v1/tickets".equals(request.getRequestURI())) {
            if (userIdStr == null || roleStr == null) {
                // It's a guest request
                return true;
            }
        }

        // For mock authentication, if headers are missing, we can either block or default.
        // Let's block if missing to enforce RBAC.
        if (userIdStr == null || roleStr == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing authentication headers (X-User-Id, X-User-Role)");
            return false;
        }

        try {
            Long userId = Long.parseLong(userIdStr);
            UserRole role = UserRole.valueOf(roleStr.toUpperCase());
            
            UserContext.setUserId(userId);
            UserContext.setUserRole(role);
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
