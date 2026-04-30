package com.servicedesk.ticket.service;

import com.servicedesk.ticket.entity.Notification;
import java.util.List;

public interface NotificationService {
    Notification createNotification(Long userId, String message, String type);
    Notification createNotification(Long userId, String message, String type, Long ticketId);
    List<Notification> getUserNotifications(Long userId);
    Notification markAsRead(Long notificationId);
    void markAllAsRead(Long userId);
    long getUnreadCount(Long userId);
    void notifyAdmins(String message, String type);
}
