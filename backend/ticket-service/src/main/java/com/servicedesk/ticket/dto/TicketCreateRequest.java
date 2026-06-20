package com.servicedesk.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import com.servicedesk.ticket.enums.Priority;

import java.util.List;

@Data
public class TicketCreateRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;


    @NotNull(message = "Priority is required")
    private Priority priority;

    private String category;
    private List<TicketCustomFieldValueDto> customFields;

    private String reporterName;
    private String reporterEmail;
}
