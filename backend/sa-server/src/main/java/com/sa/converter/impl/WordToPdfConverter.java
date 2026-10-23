package com.sa.converter.impl;

import com.sa.converter.ConversionResult;
import com.sa.converter.Converter;
import com.sa.service.LibreOfficeConversionService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileInputStream;
import java.util.List;
import java.util.Map;

@Component
public class WordToPdfConverter implements Converter {

    private static final Logger log = LoggerFactory.getLogger(WordToPdfConverter.class);
    private final LibreOfficeConversionService libreOfficeService;

    public WordToPdfConverter(LibreOfficeConversionService libreOfficeService) {
        this.libreOfficeService = libreOfficeService;
    }

    @Override
    public String getToolSlug() {
        return "word-to-pdf";
    }

    @Override
    public String getSourceFormat() {
        return "docx";
    }

    @Override
    public String getTargetFormat() {
        return "pdf";
    }

    @Override
    public ConversionResult convert(File inputFile, File outputFile, Map<String, String> options) throws Exception {
        if (libreOfficeService.isLibreOfficeAvailable()) {
            try {
                log.info("Converting DOCX to PDF using LibreOffice headless engine");
                libreOfficeService.convertOfficeToPdf(inputFile, outputFile);
                validateOutput(outputFile, "pdf");
                return ConversionResult.success(outputFile, "pdf", "application/pdf");
            } catch (Exception e) {
                log.warn("LibreOffice conversion failed, switching to native fallback: {}", e.getMessage());
            }
        }

        log.info("Converting DOCX to PDF using POI + PDFBox native engine");
        convertUsingNativeEngine(inputFile, outputFile);
        validateOutput(outputFile, "pdf");
        return ConversionResult.success(outputFile, "pdf", "application/pdf");
    }

    private void convertUsingNativeEngine(File inputFile, File outputFile) throws Exception {
        try (FileInputStream fis = new FileInputStream(inputFile);
             XWPFDocument docx = new XWPFDocument(fis);
             PDDocument pdfDocument = new PDDocument()) {

            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            float fontSize = 11f;
            float leading = 1.4f * fontSize;
            float margin = 50f;

            PDPage page = new PDPage(PDRectangle.A4);
            pdfDocument.addPage(page);

            float width = page.getMediaBox().getWidth() - 2 * margin;
            float startY = page.getMediaBox().getHeight() - margin;
            float y = startY;

            PDPageContentStream contentStream = new PDPageContentStream(pdfDocument, page);
            contentStream.setFont(font, fontSize);
            contentStream.setLeading(leading);

            List<XWPFParagraph> paragraphs = docx.getParagraphs();
            for (XWPFParagraph para : paragraphs) {
                String text = sanitizeText(para.getText());
                if (text == null || text.trim().isEmpty()) {
                    y -= leading;
                    if (y < margin) {
                        contentStream.close();
                        page = new PDPage(PDRectangle.A4);
                        pdfDocument.addPage(page);
                        contentStream = new PDPageContentStream(pdfDocument, page);
                        contentStream.setFont(font, fontSize);
                        contentStream.setLeading(leading);
                        y = startY;
                    }
                    continue;
                }

                // Wrap text lines safely
                String[] words = text.split("\\s+");
                StringBuilder line = new StringBuilder();

                for (String word : words) {
                    String testLine = line.length() == 0 ? word : line + " " + word;
                    float stringWidth = font.getStringWidth(testLine) / 1000 * fontSize;

                    if (stringWidth > width && line.length() > 0) {
                        if (y < margin) {
                            contentStream.close();
                            page = new PDPage(PDRectangle.A4);
                            pdfDocument.addPage(page);
                            contentStream = new PDPageContentStream(pdfDocument, page);
                            contentStream.setFont(font, fontSize);
                            contentStream.setLeading(leading);
                            y = startY;
                        }

                        contentStream.beginText();
                        contentStream.newLineAtOffset(margin, y);
                        contentStream.showText(sanitizeText(line.toString()));
                        contentStream.endText();
                        y -= leading;
                        line = new StringBuilder(word);
                    } else {
                        line = new StringBuilder(testLine);
                    }
                }

                if (line.length() > 0) {
                    if (y < margin) {
                        contentStream.close();
                        page = new PDPage(PDRectangle.A4);
                        pdfDocument.addPage(page);
                        contentStream = new PDPageContentStream(pdfDocument, page);
                        contentStream.setFont(font, fontSize);
                        contentStream.setLeading(leading);
                        y = startY;
                    }
                    contentStream.beginText();
                    contentStream.newLineAtOffset(margin, y);
                    contentStream.showText(sanitizeText(line.toString()));
                    contentStream.endText();
                    y -= (leading + 4f);
                }
            }

            contentStream.close();
            pdfDocument.save(outputFile);
        }
    }

    private String sanitizeText(String text) {
        if (text == null) return "";
        return text.replaceAll("[^\\x20-\\x7E]", " ");
    }
}
