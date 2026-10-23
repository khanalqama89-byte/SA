package com.sa.converter;

import com.sa.converter.impl.*;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.apache.poi.xwpf.usermodel.*;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class PdfConverterTest {

    @TempDir
    Path tempDir;

    private File samplePdf;

    @BeforeEach
    void setUp() throws IOException {
        samplePdf = tempDir.resolve("sample.pdf").toFile();
        try (PDDocument doc = new PDDocument()) {
            PDPage page1 = new PDPage(PDRectangle.A4);
            doc.addPage(page1);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page1)) {
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 16);
                cs.newLineAtOffset(50, 750);
                cs.showText("Hello SA Document Converter Platform!");
                cs.endText();
            }

            PDPage page2 = new PDPage(PDRectangle.A4);
            doc.addPage(page2);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page2)) {
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                cs.newLineAtOffset(50, 750);
                cs.showText("Page 2 secondary content for splitting and rotating.");
                cs.endText();
            }

            doc.save(samplePdf);
        }
    }

    @Test
    void testPdfToTextConverter() throws Exception {
        PdfToTextConverter converter = new PdfToTextConverter();
        File outputTxt = tempDir.resolve("output.txt").toFile();

        ConversionResult result = converter.convert(samplePdf, outputTxt, new HashMap<>());

        assertTrue(result.isSuccess());
        assertTrue(outputTxt.exists());
        assertTrue(outputTxt.length() > 0);
        String text = Files.readString(outputTxt.toPath());
        assertTrue(text.contains("Hello SA Document Converter Platform!"));
    }

    @Test
    void testPdfToWordConverter() throws Exception {
        PdfToWordConverter converter = new PdfToWordConverter();
        File outputDocx = tempDir.resolve("output.docx").toFile();

        ConversionResult result = converter.convert(samplePdf, outputDocx, new HashMap<>());

        assertTrue(result.isSuccess());
        assertTrue(outputDocx.exists());
        assertTrue(outputDocx.length() > 0);
        assertEquals("docx", result.getOutputExtension());
    }

    @Test
    void testRotatePdfConverter() throws Exception {
        RotatePdfConverter converter = new RotatePdfConverter();
        File outputRotated = tempDir.resolve("rotated.pdf").toFile();
        Map<String, String> options = Map.of("rotation", "90");

        ConversionResult result = converter.convert(samplePdf, outputRotated, options);

        assertTrue(result.isSuccess());
        assertTrue(outputRotated.exists());
        try (PDDocument doc = Loader.loadPDF(outputRotated)) {
            assertEquals(90, doc.getPage(0).getRotation());
        }
    }

    @Test
    void testSplitPdfConverter() throws Exception {
        SplitPdfConverter converter = new SplitPdfConverter();
        File outputZip = tempDir.resolve("split.zip").toFile();

        ConversionResult result = converter.convert(samplePdf, outputZip, new HashMap<>());

        assertTrue(result.isSuccess());
        assertTrue(outputZip.exists());
        assertTrue(outputZip.length() > 0);
        assertEquals("zip", result.getOutputExtension());
    }

    @Test
    void testCompressPdfConverter() throws Exception {
        CompressPdfConverter converter = new CompressPdfConverter();
        File outputCompressed = tempDir.resolve("compressed.pdf").toFile();

        ConversionResult result = converter.convert(samplePdf, outputCompressed, Map.of("compressionLevel", "HIGH"));

        assertTrue(result.isSuccess());
        assertTrue(outputCompressed.exists());
        assertTrue(outputCompressed.length() > 0);
    }

    @Test
    void testInspectUserPdf() throws Exception {
        File userPdf = new File("../../storage/uploads/c0d54d65-59ee-4556-9d4f-1f90f023d955.pdf");
        if (!userPdf.exists()) {
            userPdf = new File("../storage/uploads/c0d54d65-59ee-4556-9d4f-1f90f023d955.pdf");
        }
        if (!userPdf.exists()) {
            return;
        }

        PdfToWordConverter converter = new PdfToWordConverter();
        File outputDocx = tempDir.resolve("user_converted.docx").toFile();
        ConversionResult result = converter.convert(userPdf, outputDocx, new HashMap<>());

        assertTrue(result.isSuccess());
        assertTrue(outputDocx.exists());
        assertTrue(outputDocx.length() > 0);

        try (java.io.FileInputStream fis = new java.io.FileInputStream(outputDocx);
             XWPFDocument checkDoc = new XWPFDocument(fis)) {
            // Verify 2-column table was created for the multi-column section
            assertFalse(checkDoc.getTables().isEmpty(), "Expected 2-column table for multi-column layout");
            XWPFTable table = checkDoc.getTables().get(0);
            assertEquals(2, table.getRow(0).getTableCells().size(), "Expected 2 columns in table");
            assertTrue(table.getRow(0).getCell(0).getParagraphs().size() > 10, "Expected left column content");
            assertTrue(table.getRow(0).getCell(1).getParagraphs().size() > 10, "Expected right column content");
        }
    }
}
