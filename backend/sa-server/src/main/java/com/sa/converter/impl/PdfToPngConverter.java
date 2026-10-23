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
public class PdfToPngConverter implements Converter {

    @Override
    public String getToolSlug() {
        return "pdf-to-png";
    }

    @Override
    public String getSourceFormat() {
        return "pdf";
    }

    @Override
    public String getTargetFormat() {
        return "png";
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
                BufferedImage image = renderer.renderImageWithDPI(0, dpi, ImageType.ARGB);
                ImageIO.write(image, "PNG", outputFile);
                validateOutput(outputFile, "png");
                return ConversionResult.success(outputFile, "png", "image/png");
            } else {
                File zipFile = outputFile;
                try (ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(zipFile))) {
                    for (int i = 0; i < pageCount; i++) {
                        BufferedImage image = renderer.renderImageWithDPI(i, dpi, ImageType.ARGB);
                        ZipEntry entry = new ZipEntry(String.format("page_%03d.png", i + 1));
                        zos.putNextEntry(entry);
                        ImageIO.write(image, "PNG", zos);
                        zos.closeEntry();
                    }
                }
                validateOutput(zipFile, null);
                return ConversionResult.success(zipFile, "zip", "application/zip");
            }
        }
    }
}
