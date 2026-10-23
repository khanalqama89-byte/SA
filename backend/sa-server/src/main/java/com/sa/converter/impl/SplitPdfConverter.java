package com.sa.converter.impl;

import com.sa.converter.ConversionResult;
import com.sa.converter.Converter;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.multipdf.Splitter;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Component
public class SplitPdfConverter implements Converter {

    @Override
    public String getToolSlug() {
        return "split-pdf";
    }

    @Override
    public String getSourceFormat() {
        return "pdf";
    }

    @Override
    public String getTargetFormat() {
        return "zip";
    }

    @Override
    public ConversionResult convert(File inputFile, File outputFile, Map<String, String> options) throws Exception {
        try (PDDocument document = Loader.loadPDF(inputFile);
             ZipOutputStream zos = new ZipOutputStream(new FileOutputStream(outputFile))) {

            Splitter splitter = new Splitter();
            int splitInterval = 1;
            if (options != null && options.containsKey("interval")) {
                try {
                    splitInterval = Integer.parseInt(options.get("interval"));
                } catch (NumberFormatException ignored) {}
            }
            splitter.setSplitAtPage(splitInterval);

            List<PDDocument> documents = splitter.split(document);
            int index = 1;
            for (PDDocument doc : documents) {
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                doc.save(baos);
                doc.close();

                ZipEntry zipEntry = new ZipEntry(String.format("part_%03d.pdf", index++));
                zos.putNextEntry(zipEntry);
                zos.write(baos.toByteArray());
                zos.closeEntry();
            }
        }

        validateOutput(outputFile, "zip");
        return ConversionResult.success(outputFile, "zip", "application/zip");
    }
}
