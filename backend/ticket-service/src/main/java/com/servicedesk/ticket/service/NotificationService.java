package com.servicedesk.ticket.service;

import com.servicedesk.ticket.entity.Notification;
import java.util.List;

public interface NotificationService {
    Notification createNotification(Long userId, String message, String type);
    List<Notification> getUserNotifications(Long userId);
    Notification markAsRead(Long notificationId);
    void notifyAdmins(String message, String type);
}
