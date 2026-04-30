package com.servicedesk.ticket.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CallSignal {
    /**
     * One of: CALL_REQUEST, CALL_ACCEPT, CALL_REJECT, CALL_END, OFFER, ANSWER, ICE
     */
    private String type;

    private Long ticketId;
    private Long senderId;
    private String senderName;
    private String senderRole;

    /** Optional: only the targetUserId should react to the signal (used for OFFER/ANSWER/ICE). */
    private Long targetUserId;

    /** Free-form payload: SDP string for OFFER/ANSWER, or stringified RTCIceCandidate JSON for ICE. */
    private String payload;
}
