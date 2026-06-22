package com.kariyerlink.jobservice.repositories;

import com.kariyerlink.jobservice.models.QuizResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuizResultRepository extends JpaRepository<QuizResult, UUID> {
    Optional<QuizResult> findByUserIdAndJobId(UUID userId, UUID jobId);
    List<QuizResult> findByJobId(UUID jobId);
    boolean existsByUserIdAndJobId(UUID userId, UUID jobId);
}
