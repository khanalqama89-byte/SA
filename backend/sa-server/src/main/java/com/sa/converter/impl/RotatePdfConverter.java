package com.sa.converter.impl;

import com.sa.converter.ConversionResult;
import com.sa.converter.Converter;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.Map;

@Component
public class RotatePdfConverter implements Converter {

    @Override
    public String getToolSlug() {
        return "rotate-pdf";
    }

    @Override
    public String getSourceFormat() {
        return "pdf";
    }

    @Override
    public String getTargetFormat() {
        return "pdf";
    }

    @Override
    public ConversionResult convert(File inputFile, File outputFile, Map<String, String> options) throws Exception {
        int degrees = 90;
        if (options != null && options.containsKey("rotation")) {
            try {
                degrees = Integer.parseInt(options.get("rotation"));
            } catch (NumberFormatException ignored) {}
        }

        try (PDDocument document = Loader.loadPDF(inputFile)) {
            for (PDPage page : document.getPages()) {
                int currentRotation = page.getRotation();
                int newRotation = (currentRotation + degrees) % 360;
                page.setRotation(newRotation);
            }
            document.save(outputFile);
        }

        validateOutput(outputFile, "pdf");
        return ConversionResult.success(outputFile, "pdf", "application/pdf");
    }
}
