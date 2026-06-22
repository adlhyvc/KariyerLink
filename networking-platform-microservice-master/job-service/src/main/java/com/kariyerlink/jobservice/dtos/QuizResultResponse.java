package com.kariyerlink.jobservice.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

public record QuizResultResponse(
    UUID id,
    UUID userId,
    UUID jobId,
    Integer score,
    Integer totalQuestions,
    String answers,
    LocalDateTime completedAt
) {}
