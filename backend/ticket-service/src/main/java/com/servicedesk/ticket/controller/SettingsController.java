package com.servicedesk.ticket.controller;

import com.servicedesk.ticket.dto.SettingsDto;
import com.servicedesk.ticket.enums.UserRole;
import com.servicedesk.ticket.service.AccessControlService;
import com.servicedesk.ticket.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;
    private final AccessControlService accessControlService;

    @GetMapping
    public ResponseEntity<SettingsDto> getSettings() {
        accessControlService.requireRole(UserRole.AGENT, UserRole.ADMIN);
        return ResponseEntity.ok(settingsService.getSettings());
    }

    @PutMapping
    public ResponseEntity<SettingsDto> updateSettings(@RequestBody SettingsDto dto) {
        accessControlService.requireRole(UserRole.ADMIN);
        return ResponseEntity.ok(settingsService.updateSettings(dto));
    }
}
