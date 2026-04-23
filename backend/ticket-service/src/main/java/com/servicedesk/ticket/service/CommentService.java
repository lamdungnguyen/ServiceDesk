package com.servicedesk.ticket.service;

import com.servicedesk.ticket.dto.CommentCreateRequest;
import com.servicedesk.ticket.dto.CommentResponse;

import java.util.List;

public interface CommentService {
    CommentResponse addComment(CommentCreateRequest request);
    List<CommentResponse> getCommentsByTicketId(Long ticketId);
}
