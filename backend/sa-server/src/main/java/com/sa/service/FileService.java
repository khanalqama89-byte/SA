package com.sa.service;

import com.sa.dto.response.FileResponse;
import com.sa.entity.FileRecord;
import com.sa.exception.ResourceNotFoundException;
import com.sa.exception.UnauthorizedException;
import com.sa.repository.FileRepository;
import com.sa.storage.FileStorageService;
import com.sa.util.FileValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class FileService {

    private static final Logger log = LoggerFactory.getLogger(FileService.class);

    private final FileRepository fileRepository;
    private final FileStorageService storageService;

    @Value("${sa.storage.max-file-size:52428800}")
    private long maxFileSizeBytes;

    @Value("${sa.storage.expiry-hours:24}")
    private int expiryHours;

    public FileService(FileRepository fileRepository, FileStorageService storageService) {
        this.fileRepository = fileRepository;
        this.storageService = storageService;
    }

    @Transactional
    public FileResponse uploadFile(MultipartFile file, Long userId) {
        // Validate file strictly (Phase 9 & Phase 45)
        FileValidator.validateUpload(file, maxFileSizeBytes);

        String fileId = UUID.randomUUID().toString();
        String originalFilename = file.getOriginalFilename();
        String extension = FileValidator.getExtension(originalFilename);
        String mimeType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        // Store file safely using UUID storedName
        String relativePath = storageService.storeUpload(file, fileId);
        String storedName = fileId + (extension.isEmpty() ? "" : "." + extension);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusHours(expiryHours);

        FileRecord record = FileRecord.builder()
                .id(fileId)
                .userId(userId)
                .originalName(originalFilename)
                .storedName(storedName)
                .extension(extension)
                .mimeType(mimeType)
                .size(file.getSize())
                .storagePath(relativePath)
                .fileType("UPLOAD")
                .createdAt(now)
                .expiresAt(expiresAt)
                .build();

        FileRecord saved = fileRepository.save(record);
        log.info("Uploaded file id [{}] original [{}] by user [{}]", fileId, originalFilename, userId);

        return mapToResponse(saved);
    }

    public FileRecord getFileRecord(String fileId) {
        return fileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found with ID: " + fileId));
    }

    @Transactional
    public void deleteFile(String fileId, Long currentUserId, boolean isAdmin) {
        FileRecord record = getFileRecord(fileId);

        if (!isAdmin && record.getUserId() != null && !record.getUserId().equals(currentUserId)) {
            throw new UnauthorizedException("You are not authorized to delete this file.");
        }

        String category = "PROCESSED".equalsIgnoreCase(record.getFileType()) ? "processed" : "uploads";
        storageService.delete(record.getStoragePath(), category);
        fileRepository.delete(record);
        log.info("Deleted file [{}]", fileId);
    }

    public FileResponse mapToResponse(FileRecord record) {
        return FileResponse.builder()
                .id(record.getId())
                .originalName(record.getOriginalName())
                .extension(record.getExtension())
                .mimeType(record.getMimeType())
                .size(record.getSize())
                .fileType(record.getFileType())
                .createdAt(record.getCreatedAt())
                .expiresAt(record.getExpiresAt())
                .build();
    }
}
