package com.sa.repository;

import com.sa.entity.ConversionJob;
import com.sa.entity.JobStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversionJobRepository extends JpaRepository<ConversionJob, String> {
    List<ConversionJob> findByUserId(Long userId);
    List<ConversionJob> findByStatus(JobStatus status);
}
