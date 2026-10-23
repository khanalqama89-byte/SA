package com.sa.controller;

import com.sa.dto.request.ConversionRequest;
import com.sa.dto.response.ApiResponse;
import com.sa.dto.response.ConversionResponse;
import com.sa.dto.response.ConversionStatusResponse;
import com.sa.entity.ConversionJob;
import com.sa.entity.FileRecord;
import com.sa.exception.ResourceNotFoundException;
import com.sa.exception.UnauthorizedException;
import com.sa.repository.ConversionJobRepository;
import com.sa.security.UserPrincipal;
import com.sa.service.ConversionService;
import com.sa.service.FileService;
import com.sa.storage.FileStorageService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/conversions")
public class ConversionController {

    private final ConversionService conversionService;
    private final ConversionJobRepository jobRepository;
    private final FileService fileService;
    private final FileStorageService storageService;

    public ConversionController(ConversionService conversionService,
                                ConversionJobRepository jobRepository,
                                FileService fileService,
                                FileStorageService storageService) {
        this.conversionService = conversionService;
        this.jobRepository = jobRepository;
        this.fileService = fileService;
        this.storageService = storageService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ConversionResponse>> startConversion(
            @Valid @RequestBody ConversionRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        ConversionResponse response = conversionService.createJob(request, userId);

        // Dispatch background async processing
        conversionService.processJobAsync(response.getJobId(), request);

        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConversionStatusResponse>> getJobDetails(@PathVariable String id) {
        ConversionStatusResponse status = conversionService.getJobStatus(id);
        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ConversionStatusResponse>> getJobStatus(@PathVariable String id) {
        ConversionStatusResponse status = conversionService.getJobStatus(id);
        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    @GetMapping({ "/{id}/download", "/{id}/download/{filename}" })
    public ResponseEntity<Resource> downloadResult(
            @PathVariable String id,
            @PathVariable(required = false) String filename,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        ConversionJob job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversion job not found with ID: " + id));

        if (job.getOutputFileId() == null) {
            throw new ResourceNotFoundException("No output file generated for this job yet.");
        }

        FileRecord outputFile = fileService.getFileRecord(job.getOutputFileId());
        Resource resource = storageService.loadAsResource(outputFile.getStoragePath(), outputFile.getFileType());

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        try {
            if (outputFile.getMimeType() != null) {
                mediaType = MediaType.parseMediaType(outputFile.getMimeType());
            }
        } catch (Exception ignored) {}

        String effectiveFilename = (filename != null && !filename.trim().isEmpty())
                ? filename.trim()
                : outputFile.getOriginalName();

        // Clean ASCII filename without Q-encoding for Chrome/Edge instant safe download
        String cleanAscii = effectiveFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        ContentDisposition contentDisposition = ContentDisposition.attachment()
                .filename(cleanAscii)
                .build();

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .body(resource);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelJob(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        conversionService.cancelJob(id, userId);
        return ResponseEntity.ok(ApiResponse.ok("Conversion job cancelled.", null));
    }
}
