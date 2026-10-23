package com.sa.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversion_jobs", indexes = {
    @Index(name = "idx_jobs_user_id", columnList = "user_id"),
    @Index(name = "idx_jobs_status", columnList = "status"),
    @Index(name = "idx_jobs_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversionJob {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "source_file_id", nullable = false, length = 36)
    private String sourceFileId;

    @Column(name = "output_file_id", length = 36)
    private String outputFileId;

    @Column(name = "source_format", nullable = false, length = 20)
    private String sourceFormat;

    @Column(name = "target_format", nullable = false, length = 20)
    private String targetFormat;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private JobStatus status = JobStatus.QUEUED;

    @Column(nullable = false)
    @Builder.Default
    private int progress = 0;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
