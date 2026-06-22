package com.kariyerlink.postservice.dtos.requests;

import java.util.UUID;

public record LikeRequest(UUID postId,UUID userId) {
}
