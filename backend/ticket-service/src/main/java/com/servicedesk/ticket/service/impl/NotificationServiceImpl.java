package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.entity.Notification;
import com.servicedesk.ticket.entity.User;
import com.servicedesk.ticket.enums.UserRole;
import com.servicedesk.ticket.exception.ResourceNotFoundException;
import com.servicedesk.ticket.repository.NotificationRepository;
import com.servicedesk.ticket.repository.UserRepository;
import com.servicedesk.ticket.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public Notification createNotification(Long userId, String message, String type) {
        return createNotification(userId, message, type, null);
    }

    @Override
    @Transactional
    public Notification createNotification(Long userId, String message, String type, Long ticketId) {
        Notification notification = Notification.builder()
                .userId(userId)
                .message(message)
                .type(type)
                .ticketId(ticketId)
                .isRead(false)
                .build();
        Notification saved = notificationRepository.save(notification);

        // Push real-time notification via WebSocket
        messagingTemplate.convertAndSend("/topic/notifications/" + userId, saved);

        return saved;
    }

    @Override
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional
    public Notification markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    @Override
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public void notifyAdmins(String message, String type) {
        List<User> admins = userRepository.findByRole(UserRole.ADMIN);
        for (User admin : admins) {
            createNotification(admin.getId(), message, type);
        }
    }
}
