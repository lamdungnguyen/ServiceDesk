package com.servicedesk.ticket.dto;

import com.servicedesk.ticket.entity.User;
import com.servicedesk.ticket.enums.UserRole;
import com.servicedesk.ticket.enums.UserStatus;
import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String username;
    private String name;
    private String email;
    private String phone;
    private UserRole role;
    private String agentType;
    private UserStatus status;

    public static UserResponse from(User user) {
        UserResponse res = new UserResponse();
        res.setId(user.getId());
        res.setUsername(user.getUsername());
        res.setName(user.getName());
        res.setEmail(user.getEmail());
        res.setPhone(user.getPhone());
        res.setRole(user.getRole());
        res.setAgentType(user.getAgentType());
        res.setStatus(user.getStatus());
        return res;
    }
}
