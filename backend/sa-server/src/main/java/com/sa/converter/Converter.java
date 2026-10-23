package com.sa.converter;

import com.sa.exception.ConversionException;

import java.io.File;
import java.util.Map;

public interface Converter {

    String getToolSlug();

    String getSourceFormat();

    String getTargetFormat();

    ConversionResult convert(File inputFile, File outputFile, Map<String, String> options) throws Exception;

    default void validateOutput(File outputFile, String expectedExtension) {
        if (outputFile == null || !outputFile.exists()) {
            throw new ConversionException("Conversion failed: Output file was not generated.");
        }
        if (outputFile.length() <= 0) {
            outputFile.delete();
            throw new ConversionException("Conversion failed: Generated output file is empty.");
        }
        if (expectedExtension != null && !outputFile.getName().toLowerCase().endsWith(expectedExtension.toLowerCase())) {
            throw new ConversionException("Conversion failed: Output file format does not match expected ." + expectedExtension);
        }
    }
}
