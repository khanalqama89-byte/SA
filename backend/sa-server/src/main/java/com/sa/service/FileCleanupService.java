package com.sa.service;

import com.sa.entity.FileRecord;
import com.sa.repository.FileRepository;
import com.sa.storage.FileStorageService;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FileCleanupService {

    private static final Logger log = LoggerFactory.getLogger(FileCleanupService.class);

    private final FileRepository fileRepository;
    private final FileStorageService storageService;

    public FileCleanupService(FileRepository fileRepository, FileStorageService storageService) {
        this.fileRepository = fileRepository;
        this.storageService = storageService;
    }

    /**
     * Executes automatically every hour to purge expired documents and temporary files (Phase 28)
     */
    @Scheduled(cron = "${sa.cleanup.cron:0 0 * * * *}")
    @Transactional
    public void cleanupExpiredFiles() {
        LocalDateTime now = LocalDateTime.now();
        log.info("Starting automated file cleanup job at {}", now);

        List<FileRecord> expiredFiles = fileRepository.findByExpiresAtBefore(now);
        int deletedCount = 0;

        for (FileRecord fileRecord : expiredFiles) {
            try {
                String category = "PROCESSED".equalsIgnoreCase(fileRecord.getFileType()) ? "processed" : "uploads";
                storageService.delete(fileRecord.getStoragePath(), category);
                fileRepository.delete(fileRecord);
                deletedCount++;
            } catch (Exception e) {
                log.warn("Failed to delete expired file [{}]: {}", fileRecord.getId(), e.getMessage());
            }
        }

        // Clean temporary scratch files older than 2 hours
        cleanTempDirectory();

        log.info("Automated cleanup completed. Removed {} expired file records.", deletedCount);
    }

    private void cleanTempDirectory() {
        try {
            File tempDir = storageService.getTempPath().toFile();
            if (tempDir.exists() && tempDir.isDirectory()) {
                long cutoff = System.currentTimeMillis() - (2 * 3600 * 1000); // 2 hours
                File[] tempFiles = tempDir.listFiles();
                if (tempFiles != null) {
                    for (File f : tempFiles) {
                        if (f.lastModified() < cutoff) {
                            FileUtils.deleteQuietly(f);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error cleaning temporary working directory: {}", e.getMessage());
        }
    }
}
