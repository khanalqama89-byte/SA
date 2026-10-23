package com.sa.service;

import com.sa.dto.response.ConversionHistoryResponse;
import com.sa.entity.ConversionHistory;
import com.sa.exception.ResourceNotFoundException;
import com.sa.repository.ConversionHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class HistoryService {

    private final ConversionHistoryRepository historyRepository;

    public HistoryService(ConversionHistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
    }

    public List<ConversionHistoryResponse> getUserHistory(Long userId) {
        return historyRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ConversionHistoryResponse getHistoryById(Long userId, Long historyId) {
        ConversionHistory history = historyRepository.findById(historyId)
                .orElseThrow(() -> new ResourceNotFoundException("History record not found"));

        if (!history.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("History record not found");
        }

        return mapToResponse(history);
    }

    @Transactional
    public void deleteHistory(Long userId, Long historyId) {
        ConversionHistory history = historyRepository.findById(historyId)
                .orElseThrow(() -> new ResourceNotFoundException("History record not found"));

        if (!history.getUserId().equals(userId)) {
            throw new ResourceNotFoundException("History record not found");
        }

        historyRepository.delete(history);
    }

    private ConversionHistoryResponse mapToResponse(ConversionHistory history) {
        return ConversionHistoryResponse.builder()
                .id(history.getId())
                .jobId(history.getJobId())
                .toolName(history.getToolName())
                .sourceFileName(history.getSourceFileName())
                .outputFileName(history.getOutputFileName())
                .status(history.getStatus())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
