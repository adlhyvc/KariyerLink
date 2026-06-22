package com.kariyerlink.postservice.dtos.requests;

import java.util.UUID;

public record CommentAddRequest(UUID postId,String description,UUID userId) {
}
