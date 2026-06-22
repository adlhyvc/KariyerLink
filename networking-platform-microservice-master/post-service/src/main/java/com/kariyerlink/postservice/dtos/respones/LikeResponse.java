
package com.kariyerlink.postservice.dtos.respones;

import java.util.UUID;

public record LikeResponse(UUID id,UUID postId, UUID userId) {
}

