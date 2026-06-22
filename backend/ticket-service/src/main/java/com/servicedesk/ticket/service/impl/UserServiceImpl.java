package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.AuthResponse;
import com.servicedesk.ticket.dto.UserDetailResponse;
import com.servicedesk.ticket.dto.UserLoginRequest;
import com.servicedesk.ticket.dto.UserRegisterRequest;
import com.servicedesk.ticket.dto.UserResponse;
import com.servicedesk.ticket.entity.User;
import com.servicedesk.ticket.enums.TicketStatus;
import com.servicedesk.ticket.enums.UserRole;
import com.servicedesk.ticket.enums.UserStatus;
import com.servicedesk.ticket.exception.ResourceNotFoundException;
import com.servicedesk.ticket.repository.TicketRepository;
import com.servicedesk.ticket.repository.UserRepository;
import com.servicedesk.ticket.security.JwtService;
import com.servicedesk.ticket.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    public AuthResponse register(UserRegisterRequest request) {
        if (request.getRole() == UserRole.AGENT || request.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException("Only customers can self-register. Agents and Admins must be created by an Administrator.");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username '" + request.getUsername() + "' already exists.");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .role(UserRole.CUSTOMER)
                .status(UserStatus.ACTIVE)
                .build();

        User saved = userRepository.save(user);
        log.info("User registered: {} with role {} and status {}", saved.getUsername(), saved.getRole(), saved.getStatus());
        return buildAuthResponse(saved, saved.getStatus() == UserStatus.ACTIVE);
    }

    @Override
    public UserResponse createUser(UserRegisterRequest request) {
        // Authorization: only ADMIN can create users with roles other than CUSTOMER
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only administrators can create users.");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username '" + request.getUsername() + "' already exists.");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .role(request.getRole())
                .agentType(request.getRole() == UserRole.AGENT ? request.getAgentType() : null)
                .status(UserStatus.ACTIVE)
                .build();

        User saved = userRepository.save(user);
        log.info("Admin created user: {} with role {}", saved.getUsername(), saved.getRole());
        return UserResponse.from(saved);
    }

    @Override
    public UserResponse updateUserRole(Long userId, UserRole role, String agentType) {
        // Authorization: only ADMIN can update roles
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only administrators can update user roles.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setRole(role);
        if (role == UserRole.AGENT) {
            user.setAgentType(agentType);
        } else {
            user.setAgentType(null);
        }

        log.info("User {} role updated to {}", user.getUsername(), role);
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    @Transactional
    public AuthResponse login(UserLoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid username or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResourceNotFoundException("Invalid username or password.");
        }

        if (user.getStatus() == UserStatus.PENDING) {
            throw new IllegalStateException("Your account is pending admin approval.");
        }

        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new IllegalStateException("Your account has been deactivated. Please contact administrator.");
        }

        log.info("User logged in: {} ({})", user.getUsername(), user.getRole());
        return buildAuthResponse(user, true);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserResponse> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role).stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    @Override
    public UserDetailResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        List<TicketStatus> openStatuses = Arrays.asList(
                TicketStatus.RESOLVED, TicketStatus.CLOSED);

        long totalTickets = ticketRepository.countByReporterId(id);
        long openTickets = ticketRepository.countByReporterIdAndStatusNotIn(id, openStatuses);

        return UserDetailResponse.from(user, totalTickets, openTickets);
    }

    @Override
    public UserResponse updateStatus(Long userId, UserStatus status) {
        // Authorization: only ADMIN can update status
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only administrators can update user status.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setStatus(status);
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    public UserResponse deleteUser(Long userId) {
        // Authorization: only ADMIN can delete users
        User currentUser = getCurrentUser();
        if (currentUser.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only administrators can delete users.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        userRepository.delete(user);
        return UserResponse.from(user);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required.");
        }
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found in database."));
    }

    private AuthResponse buildAuthResponse(User user, boolean includeToken) {
        String token = includeToken ? jwtService.generateToken(user) : null;
        return new AuthResponse(token, UserResponse.from(user));
    }
}