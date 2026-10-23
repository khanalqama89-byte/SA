package com.sa.controller;

import com.sa.dto.response.ApiResponse;
import com.sa.dto.response.ToolResponse;
import com.sa.dto.response.UserResponse;
import com.sa.entity.ConversionJob;
import com.sa.entity.JobStatus;
import com.sa.entity.User;
import com.sa.repository.ConversionJobRepository;
import com.sa.repository.FileRepository;
import com.sa.repository.UserRepository;
import com.sa.service.ToolService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final ConversionJobRepository jobRepository;
    private final FileRepository fileRepository;
    private final ToolService toolService;

    public AdminController(UserRepository userRepository,
                           ConversionJobRepository jobRepository,
                           FileRepository fileRepository,
                           ToolService toolService) {
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.fileRepository = fileRepository;
        this.toolService = toolService;
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(u -> UserResponse.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .role(u.getRole().name())
                        .enabled(u.isEnabled())
                        .createdAt(u.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/jobs")
    public ResponseEntity<ApiResponse<List<ConversionJob>>> getAllJobs(
            @RequestParam(required = false) JobStatus status) {

        List<ConversionJob> jobs = (status != null)
                ? jobRepository.findByStatus(status)
                : jobRepository.findAll();

        return ResponseEntity.ok(ApiResponse.ok(jobs));
    }

    @GetMapping("/tools")
    public ResponseEntity<ApiResponse<List<ToolResponse>>> getAllTools() {
        return ResponseEntity.ok(ApiResponse.ok(toolService.getAllTools()));
    }

    @PatchMapping("/tools/{id}/toggle")
    public ResponseEntity<ApiResponse<ToolResponse>> toggleTool(
            @PathVariable Long id,
            @RequestParam boolean enabled) {

        ToolResponse updated = toolService.toggleTool(id, enabled);
        return ResponseEntity.ok(ApiResponse.ok("Tool status updated", updated));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPlatformStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalFiles", fileRepository.count());
        stats.put("totalJobs", jobRepository.count());
        stats.put("queuedJobs", jobRepository.findByStatus(JobStatus.QUEUED).size());
        stats.put("processingJobs", jobRepository.findByStatus(JobStatus.PROCESSING).size());
        stats.put("completedJobs", jobRepository.findByStatus(JobStatus.COMPLETED).size());
        stats.put("failedJobs", jobRepository.findByStatus(JobStatus.FAILED).size());

        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
