package com.sa.repository;

import com.sa.entity.Tool;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ToolRepository extends JpaRepository<Tool, Long> {
    Optional<Tool> findBySlug(String slug);
    List<Tool> findByEnabledTrue();
}
