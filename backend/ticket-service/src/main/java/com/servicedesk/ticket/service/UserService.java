package com.servicedesk.ticket.service;

import com.servicedesk.ticket.dto.AuthResponse;
import com.servicedesk.ticket.dto.UserDetailResponse;
import com.servicedesk.ticket.dto.UserLoginRequest;
import com.servicedesk.ticket.dto.UserRegisterRequest;
import com.servicedesk.ticket.dto.UserResponse;
import com.servicedesk.ticket.enums.UserStatus;

import java.util.List;

import com.servicedesk.ticket.dto.UserLoginRequest;
import com.servicedesk.ticket.dto.UserRegisterRequest;
import com.servicedesk.ticket.dto.UserResponse;
import com.servicedesk.ticket.enums.UserStatus;

import java.util.List;

public interface UserService {
    AuthResponse register(UserRegisterRequest request);
    AuthResponse login(UserLoginRequest request);
    List<UserResponse> getAllUsers();
    List<UserResponse> getUsersByRole(com.servicedesk.ticket.enums.UserRole role);
    UserDetailResponse getUserById(Long id);
    UserResponse updateStatus(Long userId, UserStatus status);
    UserResponse deleteUser(Long userId);
    UserResponse createUser(UserRegisterRequest request);
    UserResponse updateUserRole(Long userId, com.servicedesk.ticket.enums.UserRole role, String agentType);
}
