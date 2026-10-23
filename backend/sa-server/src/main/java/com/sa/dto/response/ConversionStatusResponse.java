package com.sa.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversionStatusResponse {

    private String jobId;
    private String status;
    private int progress;
    private String errorMessage;
    private String outputFileId;
    private String outputFileName;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
