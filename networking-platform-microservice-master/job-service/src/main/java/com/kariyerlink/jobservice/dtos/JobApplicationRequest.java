package com.kariyerlink.jobservice.dtos;

import java.util.UUID;

public record JobApplicationRequest(
        UUID userId,
        UUID jobId
) {}
