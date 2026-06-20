package com.servicedesk.ticket.controller;

import com.servicedesk.ticket.entity.CustomFieldConfig;
import com.servicedesk.ticket.repository.CustomFieldConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/custom-fields")
@RequiredArgsConstructor
public class CustomFieldController {

    private final CustomFieldConfigRepository customFieldConfigRepository;

    @GetMapping("/{category}")
    public ResponseEntity<List<CustomFieldConfig>> getFieldsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(customFieldConfigRepository.findByCategoryIgnoreCase(category));
    }

    @PostMapping
    public ResponseEntity<CustomFieldConfig> createField(@RequestBody CustomFieldConfig config) {
        return ResponseEntity.ok(customFieldConfigRepository.save(config));
    }
}
