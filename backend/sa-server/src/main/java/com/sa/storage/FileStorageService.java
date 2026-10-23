package com.sa.storage;

import com.sa.exception.StorageException;
import com.sa.util.FileValidator;
import jakarta.annotation.PostConstruct;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    @Value("${sa.storage.base-path:../../storage}")
    private String configuredBasePath;

    private Path rootStoragePath;
    private Path uploadsPath;
    private Path processedPath;
    private Path tempPath;

    @PostConstruct
    public void init() {
        try {
            this.rootStoragePath = Paths.get(configuredBasePath).toAbsolutePath().normalize();
            this.uploadsPath = rootStoragePath.resolve("uploads");
            this.processedPath = rootStoragePath.resolve("processed");
            this.tempPath = rootStoragePath.resolve("temp");

            Files.createDirectories(uploadsPath);
            Files.createDirectories(processedPath);
            Files.createDirectories(tempPath);

            log.info("SA Storage initialized at root: {}", rootStoragePath);
        } catch (IOException e) {
            throw new StorageException("Could not initialize storage directory structure", e);
        }
    }

    public String storeUpload(MultipartFile file, String fileId) {
        String originalFilename = file.getOriginalFilename();
        String extension = FileValidator.getExtension(originalFilename);
        String storedFilename = fileId + (extension.isEmpty() ? "" : "." + extension);

        Path targetLocation = uploadsPath.resolve(storedFilename).normalize();

        // Path traversal validation check
        if (!targetLocation.startsWith(uploadsPath)) {
            throw new StorageException("Cannot store file outside target upload directory.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return uploadsPath.relativize(targetLocation).toString();
        } catch (IOException e) {
            throw new StorageException("Failed to store uploaded file: " + originalFilename, e);
        }
    }

    public String storeProcessed(File sourceFile, String fileId, String extension) {
        String storedFilename = fileId + (extension.startsWith(".") ? extension : "." + extension);
        Path targetLocation = processedPath.resolve(storedFilename).normalize();

        if (!targetLocation.startsWith(processedPath)) {
            throw new StorageException("Cannot store processed file outside target directory.");
        }

        try {
            Files.copy(sourceFile.toPath(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return processedPath.relativize(targetLocation).toString();
        } catch (IOException e) {
            throw new StorageException("Failed to store processed output file: " + storedFilename, e);
        }
    }

    public File createTempFile(String prefix, String suffix) {
        try {
            String safePrefix = (prefix == null || prefix.isEmpty()) ? "temp_" : prefix + "_";
            String safeSuffix = (suffix == null || suffix.isEmpty()) ? ".tmp" : (suffix.startsWith(".") ? suffix : "." + suffix);
            File temp = Files.createTempFile(tempPath, safePrefix + UUID.randomUUID().toString().substring(0, 8) + "_", safeSuffix).toFile();
            temp.delete(); // Delete 0-byte placeholder to prevent PDFBox overwrite corruption
            return temp;
        } catch (IOException e) {
            throw new StorageException("Could not create temporary working file", e);
        }
    }

    public File loadFile(String relativePath, String category) {
        Path basePath = "processed".equalsIgnoreCase(category) ? processedPath : uploadsPath;
        Path resolvedPath = basePath.resolve(relativePath).normalize();

        if (!resolvedPath.startsWith(basePath)) {
            throw new StorageException("Security check failed: Path traversal detected.");
        }

        File file = resolvedPath.toFile();
        if (!file.exists()) {
            throw new StorageException("File not found on storage: " + relativePath);
        }
        return file;
    }

    public Resource loadAsResource(String relativePath, String category) {
        try {
            File file = loadFile(relativePath, category);
            Resource resource = new UrlResource(file.toURI());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new StorageException("Could not read file: " + relativePath);
            }
        } catch (MalformedURLException e) {
            throw new StorageException("Malformed URL for file: " + relativePath, e);
        }
    }

    public boolean delete(String relativePath, String category) {
        try {
            Path basePath = "processed".equalsIgnoreCase(category) ? processedPath : uploadsPath;
            Path resolvedPath = basePath.resolve(relativePath).normalize();
            if (resolvedPath.startsWith(basePath) && Files.exists(resolvedPath)) {
                return Files.deleteIfExists(resolvedPath);
            }
            return false;
        } catch (IOException e) {
            log.warn("Could not delete file {}: {}", relativePath, e.getMessage());
            return false;
        }
    }

    public boolean exists(String relativePath, String category) {
        Path basePath = "processed".equalsIgnoreCase(category) ? processedPath : uploadsPath;
        Path resolvedPath = basePath.resolve(relativePath).normalize();
        return resolvedPath.startsWith(basePath) && Files.exists(resolvedPath);
    }

    public void cleanDirectory(Path directory) {
        if (directory != null && Files.exists(directory)) {
            try {
                FileUtils.cleanDirectory(directory.toFile());
            } catch (IOException e) {
                log.warn("Failed to clean directory {}: {}", directory, e.getMessage());
            }
        }
    }

    public Path getTempPath() {
        return tempPath;
    }

    public Path getUploadsPath() {
        return uploadsPath;
    }

    public Path getProcessedPath() {
        return processedPath;
    }
}
