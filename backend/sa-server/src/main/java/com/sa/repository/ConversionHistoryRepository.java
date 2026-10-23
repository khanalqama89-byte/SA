package com.sa.repository;

import com.sa.entity.ConversionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversionHistoryRepository extends JpaRepository<ConversionHistory, Long> {
    List<ConversionHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
    void deleteByUserIdAndId(Long userId, Long id);
}
