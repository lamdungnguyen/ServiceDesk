package com.servicedesk.ticket.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "custom_field_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomFieldConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String fieldName;

    @Column(nullable = false)
    private String fieldType; // e.g., TEXT, DROPDOWN, CHECKBOX

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String options; // Comma-separated options for DROPDOWN

    @Column(nullable = false)
    @Builder.Default
    private Boolean isRequired = false;
}
