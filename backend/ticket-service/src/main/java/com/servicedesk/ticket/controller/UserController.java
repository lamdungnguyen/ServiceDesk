package com.servicedesk.ticket.controller;

import com.servicedesk.ticket.dto.AuthResponse;
import com.servicedesk.ticket.dto.UserDetailResponse;
import com.servicedesk.ticket.dto.UserLoginRequest;
import com.servicedesk.ticket.dto.UserPresenceResponse;
import com.servicedesk.ticket.dto.UserRegisterRequest;
import com.servicedesk.ticket.dto.UserResponse;
import com.servicedesk.ticket.enums.UserRole;
import com.servicedesk.ticket.enums.UserStatus;
import com.servicedesk.ticket.security.UserContext;
import com.servicedesk.ticket.service.AccessControlService;
import com.servicedesk.ticket.service.UserPresenceService;
import com.servicedesk.ticket.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AccessControlService accessControlService;
    private final UserPresenceService userPresenceService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody UserRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody UserLoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(@RequestParam(required = false) com.servicedesk.ticket.enums.UserRole role) {
        accessControlService.requireRole(UserRole.AGENT, UserRole.ADMIN);
        if (role != null) {
            return ResponseEntity.ok(userService.getUsersByRole(role));
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/presence")
    public ResponseEntity<List<UserPresenceResponse>> getUserPresence() {
        accessControlService.requireRole(UserRole.ADMIN);
        return ResponseEntity.ok(userPresenceService.getAllPresence());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDetailResponse> getUserById(@PathVariable Long id) {
        if (!id.equals(UserContext.getUserId())) {
            accessControlService.requireRole(UserRole.AGENT, UserRole.ADMIN);
        }
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        accessControlService.requireRole(UserRole.ADMIN);
        UserStatus status = UserStatus.valueOf(body.get("status").toUpperCase());
        return ResponseEntity.ok(userService.updateStatus(id, status));
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserRegisterRequest request) {
        accessControlService.requireRole(UserRole.ADMIN);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<UserResponse> updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        accessControlService.requireRole(UserRole.ADMIN);
        UserRole role = UserRole.valueOf(body.get("role").toUpperCase());
        String agentType = body.get("agentType");
        return ResponseEntity.ok(userService.updateUserRole(id, role, agentType));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<UserResponse> deleteUser(@PathVariable Long id) {
        accessControlService.requireRole(UserRole.ADMIN);
        return ResponseEntity.ok(userService.deleteUser(id));
    }
}
