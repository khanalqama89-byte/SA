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
public class FileResponse {

    private String id;
    private String originalName;
    private String extension;
    private String mimeType;
    private Long size;
    private String fileType;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
