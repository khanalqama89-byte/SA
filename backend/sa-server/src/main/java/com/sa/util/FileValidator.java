package com.sa.util;

import com.sa.exception.InvalidFileException;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

public class FileValidator {

    private static final Set<String> ALLOWED_EXTENSIONS = new HashSet<>(Arrays.asList(
            "pdf", "docx", "doc", "txt", "html", "htm", "jpg", "jpeg", "png", "webp"
    ));

    private static final Set<String> BLOCKED_EXTENSIONS = new HashSet<>(Arrays.asList(
            "exe", "bat", "cmd", "sh", "bin", "jar", "war", "ear", "msi", "scr", "vbs", "ps1",
            "php", "jsp", "asp", "aspx", "cgi", "pl", "py", "rb", "dll", "so", "dylib"
    ));

    private static final Set<String> ALLOWED_MIME_TYPES = new HashSet<>(Arrays.asList(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "text/plain",
            "text/html",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "application/octet-stream" // for strict binary streams
    ));

    public static void validateUpload(MultipartFile file, long maxSizeBytes) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("Uploaded file cannot be empty.");
        }

        if (file.getSize() > maxSizeBytes) {
            throw new InvalidFileException("File size exceeds maximum allowed limit of " + (maxSizeBytes / (1024 * 1024)) + " MB.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new InvalidFileException("Uploaded file must have a valid filename.");
        }

        // Path traversal protection
        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new InvalidFileException("Filename contains illegal characters or path traversal sequences.");
        }

        String extension = getExtension(originalFilename).toLowerCase();
        if (BLOCKED_EXTENSIONS.contains(extension)) {
            throw new InvalidFileException("Executable or scripted files are strictly forbidden.");
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new InvalidFileException("Unsupported file extension: ." + extension);
        }

        String contentType = file.getContentType();
        if (contentType != null && !contentType.trim().isEmpty()) {
            String cleanType = contentType.split(";")[0].trim().toLowerCase();
            if (!ALLOWED_MIME_TYPES.contains(cleanType)) {
                throw new InvalidFileException("Unsupported MIME type: " + cleanType);
            }
        }
    }

    public static String getExtension(String filename) {
        if (filename == null) return "";
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex > 0 && dotIndex < filename.length() - 1) {
            return filename.substring(dotIndex + 1).toLowerCase();
        }
        return "";
    }

    public static String sanitizeFilename(String filename) {
        if (filename == null) return "document";
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
