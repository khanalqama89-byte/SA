package com.sa.converter.impl;

import com.sa.converter.ConversionResult;
import com.sa.converter.Converter;
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.Map;

@Component
public class MergePdfConverter implements Converter {

    @Override
    public String getToolSlug() {
        return "merge-pdf";
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
        PDFMergerUtility merger = new PDFMergerUtility();
        merger.setDestinationFileName(outputFile.getAbsolutePath());
        merger.addSource(inputFile);

        // Check if secondary files are supplied in options
        if (options != null && options.containsKey("secondaryFilePaths")) {
            String paths = options.get("secondaryFilePaths");
            String[] fileList = paths.split(";");
            for (String path : fileList) {
                File sec = new File(path.trim());
                if (sec.exists() && sec.isFile()) {
                    merger.addSource(sec);
                }
            }
        }

        merger.mergeDocuments(null);

        validateOutput(outputFile, "pdf");
        return ConversionResult.success(outputFile, "pdf", "application/pdf");
    }
}
