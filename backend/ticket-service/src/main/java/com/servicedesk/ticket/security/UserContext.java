package com.servicedesk.ticket.security;

import com.servicedesk.ticket.enums.UserRole;

public class UserContext {
    private static final ThreadLocal<Long> CURRENT_USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> CURRENT_USERNAME = new ThreadLocal<>();
    private static final ThreadLocal<UserRole> CURRENT_USER_ROLE = new ThreadLocal<>();

    public static void setUserId(Long userId) {
        CURRENT_USER_ID.set(userId);
    }

    public static Long getUserId() {
        return CURRENT_USER_ID.get();
    }

    public static void setUsername(String username) {
        CURRENT_USERNAME.set(username);
    }

    public static String getUsername() {
        return CURRENT_USERNAME.get();
    }

    public static void setUserRole(UserRole role) {
        CURRENT_USER_ROLE.set(role);
    }

    public static UserRole getUserRole() {
        return CURRENT_USER_ROLE.get();
    }

    public static void clear() {
        CURRENT_USER_ID.remove();
        CURRENT_USERNAME.remove();
        CURRENT_USER_ROLE.remove();
    }
}
