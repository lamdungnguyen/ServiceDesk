package com.servicedesk.ticket.security;

import com.servicedesk.ticket.entity.User;
import com.servicedesk.ticket.enums.UserStatus;
import com.servicedesk.ticket.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String uri = request.getRequestURI();
        String method = request.getMethod();

        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }

        if (uri.equals("/api/v1/users/login") || uri.equals("/api/v1/users/register")) {
            return true;
        }

        String authorization = request.getHeader("Authorization");

        if ("POST".equalsIgnoreCase(method) && "/api/v1/tickets".equals(uri) && isBlank(authorization)) {
            return true;
        }

        if (isBlank(authorization) || !authorization.startsWith("Bearer ")) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid Authorization header");
            return false;
        }

        try {
            JwtService.AuthenticatedUser authenticatedUser = jwtService.parseToken(authorization.substring(7));
            User user = userRepository.findById(authenticatedUser.userId())
                    .orElseThrow(() -> new IllegalArgumentException("User no longer exists"));

            if (user.getStatus() != UserStatus.ACTIVE) {
                throw new IllegalArgumentException("User account is not active");
            }

            UserContext.setUserId(user.getId());
            UserContext.setUserRole(user.getRole());
            UserContext.setUsername(isBlank(user.getName()) ? user.getUsername() : user.getName());
        } catch (IllegalArgumentException e) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, e.getMessage());
            return false;
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserContext.clear();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
