package com.servicedesk.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import com.servicedesk.ticket.enums.Priority;

@Data
public class TicketCreateRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;


    @NotNull(message = "Priority is required")
    private Priority priority;

    private String reporterName;
    private String reporterEmail;
}
