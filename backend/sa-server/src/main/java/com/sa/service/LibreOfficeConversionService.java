package com.sa.service;

import com.sa.exception.ConversionException;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

@Service
public class LibreOfficeConversionService {

    private static final Logger log = LoggerFactory.getLogger(LibreOfficeConversionService.class);

    @Value("${sa.libreoffice.path:soffice}")
    private String libreOfficePath;

    public boolean isLibreOfficeAvailable() {
        try {
            Process process = new ProcessBuilder(libreOfficePath, "--version").start();
            boolean finished = process.waitFor(5, TimeUnit.SECONDS);
            return finished && process.exitValue() == 0;
        } catch (Exception e) {
            log.debug("LibreOffice not available on path: {}. Falling back to internal engine.", libreOfficePath);
            return false;
        }
    }

    public File convertOfficeToPdf(File inputFile, File targetOutputFile) {
        Path tempWorkDir = null;
        try {
            tempWorkDir = Files.createTempDirectory("sa_libreoffice_");

            // Execute headless LibreOffice conversion
            // Safe execution without arbitrary shell interpolation
            ProcessBuilder processBuilder = new ProcessBuilder(
                    libreOfficePath,
                    "--headless",
                    "--invisible",
                    "--nodefault",
                    "--nofirststartwizard",
                    "--nolockcheck",
                    "--nologo",
                    "--norestore",
                    "--convert-to", "pdf",
                    "--outdir", tempWorkDir.toAbsolutePath().toString(),
                    inputFile.getAbsolutePath()
            );

            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();

            boolean finished = process.waitFor(60, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new ConversionException("LibreOffice conversion timed out after 60 seconds.");
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                throw new ConversionException("LibreOffice conversion process failed with exit code: " + exitCode);
            }

            // Find generated PDF in tempWorkDir
            String baseName = getBaseName(inputFile.getName());
            File generatedPdf = tempWorkDir.resolve(baseName + ".pdf").toFile();

            if (!generatedPdf.exists() || generatedPdf.length() == 0) {
                throw new ConversionException("LibreOffice did not produce a valid output PDF.");
            }

            // Move to destination
            FileUtils.copyFile(generatedPdf, targetOutputFile);
            return targetOutputFile;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ConversionException("Conversion was interrupted", e);
        } catch (IOException e) {
            throw new ConversionException("IO failure during LibreOffice conversion", e);
        } finally {
            if (tempWorkDir != null) {
                try {
                    FileUtils.deleteDirectory(tempWorkDir.toFile());
                } catch (IOException e) {
                    log.warn("Could not delete temporary LibreOffice working directory: {}", tempWorkDir);
                }
            }
        }
    }

    private String getBaseName(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(0, dot) : filename;
    }
}
