package com.sa.converter.impl;

import com.sa.converter.ConversionResult;
import com.sa.converter.Converter;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.TextPosition;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTPageMar;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.CTSectPr;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.util.*;

@Component
public class PdfToWordConverter implements Converter {

    private static final Logger log = LoggerFactory.getLogger(PdfToWordConverter.class);

    private static final String FONT_FAMILY = "Calibri";
    private static final String COLOR_PRIMARY = "0F172A";    // Deep slate / charcoal
    private static final String COLOR_ACCENT = "2563EB";     // Royal blue
    private static final String COLOR_HEADING = "1E3A8A";    // Deep Navy
    private static final String COLOR_MUTED = "475569";      // Slate gray
    private static final String COLOR_BODY = "334155";       // Dark neutral

    private static final Set<String> KNOWN_SECTION_HEADERS = new HashSet<>(Arrays.asList(
            "PROFILE", "SUMMARY", "OBJECTIVE", "PROFESSIONAL SUMMARY",
            "WORK EXPERIENCE", "EXPERIENCE", "EMPLOYMENT HISTORY",
            "TECHNICAL SKILLS", "SKILLS", "CORE COMPETENCIES", "EXPERTISE",
            "PROJECTS", "PERSONAL PROJECTS", "KEY PROJECTS",
            "EDUCATION", "ACADEMIC BACKGROUND", "QUALIFICATIONS",
            "CERTIFICATIONS", "AWARDS", "ACHIEVEMENTS", "LANGUAGES",
            "PUBLICATIONS", "REFERENCES"
    ));

    @Override
    public String getToolSlug() {
        return "pdf-to-word";
    }

    @Override
    public String getSourceFormat() {
        return "pdf";
    }

    @Override
    public String getTargetFormat() {
        return "docx";
    }

