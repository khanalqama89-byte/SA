package com.sa.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversionRequest {

    @NotBlank(message = "Tool slug is required")
    private String toolSlug;

    @NotBlank(message = "Source file ID is required")
    private String sourceFileId;

    /**
     * Additional optional conversion options:
     * - "pageRange": e.g. "1-3,5"
     * - "rotation": "90", "180", "270"
     * - "deletePages": "2,4"
     * - "compressionLevel": "LOW", "MEDIUM", "HIGH"
     * - "mergeFileIds": comma-separated secondary file IDs for merging
     */
    @Builder.Default
    private Map<String, String> options = new HashMap<>();
}
