package com.sa.converter.impl;

import com.sa.converter.ConversionResult;
import com.sa.converter.Converter;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.Map;

@Component
public class JpgToPdfConverter implements Converter {

    @Override
    public String getToolSlug() {
        return "jpg-to-pdf";
    }

    @Override
    public String getSourceFormat() {
        return "jpg";
    }

    @Override
    public String getTargetFormat() {
        return "pdf";
    }

    @Override
    public ConversionResult convert(File inputFile, File outputFile, Map<String, String> options) throws Exception {
        try (PDDocument document = new PDDocument()) {
            PDImageXObject image = PDImageXObject.createFromFileByExtension(inputFile, document);

            float imgWidth = image.getWidth();
            float imgHeight = image.getHeight();

            // Create page matching image aspect ratio
            PDRectangle pageSize = new PDRectangle(imgWidth, imgHeight);
            PDPage page = new PDPage(pageSize);
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                contentStream.drawImage(image, 0, 0, imgWidth, imgHeight);
            }

            document.save(outputFile);
        }

        validateOutput(outputFile, "pdf");
        return ConversionResult.success(outputFile, "pdf", "application/pdf");
    }
}
