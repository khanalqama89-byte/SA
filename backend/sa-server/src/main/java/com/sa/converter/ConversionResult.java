package com.sa.converter;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.File;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversionResult {

    private boolean success;
    private String outputExtension;
    private String mimeType;
    private String errorMessage;
    private File outputFile;

    public static ConversionResult success(File outputFile, String outputExtension, String mimeType) {
        return ConversionResult.builder()
                .success(true)
                .outputFile(outputFile)
                .outputExtension(outputExtension)
                .mimeType(mimeType)
                .build();
    }

    public static ConversionResult failure(String errorMessage) {
        return ConversionResult.builder()
                .success(false)
                .errorMessage(errorMessage)
                .build();
    }
}
