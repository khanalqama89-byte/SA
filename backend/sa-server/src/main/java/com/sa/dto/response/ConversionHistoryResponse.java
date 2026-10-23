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
public class ConversionHistoryResponse {

    private Long id;
    private String jobId;
    private String toolName;
    private String sourceFileName;
    private String outputFileName;
    private String status;
    private LocalDateTime createdAt;
}
