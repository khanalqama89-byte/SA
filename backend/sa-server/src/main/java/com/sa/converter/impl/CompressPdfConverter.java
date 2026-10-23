package com.sa.converter.impl;

import com.sa.converter.ConversionResult;
import com.sa.converter.Converter;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.cos.COSName;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.graphics.PDXObject;
import org.apache.pdfbox.pdmodel.graphics.image.JPEGFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Component;

import java.awt.image.BufferedImage;
import java.io.File;
import java.util.Map;

@Component
public class CompressPdfConverter implements Converter {

    @Override
    public String getToolSlug() {
        return "compress-pdf";
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
        float quality = 0.75f; // Safe balanced quality
        if (options != null && options.containsKey("compressionLevel")) {
            String level = options.get("compressionLevel").toUpperCase();
            switch (level) {
                case "HIGH":
                    quality = 0.50f;
                    break;
                case "LOW":
                    quality = 0.85f;
                    break;
                case "MEDIUM":
                default:
                    quality = 0.75f;
                    break;
            }
        }

        try (PDDocument document = Loader.loadPDF(inputFile)) {
            for (PDPage page : document.getPages()) {
                PDResources resources = page.getResources();
                if (resources == null) continue;

                for (COSName name : resources.getXObjectNames()) {
                    PDXObject xObject = resources.getXObject(name);
                    if (xObject instanceof PDImageXObject) {
                        PDImageXObject img = (PDImageXObject) xObject;
                        try {
                            BufferedImage bi = img.getImage();
                            if (bi != null) {
                                PDImageXObject compressedImage = JPEGFactory.createFromImage(document, bi, quality);
                                resources.put(name, compressedImage);
                            }
                        } catch (Exception ignored) {
                            // If an image cannot be re-compressed, retain original cleanly
                        }
                    }
                }
            }

            // Save document with structural compression
            document.save(outputFile);
        }

        validateOutput(outputFile, "pdf");
        return ConversionResult.success(outputFile, "pdf", "application/pdf");
    }
}
