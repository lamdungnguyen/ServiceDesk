package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.CustomFieldConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomFieldConfigRepository extends JpaRepository<CustomFieldConfig, Long> {
    List<CustomFieldConfig> findByCategoryIgnoreCase(String category);
}
