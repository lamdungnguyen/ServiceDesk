package com.servicedesk.ticket.security;

import com.servicedesk.ticket.entity.User;
import com.servicedesk.ticket.enums.UserStatus;
import com.servicedesk.ticket.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authorization = request.getHeader("Authorization");

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = authorization.substring(7);
            JwtService.AuthenticatedUser authenticatedUser = jwtService.parseToken(token);

            // Fetch user from DB to ensure they are active (preserving original logic)
            User user = userRepository.findById(authenticatedUser.userId())
                    .orElseThrow(() -> new IllegalArgumentException("User no longer exists"));

            if (user.getStatus() != UserStatus.ACTIVE) {
                throw new IllegalArgumentException("User account is not active");
            }

            // Set Spring Security Context
            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    authenticatedUser,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + authenticatedUser.role().name()))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);

            // Preserve UserContext for backward compatibility
            UserContext.setUserId(user.getId());
            UserContext.setUserRole(user.getRole());
            UserContext.setUsername(user.getName() == null || user.getName().trim().isEmpty() ? user.getUsername() : user.getName());

        } catch (Exception e) {
            // Token is invalid or user is inactive
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, e.getMessage());
            return; // Stop filter chain
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            UserContext.clear();
            SecurityContextHolder.clearContext();
        }
    }
}
