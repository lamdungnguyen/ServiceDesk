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
        // Block AGENT/ADMIN self-registration
        if (request.getRole() == UserRole.AGENT || request.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException("Only customers can self-register. Agents and Admins must be created by an Administrator.");
        }

        // Check username uniqueness
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username '" + request.getUsername() + "' already exists.");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .role(UserRole.CUSTOMER) // Force role
                .status(UserStatus.ACTIVE)
                .build();

        User saved = userRepository.save(user);
        log.info("User registered: {} with role {} and status {}", saved.getUsername(), saved.getRole(), saved.getStatus());
        return buildAuthResponse(saved, saved.getStatus() == UserStatus.ACTIVE);
    }

    @Override
    public UserResponse createUser(UserRegisterRequest request) {
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
                .status(UserStatus.ACTIVE) // Admin created users are always active
                .build();

        User saved = userRepository.save(user);
        log.info("Admin created user: {} with role {}", saved.getUsername(), saved.getRole());
        return UserResponse.from(saved);
    }

    @Override
    public UserResponse updateUserRole(Long userId, UserRole role, String agentType) {
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

        if (!isPasswordMatch(user, request.getPassword())) {
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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setStatus(status);
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    public UserResponse deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        userRepository.delete(user);
        return UserResponse.from(user);
    }

    private boolean isPasswordMatch(User user, String rawPassword) {
        String storedPassword = user.getPassword();
        if (storedPassword == null) {
            return false;
        }

        if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }

        if (storedPassword.equals(rawPassword)) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(user);
            return true;
        }

        return false;
    }

    private AuthResponse buildAuthResponse(User user, boolean includeToken) {
        String token = includeToken ? jwtService.generateToken(user) : null;
        return new AuthResponse(token, UserResponse.from(user));
    }
}
