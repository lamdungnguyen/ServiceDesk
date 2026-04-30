package com.servicedesk.ticket.entity;

public enum SupportRequestStatus {
    WAITING,    // Customer created request, waiting for agent
    ACTIVE,     // Agent accepted, chat in progress
    CLOSED      // Chat completed
}
