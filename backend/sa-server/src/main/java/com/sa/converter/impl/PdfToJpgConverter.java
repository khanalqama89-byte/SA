package com.sa.converter.impl;

import com.sa.converter.ConversionResult;
import com.sa.converter.Converter;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileOutputStream;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Component
public class PdfToJpgConverter implements Converter {

    @Override
    public String getToolSlug() {
        return "pdf-to-jpg";
    }

    @Override
    public String getSourceFormat() {
        return "pdf";
    }

    @Override
    public String getTargetFormat() {
        return "jpg";
    }

    @Override
    public ConversionResult convert(File inputFile, File outputFile, Map<String, String> options) throws Exception {
        int dpi = 150;
        if (options != null && options.containsKey("dpi")) {
            try {
                dpi = Integer.parseInt(options.get("dpi"));
            } catch (NumberFormatException ignored) {}
        }

        try (PDDocument document = Loader.loadPDF(inputFile)) {
            PDFRenderer renderer = new PDFRenderer(document);
            int pageCount = document.getNumberOfPages();

            if (pageCount == 1) {
                BufferedImage image = renderer.renderImageWithDPI(0, dpi, ImageType.RGB);
                ImageIO.write(image, "JPEG", outputFile);
                validateOutput(outputFile, "jpg");
                return ConversionResult.success(outputFile, "jpg", "image/jpeg");
            } else {
                // Multi-page PDF: Bundle pages into zip archive
                File zipFile = outputFile;
                try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(zipFile))) {
                    for (int i = 0; i < pageCount; i++) {
                        BufferedImage image = renderer.renderImageWithDPI(i, dpi, ImageType.RGB);
                        ZipEntry entry = new ZipEntry(String.format("page_%03d.jpg", i + 1));
                        zos.putNextEntry(entry);
                        ImageIO.write(image, "JPEG", zos);
                        zos.closeEntry();
                    }
                }
                validateOutput(zipFile, null);
                return ConversionResult.success(zipFile, "zip", "application/zip");
            }
        }
    }
}
