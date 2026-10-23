package com.sa.controller;

import com.sa.dto.response.ApiResponse;
import com.sa.dto.response.FileResponse;
import com.sa.entity.FileRecord;
import com.sa.security.UserPrincipal;
import com.sa.service.FileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        FileResponse response = fileService.uploadFile(file, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("File uploaded successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FileResponse>> getFileMetadata(@PathVariable String id) {
        FileRecord record = fileService.getFileRecord(id);
        return ResponseEntity.ok(ApiResponse.ok(fileService.mapToResponse(record)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Long userId = userPrincipal != null ? userPrincipal.getId() : null;
        boolean isAdmin = userPrincipal != null && userPrincipal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        fileService.deleteFile(id, userId, isAdmin);
        return ResponseEntity.ok(ApiResponse.ok("File deleted successfully", null));
    }
}