    @Override
    public ConversionResult convert(File inputFile, File outputFile, Map<String, String> options) throws Exception {
        try (PDDocument pdfDocument = Loader.loadPDF(inputFile);
             XWPFDocument docx = new XWPFDocument()) {

            // Configure compact page margins (0.35 in = 500 dxa) to preserve exact 1-page layout
            CTSectPr sectPr = docx.getDocument().getBody().isSetSectPr()
                    ? docx.getDocument().getBody().getSectPr()
                    : docx.getDocument().getBody().addNewSectPr();
            CTPageMar pageMar = sectPr.isSetPgMar() ? sectPr.getPgMar() : sectPr.addNewPgMar();
            pageMar.setLeft(BigInteger.valueOf(500));
            pageMar.setRight(BigInteger.valueOf(500));
            pageMar.setTop(BigInteger.valueOf(500));
            pageMar.setBottom(BigInteger.valueOf(500));

            int totalPages = pdfDocument.getNumberOfPages();

            for (int pageIdx = 0; pageIdx < totalPages; pageIdx++) {
                PDPage page = pdfDocument.getPage(pageIdx);
                float pageWidth = page.getMediaBox().getWidth();

                List<TextLine> lines = extractLinesFromPage(pdfDocument, pageIdx + 1);
                if (lines.isEmpty()) {
                    continue;
                }

                renderPageContent(docx, lines, pageWidth);

                // Add page break between pages, but not after the last page
                if (pageIdx < totalPages - 1) {
                    XWPFParagraph breakPara = docx.createParagraph();
                    breakPara.setPageBreak(true);
                    breakPara.setSpacingBefore(0);
                    breakPara.setSpacingAfter(0);
                }
            }

            try (FileOutputStream fos = new FileOutputStream(outputFile)) {
                docx.write(fos);
            }
        }

        validateOutput(outputFile, "docx");
        return ConversionResult.success(outputFile, "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    }

    /**
     * Extracts all text lines on a page with font metadata, size, bold flag, and coordinates.
     */
    private List<TextLine> extractLinesFromPage(PDDocument doc, int pageNumber) throws IOException {
        List<TextLine> lines = new ArrayList<>();

        PDFTextStripper stripper = new PDFTextStripper() {
            @Override
            protected void writeString(String text, List<TextPosition> textPositions) throws IOException {
                if (textPositions == null || textPositions.isEmpty()) {
                    return;
                }
                TextLine line = new TextLine();
                line.y = textPositions.get(0).getYDirAdj();

                StringBuilder currentText = new StringBuilder();
                TextPosition prev = null;
                float curSize = 0;
                boolean curBold = false;
                float curX = 0;
                float curW = 0;

                for (TextPosition tp : textPositions) {
                    boolean bold = tp.getFont().getName().toLowerCase().contains("bold")
                            || tp.getFont().getName().toLowerCase().contains("heavy")
                            || tp.getFont().getName().toLowerCase().contains("black");
                    float size = tp.getFontSizeInPt();

                    if (prev == null) {
                        currentText.append(tp.getUnicode());
                        curSize = size;
                        curBold = bold;
                        curX = tp.getXDirAdj();
                        curW = tp.getWidthDirAdj();
                    } else if (Math.abs(size - curSize) < 0.5 && bold == curBold) {
                        currentText.append(tp.getUnicode());
                        curW += tp.getWidthDirAdj();
                    } else {
                        line.spans.add(new TextSpan(currentText.toString(), curSize, curBold, curX, curW));
                        currentText.setLength(0);
                        currentText.append(tp.getUnicode());
                        curSize = size;
                        curBold = bold;
                        curX = tp.getXDirAdj();
                        curW = tp.getWidthDirAdj();
                    }

                    line.minX = Math.min(line.minX, tp.getXDirAdj());
                    line.maxX = Math.max(line.maxX, tp.getXDirAdj() + tp.getWidthDirAdj());
                    prev = tp;
                }

                if (currentText.length() > 0) {
                    line.spans.add(new TextSpan(currentText.toString(), curSize, curBold, curX, curW));
                }

                lines.add(line);
            }
        };

        stripper.setStartPage(pageNumber);
        stripper.setEndPage(pageNumber);
        stripper.setSortByPosition(true);
        stripper.getText(doc);

        return lines;
    }

    /**
     * Renders lines into the Word document preserving layout (single-column vs 2-column).
     */
    private void renderPageContent(XWPFDocument docx, List<TextLine> lines, float pageWidth) {
        float midX = pageWidth / 2.0f;

        // Check for 2-column layout by finding lines that overlap in Y across the midpoint
        int multiColCount = 0;
        float multiColMinY = Float.MAX_VALUE;

        for (int i = 0; i < lines.size(); i++) {
            TextLine l1 = lines.get(i);
            if (l1.maxX < midX - 10) {
                for (int j = 0; j < lines.size(); j++) {
                    TextLine l2 = lines.get(j);
                    if (l2.minX > midX - 10 && Math.abs(l1.y - l2.y) < 10) {
                        multiColCount++;
                        multiColMinY = Math.min(multiColMinY, Math.min(l1.y, l2.y));
                        break;
                    }
                }
            }
        }

        boolean hasTwoColumns = multiColCount >= 3;

        if (!hasTwoColumns) {
            // Render as single column
            List<DocParagraph> paragraphs = buildParagraphs(lines);
            for (DocParagraph dp : paragraphs) {
                XWPFParagraph p = docx.createParagraph();
                renderParagraph(p, dp);
            }
            return;
        }

        // Partition lines into Top Header, Left Column, Right Column, and Bottom
        List<TextLine> topLines = new ArrayList<>();
        List<TextLine> leftLines = new ArrayList<>();
        List<TextLine> rightLines = new ArrayList<>();
        List<TextLine> bottomLines = new ArrayList<>();

        for (TextLine line : lines) {
            if (line.y < multiColMinY - 2.0f) {
                topLines.add(line);
            } else {
                if (line.maxX <= midX + 15) {
                    leftLines.add(line);
                } else if (line.minX >= midX - 15) {
                    rightLines.add(line);
                } else if (line.minX < midX - 40 && line.maxX > midX + 40) {
                    // Line spans across the full width after multi-column start
                    bottomLines.add(line);
                } else {
                    // Fallback to left
                    leftLines.add(line);
                }
            }
        }

        // Sort each partition by Y
        topLines.sort(Comparator.comparingDouble(l -> l.y));
        leftLines.sort(Comparator.comparingDouble(l -> l.y));
        rightLines.sort(Comparator.comparingDouble(l -> l.y));
        bottomLines.sort(Comparator.comparingDouble(l -> l.y));

        // 1. Render Top Header paragraphs
        List<DocParagraph> topParas = buildParagraphs(topLines);
        for (DocParagraph dp : topParas) {
            XWPFParagraph p = docx.createParagraph();
            renderParagraph(p, dp);
        }

        // 2. Render 2-Column Section inside a borderless table
        XWPFTable table = docx.createTable(1, 2);
        table.removeBorders();
        table.setWidth("100%");

        XWPFTableCell leftCell = table.getRow(0).getCell(0);
        XWPFTableCell rightCell = table.getRow(0).getCell(1);
        leftCell.setWidth("50%");
        rightCell.setWidth("50%");

        // Left column content
        List<DocParagraph> leftParas = buildParagraphs(leftLines);
        boolean firstLeft = true;
        for (DocParagraph dp : leftParas) {
            XWPFParagraph p = firstLeft ? leftCell.getParagraphs().get(0) : leftCell.addParagraph();
            firstLeft = false;
            renderParagraph(p, dp);
        }

        // Right column content
        List<DocParagraph> rightParas = buildParagraphs(rightLines);
        boolean firstRight = true;
        for (DocParagraph dp : rightParas) {
            XWPFParagraph p = firstRight ? rightCell.getParagraphs().get(0) : rightCell.addParagraph();
            firstRight = false;
            renderParagraph(p, dp);
        }

        // 3. Render Bottom paragraphs (if any)
        List<DocParagraph> bottomParas = buildParagraphs(bottomLines);
        for (DocParagraph dp : bottomParas) {
            XWPFParagraph p = docx.createParagraph();
            renderParagraph(p, dp);
        }
    }

    /**
     * Groups raw extracted lines into cohesive logical paragraphs, preserving structural distinctions.
     */
    private List<DocParagraph> buildParagraphs(List<TextLine> lines) {
        List<DocParagraph> paragraphs = new ArrayList<>();
        DocParagraph current = null;

        for (int i = 0; i < lines.size(); i++) {
            TextLine line = lines.get(i);
            String text = line.getFullText().trim();
            if (text.isEmpty()) {
                continue;
            }

            boolean isBullet = text.startsWith("•") || text.startsWith("▪") || text.startsWith("- ") || text.startsWith("* ");
            boolean isKnownHeader = KNOWN_SECTION_HEADERS.contains(text.toUpperCase());
            boolean isAllUpper = text.length() > 2 && text.equals(text.toUpperCase()) && text.matches(".*[A-Z].*");
            boolean isBold = !line.spans.isEmpty() && line.spans.get(0).isBold;
            float fontSize = !line.spans.isEmpty() ? line.spans.get(0).fontSize : 9.0f;

            boolean isContact = text.contains("@") || text.contains("github.com") || text.contains("linkedin.com") || text.matches(".*\\d{10}.*");
            boolean isHeading = isKnownHeader || (isAllUpper && isBold && text.length() < 35 && !text.contains("|"));
            boolean isSubheading = !isHeading && isBold && !isBullet && text.length() < 70 && !isContact;
            boolean isSkillCategory = text.contains(":") && text.indexOf(':') < 25 && isBold;
            boolean isLiveLink = text.startsWith("Live:") || text.startsWith("http");

            // Determine if this line MUST start a brand new paragraph
            boolean startNew = false;
            if (current == null) {
                startNew = true;
            } else if (isHeading) {
                startNew = true;
            } else if (current.isHeading) {
                startNew = true;
            } else if (isSubheading) {
                startNew = true;
            } else if (current.isSubheading) {
                startNew = true;
            } else if (isContact) {
                startNew = true;
            } else if (current.isContact) {
                startNew = true;
            } else if (isLiveLink) {
                startNew = true;
            } else if (current.isLiveLink) {
                startNew = true;
            } else if (isBullet) {
                startNew = true;
            } else if (isSkillCategory) {
                startNew = true;
            } else if (current.isSkillCategory) {
                // Continuation line of a skill category: merge unless a new category or heading starts
                if (isSkillCategory || isHeading || isSubheading || isBullet) {
                    startNew = true;
                } else {
                    startNew = false;
                }
            } else if (current.isBullet) {
                // Inside a bullet point: continuation lines are merged UNLESS it's a new item or heading
                if (isBold || isAllUpper || isHeading || isSubheading || isSkillCategory || isLiveLink) {
                    startNew = true;
                } else {
                    startNew = false;
                }
            } else if (current.spans.get(0).isBold != isBold && (isBold || current.spans.get(0).isBold)) {
                // Switch between bold title and normal text
                startNew = true;
            } else if (line.y - current.lastY > 12.0f) {
                startNew = true;
            }

            if (startNew) {
                current = new DocParagraph();
                current.isBullet = isBullet;
                current.isHeading = isHeading;
                current.isSubheading = isSubheading;
                current.isContact = isContact;
                current.isSkillCategory = isSkillCategory;
                current.isLiveLink = isLiveLink;
                current.primaryFontSize = fontSize;
                current.lastY = line.y;
                current.spans.addAll(line.spans);
                paragraphs.add(current);
            } else {
                // Merge continuation line with a space
                if (!current.spans.isEmpty()) {
                    TextSpan lastSpan = current.spans.get(current.spans.size() - 1);
                    if (!lastSpan.text.endsWith(" ") && !line.spans.isEmpty() && !line.spans.get(0).text.startsWith(" ")) {
                        current.spans.add(new TextSpan(" ", lastSpan.fontSize, lastSpan.isBold, line.minX, 3.0f));
                    }
                }
                current.spans.addAll(line.spans);
                current.lastY = line.y;
            }
        }

        return paragraphs;
    }

    /**
     * Renders a logical DocParagraph to an XWPFParagraph with proper styling, fonts, and compact spacing.
     */
    private void renderParagraph(XWPFParagraph p, DocParagraph dp) {
        String fullText = dp.getFullText().trim();
        p.setSpacingBefore(0);
        p.setSpacingAfter(0);

        // 1. Document Title (e.g. Candidate Name at top)
        if (dp.primaryFontSize >= 10.0f && dp.isHeading && fullText.length() < 30 && fullText.contains(" ") && !KNOWN_SECTION_HEADERS.contains(fullText.toUpperCase())) {
            p.setAlignment(ParagraphAlignment.CENTER);
            p.setSpacingBefore(0);
            p.setSpacingAfter(30); // 1.5 pt

            XWPFRun run = p.createRun();
            run.setText(fullText);
            run.setFontFamily(FONT_FAMILY);
            run.setFontSize(15);
            run.setBold(true);
            run.setColor(COLOR_PRIMARY);
            return;
        }

        // 2. Subtitle (e.g. FULL STACK DEVELOPER)
        if (dp.isHeading && (fullText.contains("DEVELOPER") || fullText.contains("ENGINEER")) && !KNOWN_SECTION_HEADERS.contains(fullText.toUpperCase())) {
            p.setAlignment(ParagraphAlignment.CENTER);
            p.setSpacingBefore(0);
            p.setSpacingAfter(30); // 1.5 pt

            XWPFRun run = p.createRun();
            run.setText(fullText);
            run.setFontFamily(FONT_FAMILY);
            run.setFontSize(10.5);
            run.setBold(true);
            run.setColor(COLOR_ACCENT);
            return;
        }

        // 3. Contact Line (phone, email, github)
        if (dp.isContact) {
            p.setAlignment(ParagraphAlignment.CENTER);
            p.setSpacingBefore(0);
            p.setSpacingAfter(80); // 4 pt

            XWPFRun run = p.createRun();
            run.setText(fullText);
            run.setFontFamily(FONT_FAMILY);
            run.setFontSize(8.5);
            run.setBold(false);
            run.setColor(COLOR_MUTED);
            return;
        }

        // 4. Major Section Headings (PROFILE, WORK EXPERIENCE, TECHNICAL SKILLS, EDUCATION, PROJECTS)
        if (dp.isHeading) {
            p.setAlignment(ParagraphAlignment.LEFT);
            p.setSpacingBefore(100); // 5 pt
            p.setSpacingAfter(25);   // 1.25 pt

            XWPFRun run = p.createRun();
            run.setText(fullText);
            run.setFontFamily(FONT_FAMILY);
            run.setFontSize(10);
            run.setBold(true);
            run.setColor(COLOR_HEADING);
            return;
        }

        // 5. Job Title / Project Title / Degree (Subheadings)
        if (dp.isSubheading) {
            p.setAlignment(ParagraphAlignment.LEFT);
            p.setSpacingBefore(50); // 2.5 pt
            p.setSpacingAfter(15);  // 0.75 pt

            XWPFRun run = p.createRun();
            run.setText(fullText);
            run.setFontFamily(FONT_FAMILY);
            run.setFontSize(9);
            run.setBold(true);
            run.setColor(COLOR_PRIMARY);
            return;
        }

        // 6. Bullet Items
        if (dp.isBullet) {
            p.setAlignment(ParagraphAlignment.LEFT);
            p.setSpacingBefore(0);
            p.setSpacingAfter(15); // 0.75 pt

            // Remove raw bullet symbol if we format cleanly
            String bulletText = fullText;
            if (bulletText.startsWith("•") || bulletText.startsWith("▪") || bulletText.startsWith("*")) {
                bulletText = bulletText.substring(1).trim();
            } else if (bulletText.startsWith("- ")) {
                bulletText = bulletText.substring(2).trim();
            }

            XWPFRun bulletRun = p.createRun();
            bulletRun.setText("•  ");
            bulletRun.setFontFamily(FONT_FAMILY);
            bulletRun.setFontSize(8.5);
            bulletRun.setBold(true);
            bulletRun.setColor(COLOR_ACCENT);

            XWPFRun textRun = p.createRun();
            textRun.setText(bulletText);
            textRun.setFontFamily(FONT_FAMILY);
            textRun.setFontSize(8.5);
            textRun.setBold(false);
            textRun.setColor(COLOR_BODY);
            return;
        }

        // 7. Skill Categories ("Category: Details")
        if (dp.isSkillCategory || (fullText.contains(":") && fullText.indexOf(':') < 25)) {
            p.setAlignment(ParagraphAlignment.LEFT);
            p.setSpacingBefore(0);
            p.setSpacingAfter(15); // 0.75 pt

            int colonIdx = fullText.indexOf(':');
            String prefix = fullText.substring(0, colonIdx + 1);
            String suffix = fullText.substring(colonIdx + 1);

            XWPFRun prefixRun = p.createRun();
            prefixRun.setText(prefix);
            prefixRun.setFontFamily(FONT_FAMILY);
            prefixRun.setFontSize(8.5);
            prefixRun.setBold(true);
            prefixRun.setColor(COLOR_PRIMARY);

            XWPFRun suffixRun = p.createRun();
            suffixRun.setText(suffix);
            suffixRun.setFontFamily(FONT_FAMILY);
            suffixRun.setFontSize(8.5);
            suffixRun.setBold(false);
            suffixRun.setColor(COLOR_BODY);
            return;
        }

        // 8. General Body Paragraphs
        p.setAlignment(ParagraphAlignment.LEFT);
        p.setSpacingBefore(0);
        p.setSpacingAfter(25); // 1.25 pt

        for (TextSpan span : dp.spans) {
            if (span.text.isEmpty()) continue;
            XWPFRun run = p.createRun();
            run.setText(span.text);
            run.setFontFamily(FONT_FAMILY);
            run.setFontSize(8.5);
            run.setBold(span.isBold);
            run.setColor(span.isBold ? COLOR_PRIMARY : COLOR_BODY);
        }
    }

    // --- Helper Models ---

    private static class TextSpan {
        String text;
        float fontSize;
        boolean isBold;
        float x;
        float width;

        TextSpan(String text, float fontSize, boolean isBold, float x, float width) {
            this.text = text;
            this.fontSize = fontSize;
            this.isBold = isBold;
            this.x = x;
            this.width = width;
        }
    }

    private static class TextLine {
        float y;
        float minX = Float.MAX_VALUE;
        float maxX = Float.MIN_VALUE;
        List<TextSpan> spans = new ArrayList<>();

        String getFullText() {
            StringBuilder sb = new StringBuilder();
            for (TextSpan s : spans) {
                sb.append(s.text);
            }
            return sb.toString();
        }
    }

    private static class DocParagraph {
        boolean isBullet;
        boolean isHeading;
        boolean isSubheading;
        boolean isContact;
        boolean isSkillCategory;
        boolean isLiveLink;
        float primaryFontSize = 9.0f;
        float lastY = 0;
        List<TextSpan> spans = new ArrayList<>();

        String getFullText() {
            StringBuilder sb = new StringBuilder();
            for (TextSpan s : spans) {
                sb.append(s.text);
            }
            return sb.toString();
        }
    }
}
