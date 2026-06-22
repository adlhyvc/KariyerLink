package com.kariyerlink.postservice.dtos.requests;

import java.util.UUID;

public record PostRequest(String description, UUID userId) {
}
