package com.kariyerlink.jobservice.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

public record ScrapedJobRequest(
    String title,
    String description,
    String requiredSkills,
    String sourceUrl,
    String sourceJobId,
    String location,
    String companyName,
    UUID companyId,
    LocalDateTime postedDate
) {}
