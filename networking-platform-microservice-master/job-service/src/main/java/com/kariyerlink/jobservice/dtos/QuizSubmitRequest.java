package com.kariyerlink.jobservice.dtos;

public record QuizSubmitRequest(
    String jobId,
    String userId,
    Integer score,
    Integer totalQuestions,
    String answers
) {}
