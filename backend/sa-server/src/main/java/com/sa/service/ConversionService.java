package com.sa.service;

import com.sa.converter.ConversionResult;
import com.sa.converter.Converter;
import com.sa.converter.ConverterRegistry;
import com.sa.dto.request.ConversionRequest;
import com.sa.dto.response.ConversionResponse;
import com.sa.dto.response.ConversionStatusResponse;
import com.sa.entity.*;
import com.sa.exception.ConversionException;
import com.sa.exception.InvalidFileException;
import com.sa.exception.ResourceNotFoundException;
import com.sa.repository.ConversionHistoryRepository;
import com.sa.repository.ConversionJobRepository;
import com.sa.repository.FileRepository;
import com.sa.storage.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ConversionService {

    private static final Logger log = LoggerFactory.getLogger(ConversionService.class);

    private final ConversionJobRepository jobRepository;
    private final ConversionHistoryRepository historyRepository;
    private final FileRepository fileRepository;
    private final ToolService toolService;
    private final FileStorageService storageService;
    private final ConverterRegistry converterRegistry;

    @Value("${sa.storage.expiry-hours:24}")
    private int expiryHours;

    public ConversionService(ConversionJobRepository jobRepository,
                             ConversionHistoryRepository historyRepository,
                             FileRepository fileRepository,
                             ToolService toolService,
                             FileStorageService storageService,
                             ConverterRegistry converterRegistry) {
        this.jobRepository = jobRepository;
        this.historyRepository = historyRepository;
        this.fileRepository = fileRepository;
        this.toolService = toolService;
        this.storageService = storageService;
        this.converterRegistry = converterRegistry;
    }

    @Transactional
    public ConversionResponse createJob(ConversionRequest request, Long userId) {
        // Validate Tool
        Tool tool = toolService.getToolEntityBySlug(request.getToolSlug());
        if (!tool.isEnabled()) {
            throw new InvalidFileException("Tool '" + tool.getName() + "' is currently disabled.");
        }

        // Validate Source File
        FileRecord sourceFile = fileRepository.findById(request.getSourceFileId())
                .orElseThrow(() -> new ResourceNotFoundException("Source file not found with ID: " + request.getSourceFileId()));

        String expectedSource = tool.getSourceFormat().toLowerCase();
        if (!sourceFile.getExtension().equalsIgnoreCase(expectedSource)) {
            throw new InvalidFileException(String.format("Invalid file format. Tool '%s' requires .%s file, but uploaded file is .%s",
                    tool.getName(), expectedSource, sourceFile.getExtension()));
        }

        String jobId = UUID.randomUUID().toString();
        ConversionJob job = ConversionJob.builder()
                .id(jobId)
                .userId(userId)
                .sourceFileId(sourceFile.getId())
                .sourceFormat(tool.getSourceFormat())
                .targetFormat(tool.getTargetFormat())
                .status(JobStatus.QUEUED)
                .progress(0)
                .createdAt(LocalDateTime.now())
                .build();

        jobRepository.save(job);
        log.info("Created conversion job [{}] for tool [{}] by user [{}]", jobId, tool.getSlug(), userId);

        return ConversionResponse.builder()
                .jobId(jobId)
                .status(JobStatus.QUEUED.name())
                .message("Conversion job successfully queued.")
                .build();
    }

    @Async("conversionExecutor")
    public void processJobAsync(String jobId, ConversionRequest request) {
        ConversionJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null || job.getStatus() == JobStatus.CANCELLED) {
            return;
        }

        File tempOutputFile = null;
        try {
            // Update to PROCESSING
            job.setStatus(JobStatus.PROCESSING);
            job.setProgress(20);
            job.setStartedAt(LocalDateTime.now());
            jobRepository.save(job);

            FileRecord sourceFileRecord = fileRepository.findById(job.getSourceFileId())
                    .orElseThrow(() -> new ResourceNotFoundException("Source file record not found"));

            File sourceFile = storageService.loadFile(sourceFileRecord.getStoragePath(), sourceFileRecord.getFileType());

            Converter converter = converterRegistry.getConverter(request.getToolSlug());

            job.setProgress(40);
            jobRepository.save(job);

            // Create temporary working destination
            String targetExt = converter.getTargetFormat();
            tempOutputFile = storageService.createTempFile("sa_out_", "." + targetExt);

            // Perform Conversion
            log.info("Executing converter [{}] on job [{}]", converter.getClass().getSimpleName(), jobId);
            ConversionResult result = converter.convert(sourceFile, tempOutputFile, request.getOptions());

            job.setProgress(80);
            jobRepository.save(job);

            if (!result.isSuccess() || result.getOutputFile() == null || !result.getOutputFile().exists()) {
                throw new ConversionException(result.getErrorMessage() != null ? result.getErrorMessage() : "Conversion failed to generate output.");
            }

            // Output Validation (Phase 46)
            File actualOutput = result.getOutputFile();
            if (actualOutput.length() <= 0) {
                throw new ConversionException("Generated output file is empty.");
            }

            // Move to processed storage
            String outputFileId = UUID.randomUUID().toString();
            String outputExtension = result.getOutputExtension() != null ? result.getOutputExtension() : targetExt;
            String storedPath = storageService.storeProcessed(actualOutput, outputFileId, outputExtension);

            String originalBaseName = getBaseName(sourceFileRecord.getOriginalName());
            String outputOriginalName = originalBaseName + "." + outputExtension;

            LocalDateTime now = LocalDateTime.now();
            FileRecord outputFileRecord = FileRecord.builder()
                    .id(outputFileId)
                    .userId(job.getUserId())
                    .originalName(outputOriginalName)
                    .storedName(outputFileId + "." + outputExtension)
                    .extension(outputExtension)
                    .mimeType(result.getMimeType() != null ? result.getMimeType() : "application/octet-stream")
                    .size(actualOutput.length())
                    .storagePath(storedPath)
                    .fileType("PROCESSED")
                    .createdAt(now)
                    .expiresAt(now.plusHours(expiryHours))
                    .build();

            fileRepository.save(outputFileRecord);

            // Complete Job
            job.setStatus(JobStatus.COMPLETED);
            job.setProgress(100);
            job.setOutputFileId(outputFileId);
            job.setCompletedAt(now);
            jobRepository.save(job);

            // Record Conversion History (Phase 17 & Phase 26)
            if (job.getUserId() != null) {
                Tool tool = toolService.getToolEntityBySlug(request.getToolSlug());
                ConversionHistory history = ConversionHistory.builder()
                        .userId(job.getUserId())
                        .jobId(job.getId())
                        .toolName(tool.getName())
                        .sourceFileName(sourceFileRecord.getOriginalName())
                        .outputFileName(outputOriginalName)
                        .status("COMPLETED")
                        .createdAt(now)
                        .build();
                historyRepository.save(history);
            }

            log.info("Conversion job [{}] COMPLETED successfully -> output [{}]", jobId, outputFileId);

        } catch (Exception e) {
            log.error("Conversion job [{}] FAILED: {}", jobId, e.getMessage(), e);
            job.setStatus(JobStatus.FAILED);
            job.setProgress(0);
            job.setErrorMessage(e.getMessage() != null ? e.getMessage() : "Document conversion processing failed.");
            job.setCompletedAt(LocalDateTime.now());
            jobRepository.save(job);
        } finally {
            if (tempOutputFile != null && tempOutputFile.exists()) {
                tempOutputFile.delete();
            }
        }
    }

    public ConversionStatusResponse getJobStatus(String jobId) {
        ConversionJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversion job not found with ID: " + jobId));

        String outputFileName = null;
        if (job.getOutputFileId() != null) {
            outputFileName = fileRepository.findById(job.getOutputFileId())
                    .map(FileRecord::getOriginalName)
                    .orElse(null);
        }

        return ConversionStatusResponse.builder()
                .jobId(job.getId())
                .status(job.getStatus().name())
                .progress(job.getProgress())
                .errorMessage(job.getErrorMessage())
                .outputFileId(job.getOutputFileId())
                .outputFileName(outputFileName)
                .createdAt(job.getCreatedAt())
                .completedAt(job.getCompletedAt())
                .build();
    }

    @Transactional
    public void cancelJob(String jobId, Long userId) {
        ConversionJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversion job not found with ID: " + jobId));

        if (job.getStatus() == JobStatus.COMPLETED) {
            throw new ConversionException("Cannot cancel an already completed job.");
        }

        job.setStatus(JobStatus.CANCELLED);
        jobRepository.save(job);
        log.info("Cancelled conversion job [{}] by user [{}]", jobId, userId);
    }

    private String getBaseName(String filename) {
        if (filename == null) return "converted";
        int dot = filename.lastIndexOf('.');
        return dot > 0 ? filename.substring(0, dot) : filename;
    }
}
