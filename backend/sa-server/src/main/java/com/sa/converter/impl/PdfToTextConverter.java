package com.sa.converter.impl;

import com.sa.converter.ConversionResult;
import com.sa.converter.Converter;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class PdfToTextConverter implements Converter {

    @Override
    public String getToolSlug() {
        return "pdf-to-text";
    }

    @Override
    public String getSourceFormat() {
        return "pdf";
    }

    @Override
    public String getTargetFormat() {
        return "txt";
    }

    @Override
    public ConversionResult convert(File inputFile, File outputFile, Map<String, String> options) throws Exception {
        try (PDDocument document = Loader.loadPDF(inputFile)) {
            PDFTextStripper stripper = new PDFTextStripper();

            // Optional page range
            if (options != null && options.containsKey("startPage")) {
                stripper.setStartPage(Integer.parseInt(options.get("startPage")));
            }
            if (options != null && options.containsKey("endPage")) {
                stripper.setEndPage(Integer.parseInt(options.get("endPage")));
            }

            String text = stripper.getText(document);

            try (PrintWriter writer = new PrintWriter(new FileWriter(outputFile, StandardCharsets.UTF_8))) {
                writer.print(text != null ? text : "");
            }
        }

        validateOutput(outputFile, "txt");
        return ConversionResult.success(outputFile, "txt", "text/plain");
    }
}
