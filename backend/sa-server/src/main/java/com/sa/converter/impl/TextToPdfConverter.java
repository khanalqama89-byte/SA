package com.sa.converter.impl;

import com.sa.converter.ConversionResult;
import com.sa.converter.Converter;
import org.apache.commons.io.FileUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Component
public class TextToPdfConverter implements Converter {

    @Override
    public String getToolSlug() {
        return "text-to-pdf";
    }

    @Override
    public String getSourceFormat() {
        return "txt";
    }

    @Override
    public String getTargetFormat() {
        return "pdf";
    }

    @Override
    public ConversionResult convert(File inputFile, File outputFile, Map<String, String> options) throws Exception {
        List<String> lines = FileUtils.readLines(inputFile, StandardCharsets.UTF_8);

        try (PDDocument document = new PDDocument()) {
            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.COURIER);
            float fontSize = 10f;
            float leading = 13f;
            float margin = 40f;

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            float width = page.getMediaBox().getWidth() - 2 * margin;
            float startY = page.getMediaBox().getHeight() - margin;
            float y = startY;

            PDPageContentStream contentStream = new PDPageContentStream(document, page);
            contentStream.setFont(font, fontSize);
            contentStream.setLeading(leading);

            for (String rawLine : lines) {
                String line = rawLine == null ? "" : rawLine;
                if (line.isEmpty()) {
                    y -= leading;
                    if (y < margin) {
                        contentStream.close();
                        page = new PDPage(PDRectangle.A4);
                        document.addPage(page);
                        contentStream = new PDPageContentStream(document, page);
                        contentStream.setFont(font, fontSize);
                        contentStream.setLeading(leading);
                        y = startY;
                    }
                    continue;
                }

                // Wrap lines if longer than printable page width
                int maxCharsPerLine = (int) (width / (font.getStringWidth("A") / 1000 * fontSize));
                if (maxCharsPerLine <= 0) maxCharsPerLine = 80;

                int start = 0;
                while (start < line.length()) {
                    int end = Math.min(start + maxCharsPerLine, line.length());
                    String chunk = line.substring(start, end);

                    if (y < margin) {
                        contentStream.close();
                        page = new PDPage(PDRectangle.A4);
                        document.addPage(page);
                        contentStream = new PDPageContentStream(document, page);
                        contentStream.setFont(font, fontSize);
                        contentStream.setLeading(leading);
                        y = startY;
                    }

                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin, y);
                    contentStream.showText(sanitizeText(chunk));
                    contentStream.endText();

                    y -= leading;
                    start = end;
                }
            }

            contentStream.close();
            document.save(outputFile);
        }

        validateOutput(outputFile, "pdf");
        return ConversionResult.success(outputFile, "pdf", "application/pdf");
    }

    private String sanitizeText(String text) {
        if (text == null) return "";
        return text.replaceAll("[^\\x20-\\x7E]", " ");
    }
}
