package com.kariyerlink.jobservice.dtos;

import java.util.UUID;

public record SavedJobRequest(
        UUID userId,
        UUID jobId
) {}
