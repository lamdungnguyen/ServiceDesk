package com.servicedesk.ticket.service;

import com.servicedesk.ticket.dto.SettingsDto;

public interface SettingsService {
    SettingsDto getSettings();
    SettingsDto updateSettings(SettingsDto dto);
}
