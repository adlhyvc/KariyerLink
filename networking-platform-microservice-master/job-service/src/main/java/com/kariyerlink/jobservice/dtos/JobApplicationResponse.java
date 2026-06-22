package com.kariyerlink.jobservice.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

public record JobApplicationResponse(
        UUID id,
        UUID userId,
        UUID jobId,
        LocalDateTime createdDate,
        String jobName,
        String userFirstName,
        String userLastName

) { }
