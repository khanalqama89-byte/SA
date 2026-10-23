package com.sa.repository;

import com.sa.entity.FileRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FileRepository extends JpaRepository<FileRecord, String> {
    List<FileRecord> findByUserId(Long userId);
    List<FileRecord> findByExpiresAtBefore(LocalDateTime dateTime);
}
