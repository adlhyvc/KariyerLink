package com.kariyerlink.jobservice.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

public record JobResponse(
        UUID id, String title, String description,
        String companyName,
        UUID companyId,
        LocalDateTime createdDate,
        LocalDateTime endDate,
        String requiredSkills,
        String sourceUrl,
        String location,
        LocalDateTime postedDate,
        Boolean quizEnabled,
        String experienceLevel
) {}
