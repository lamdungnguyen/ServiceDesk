package com.servicedesk.ticket.dto;

import com.servicedesk.ticket.enums.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserRegisterRequest {
    @NotBlank
    private String username;

    @NotBlank
    private String password;

    @NotBlank
    private String name;

    private String email;
    private String phone;

    @NotNull
    private UserRole role;

    private String agentType; // Only for AGENT role
}
