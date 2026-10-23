package com.sa.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversion_history", indexes = {
    @Index(name = "idx_history_user_id", columnList = "user_id"),
    @Index(name = "idx_history_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "job_id", nullable = false, length = 36)
    private String jobId;

    @Column(name = "tool_name", nullable = false, length = 100)
    private String toolName;

    @Column(name = "source_file_name", nullable = false)
    private String sourceFileName;

    @Column(name = "output_file_name")
    private String outputFileName;

    @Column(nullable = false, length = 30)
    private String status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
