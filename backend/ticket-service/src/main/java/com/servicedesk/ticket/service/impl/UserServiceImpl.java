package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.UserLoginRequest;
import com.servicedesk.ticket.dto.UserRegisterRequest;
import com.servicedesk.ticket.dto.UserResponse;
import com.servicedesk.ticket.entity.User;
import com.servicedesk.ticket.enums.UserRole;
import com.servicedesk.ticket.enums.UserStatus;
import com.servicedesk.ticket.exception.ResourceNotFoundException;
import com.servicedesk.ticket.repository.UserRepository;
import com.servicedesk.ticket.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserResponse register(UserRegisterRequest request) {
        // Check username uniqueness
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username '" + request.getUsername() + "' already exists.");
        }

        // Agents need admin approval; Customers and Admins are auto-active
        UserStatus initialStatus = (request.getRole() == UserRole.AGENT)
                ? UserStatus.PENDING
                : UserStatus.ACTIVE;

        User user = User.builder()
                .username(request.getUsername())
                .password(request.getPassword()) // NOTE: In production use BCryptPasswordEncoder
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .role(request.getRole())
                .agentType(request.getAgentType())
                .status(initialStatus)
                .build();

        User saved = userRepository.save(user);
        log.info("User registered: {} with role {} and status {}", saved.getUsername(), saved.getRole(), saved.getStatus());
        return UserResponse.from(saved);
    }

    @Override
    public UserResponse login(UserLoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid username or password."));

        // NOTE: In production use BCryptPasswordEncoder.matches()
        if (!user.getPassword().equals(request.getPassword())) {
            throw new ResourceNotFoundException("Invalid username or password.");
        }

        if (user.getStatus() == UserStatus.PENDING) {
            throw new IllegalStateException("Your account is pending admin approval.");
        }

        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new IllegalStateException("Your account has been deactivated. Please contact administrator.");
        }

        log.info("User logged in: {} ({})", user.getUsername(), user.getRole());
        return UserResponse.from(user);
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
}
