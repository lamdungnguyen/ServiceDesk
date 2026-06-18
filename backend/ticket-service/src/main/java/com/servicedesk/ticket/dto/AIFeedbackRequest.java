package com.servicedesk.ticket.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body khi Agent submit correction.
 *
 * Chỉ gửi field muốn correct.
 * null = Agent không sửa field đó.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIFeedbackRequest {

    @NotNull(message = "ticketId is required")
    private Long ticketId;

    /**
     * Category Agent sửa thành.
     * null nếu Agent đồng ý với AI prediction.
     */
    private String correctedCategory;

    /**
     * Priority Agent sửa thành.
     * null nếu Agent đồng ý với AI prediction.
     */
    private String correctedPriority;
}
