package com.sa.controller;

import com.sa.dto.response.ApiResponse;
import com.sa.dto.response.ConversionHistoryResponse;
import com.sa.security.UserPrincipal;
import com.sa.service.HistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    private final HistoryService historyService;

    public HistoryController(HistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConversionHistoryResponse>>> getUserHistory(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        List<ConversionHistoryResponse> history = historyService.getUserHistory(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConversionHistoryResponse>> getHistoryById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        ConversionHistoryResponse item = historyService.getHistoryById(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok(item));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHistoryItem(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        historyService.deleteHistory(userPrincipal.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("History record deleted successfully", null));
    }
}
