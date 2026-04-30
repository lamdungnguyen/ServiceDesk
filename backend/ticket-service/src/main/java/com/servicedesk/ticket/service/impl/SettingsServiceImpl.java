package com.servicedesk.ticket.service.impl;

import com.servicedesk.ticket.dto.SettingsDto;
import com.servicedesk.ticket.entity.Settings;
import com.servicedesk.ticket.repository.SettingsRepository;
import com.servicedesk.ticket.service.SettingsService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SettingsServiceImpl implements SettingsService {

    private static final Long SETTINGS_ID = 1L;

    private final SettingsRepository settingsRepository;

    @PostConstruct
    public void initDefaultSettings() {
        if (!settingsRepository.existsById(SETTINGS_ID)) {
            settingsRepository.save(Settings.builder().id(SETTINGS_ID).build());
        }
    }

    @Override
    public SettingsDto getSettings() {
        Settings s = settingsRepository.findById(SETTINGS_ID)
                .orElseGet(() -> settingsRepository.save(Settings.builder().id(SETTINGS_ID).build()));
        return mapToDto(s);
    }

    @Override
    @Transactional
    public SettingsDto updateSettings(SettingsDto dto) {
        Settings s = settingsRepository.findById(SETTINGS_ID)
                .orElseGet(() -> Settings.builder().id(SETTINGS_ID).build());

        if (dto.getNotificationsEnabled() != null) s.setNotificationsEnabled(dto.getNotificationsEnabled());
        if (dto.getNotifyInApp() != null) s.setNotifyInApp(dto.getNotifyInApp());
        if (dto.getNotifyEmail() != null) s.setNotifyEmail(dto.getNotifyEmail());
        if (dto.getNotifyTicketAssigned() != null) s.setNotifyTicketAssigned(dto.getNotifyTicketAssigned());
        if (dto.getNotifyTicketResolved() != null) s.setNotifyTicketResolved(dto.getNotifyTicketResolved());
        if (dto.getNotifySlaWarning() != null) s.setNotifySlaWarning(dto.getNotifySlaWarning());
        if (dto.getNotifyEscalation() != null) s.setNotifyEscalation(dto.getNotifyEscalation());

        if (dto.getMaxResponseTimeMinutes() != null) s.setMaxResponseTimeMinutes(dto.getMaxResponseTimeMinutes());
        if (dto.getEscalationThresholdMinutes() != null) s.setEscalationThresholdMinutes(dto.getEscalationThresholdMinutes());
        if (dto.getSlaWarningThresholdMinutes() != null) s.setSlaWarningThresholdMinutes(dto.getSlaWarningThresholdMinutes());

        if (dto.getSessionTimeoutMinutes() != null) s.setSessionTimeoutMinutes(dto.getSessionTimeoutMinutes());
        if (dto.getAgentCanViewAllTickets() != null) s.setAgentCanViewAllTickets(dto.getAgentCanViewAllTickets());
        if (dto.getAgentCanExportData() != null) s.setAgentCanExportData(dto.getAgentCanExportData());

        if (dto.getAiServiceUrl() != null) s.setAiServiceUrl(dto.getAiServiceUrl());

        return mapToDto(settingsRepository.save(s));
    }

    private SettingsDto mapToDto(Settings s) {
        return SettingsDto.builder()
                .notificationsEnabled(s.getNotificationsEnabled())
                .notifyInApp(s.getNotifyInApp())
                .notifyEmail(s.getNotifyEmail())
                .notifyTicketAssigned(s.getNotifyTicketAssigned())
                .notifyTicketResolved(s.getNotifyTicketResolved())
                .notifySlaWarning(s.getNotifySlaWarning())
                .notifyEscalation(s.getNotifyEscalation())
                .maxResponseTimeMinutes(s.getMaxResponseTimeMinutes())
                .escalationThresholdMinutes(s.getEscalationThresholdMinutes())
                .slaWarningThresholdMinutes(s.getSlaWarningThresholdMinutes())
                .sessionTimeoutMinutes(s.getSessionTimeoutMinutes())
                .agentCanViewAllTickets(s.getAgentCanViewAllTickets())
                .agentCanExportData(s.getAgentCanExportData())
                .aiServiceUrl(s.getAiServiceUrl())
                .build();
    }
}
