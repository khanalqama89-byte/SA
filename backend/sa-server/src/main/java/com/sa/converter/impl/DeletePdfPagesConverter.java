package com.sa.converter.impl;

import com.sa.converter.ConversionResult;
import com.sa.converter.Converter;
import com.sa.exception.ConversionException;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.*;

@Component
public class DeletePdfPagesConverter implements Converter {

    @Override
    public String getToolSlug() {
        return "delete-pdf-pages";
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
        String pagesParam = options != null ? options.getOrDefault("deletePages", options.get("pages")) : null;
        if (pagesParam == null || pagesParam.trim().isEmpty()) {
            throw new ConversionException("Please specify which pages to delete (e.g. '2,4' or '1-3').");
        }

        try (PDDocument sourceDoc = Loader.loadPDF(inputFile);
             PDDocument targetDoc = new PDDocument()) {

            int totalPages = sourceDoc.getNumberOfPages();
            Set<Integer> pagesToDelete = parsePageNumbers(pagesParam, totalPages);

            if (pagesToDelete.size() >= totalPages) {
                throw new ConversionException("Cannot delete all pages in the PDF document.");
            }

            for (int i = 1; i <= totalPages; i++) {
                if (!pagesToDelete.contains(i)) {
                    targetDoc.importPage(sourceDoc.getPage(i - 1));
                }
            }

            targetDoc.save(outputFile);
        }

        validateOutput(outputFile, "pdf");
        return ConversionResult.success(outputFile, "pdf", "application/pdf");
    }

    private Set<Integer> parsePageNumbers(String input, int totalPages) {
        Set<Integer> result = new TreeSet<>();
        String[] parts = input.split("[,;]");
        for (String part : parts) {
            part = part.trim();
            if (part.contains("-")) {
                String[] range = part.split("-");
                if (range.length == 2) {
                    try {
                        int start = Math.max(1, Integer.parseInt(range[0].trim()));
                        int end = Math.min(totalPages, Integer.parseInt(range[1].trim()));
                        for (int i = start; i <= end; i++) {
                            result.add(i);
                        }
                    } catch (NumberFormatException ignored) {}
                }
            } else {
                try {
                    int p = Integer.parseInt(part);
                    if (p >= 1 && p <= totalPages) {
                        result.add(p);
                    }
                } catch (NumberFormatException ignored) {}
            }
        }
        return result;
    }
}
