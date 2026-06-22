package com.kariyerlink.postservice.mappers;

import com.kariyerlink.postservice.dtos.requests.LikeRequest;
import com.kariyerlink.postservice.dtos.respones.LikeResponse;
import com.kariyerlink.postservice.models.Like;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LikeMapper {
    @Mapping(source = "post.id",target = "postId")
    LikeResponse likeToResponse(Like like);
    @Mapping(source = "postId",target = "post.id")
    Like requestToLike(LikeRequest likeRequest);
}
