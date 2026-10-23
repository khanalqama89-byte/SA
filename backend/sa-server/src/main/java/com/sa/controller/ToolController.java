package com.sa.controller;

import com.sa.dto.response.ApiResponse;
import com.sa.dto.response.ToolResponse;
import com.sa.service.ToolService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tools")
public class ToolController {

    private final ToolService toolService;

    public ToolController(ToolService toolService) {
        this.toolService = toolService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ToolResponse>>> getAllTools() {
        List<ToolResponse> tools = toolService.getEnabledTools();
        return ResponseEntity.ok(ApiResponse.ok(tools));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<ToolResponse>> getToolBySlug(@PathVariable String slug) {
        ToolResponse tool = toolService.getToolBySlug(slug);
        return ResponseEntity.ok(ApiResponse.ok(tool));
    }
}
