package com.sa.converter.impl;

import com.sa.converter.ConversionResult;
import com.sa.converter.Converter;
import com.sa.service.LibreOfficeConversionService;
import org.apache.commons.io.FileUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class HtmlToPdfConverter implements Converter {

    private static final Logger log = LoggerFactory.getLogger(HtmlToPdfConverter.class);
    private final LibreOfficeConversionService libreOfficeService;

    public HtmlToPdfConverter(LibreOfficeConversionService libreOfficeService) {
        this.libreOfficeService = libreOfficeService;
    }

    @Override
    public String getToolSlug() {
        return "html-to-pdf";
    }

    @Override
    public String getSourceFormat() {
        return "html";
    }

    @Override
    public String getTargetFormat() {
        return "pdf";
    }

    @Override
    public ConversionResult convert(File inputFile, File outputFile, Map<String, String> options) throws Exception {
        if (libreOfficeService.isLibreOfficeAvailable()) {
            try {
                log.info("Converting HTML to PDF with LibreOffice engine");
                libreOfficeService.convertOfficeToPdf(inputFile, outputFile);
                validateOutput(outputFile, "pdf");
                return ConversionResult.success(outputFile, "pdf", "application/pdf");
            } catch (Exception e) {
                log.warn("LibreOffice HTML conversion failed, using native fallback: {}", e.getMessage());
            }
        }

        log.info("Converting HTML to PDF with native PDFBox parser");
        String rawHtml = FileUtils.readFileToString(inputFile, StandardCharsets.UTF_8);
        String cleanText = stripHtml(rawHtml);

        try (PDDocument pdfDocument = new PDDocument()) {
            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            float fontSize = 11f;
            float leading = 15f;
            float margin = 50f;

            PDPage page = new PDPage(PDRectangle.A4);
            pdfDocument.addPage(page);

            float width = page.getMediaBox().getWidth() - 2 * margin;
            float startY = page.getMediaBox().getHeight() - margin;
            float y = startY;

            PDPageContentStream contentStream = new PDPageContentStream(pdfDocument, page);
            contentStream.setFont(font, fontSize);
            contentStream.setLeading(leading);

            String[] paragraphs = cleanText.split("\n\n");
            for (String paragraph : paragraphs) {
                String singleLine = paragraph.replaceAll("\\s+", " ").trim();
                if (singleLine.isEmpty()) continue;

                String[] words = singleLine.split(" ");
                StringBuilder line = new StringBuilder();

                for (String word : words) {
                    String test = line.length() == 0 ? word : line + " " + word;
                    float stringWidth = font.getStringWidth(test) / 1000 * fontSize;

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
                        line = new StringBuilder(test);
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
                    y -= (leading + 8f);
                }
            }

            contentStream.close();
            pdfDocument.save(outputFile);
        }

        validateOutput(outputFile, "pdf");
        return ConversionResult.success(outputFile, "pdf", "application/pdf");
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html
                .replaceAll("(?i)<head[\\s\\S]*?</head>", "")
                .replaceAll("(?i)<style[\\s\\S]*?</style>", "")
                .replaceAll("(?i)<script[\\s\\S]*?</script>", "")
                .replaceAll("(?i)<br\\s*/?>", "\n")
                .replaceAll("(?i)</p>", "\n\n")
                .replaceAll("(?i)</div>", "\n")
                .replaceAll("(?i)</li>", "\n")
                .replaceAll("<[^>]+>", " ")
                .replaceAll("&nbsp;", " ")
                .replaceAll("&amp;", "&")
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("&quot;", "\"")
                .trim();
    }

    private String sanitizeText(String text) {
        if (text == null) return "";
        return text.replaceAll("[^\\x20-\\x7E]", " ");
    }
}
