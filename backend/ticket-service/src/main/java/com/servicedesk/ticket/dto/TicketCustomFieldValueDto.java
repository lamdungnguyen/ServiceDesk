package com.servicedesk.ticket.dto;

import lombok.Data;

@Data
public class TicketCustomFieldValueDto {
    private Long fieldId;
    private String fieldName;
    private String fieldType;
    private String value;
}
