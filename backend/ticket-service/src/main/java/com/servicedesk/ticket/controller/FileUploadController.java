package com.servicedesk.ticket.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/messages")
@CrossOrigin(origins = "*")
@Slf4j
public class FileUploadController {

    @Value("${messaging.upload-dir:uploads/}")
    private String uploadDir;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            String extension = originalName.contains(".")
                    ? originalName.substring(originalName.lastIndexOf('.'))
                    : "";
            String storedName = UUID.randomUUID() + extension;
            Path filePath = uploadPath.resolve(storedName);
            Files.write(filePath, file.getBytes());

            String fileUrl = "/uploads/" + storedName;
            log.info("File uploaded: {} -> {}", originalName, fileUrl);

            return ResponseEntity.ok(Map.of(
                    "fileUrl", fileUrl,
                    "fileName", originalName
            ));
        } catch (IOException e) {
            log.error("File upload failed", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
