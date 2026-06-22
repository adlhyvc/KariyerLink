package com.kariyerlink.postservice.mappers;

import com.kariyerlink.postservice.dtos.requests.CommentAddRequest;
import com.kariyerlink.postservice.dtos.respones.CommentResponse;
import com.kariyerlink.postservice.dtos.respones.UserResponse;
import com.kariyerlink.postservice.models.Comment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

@Mapper(componentModel = "spring")
public interface CommentMapper {
    @Mapping(source = "postId",target = "post.id")
    Comment addRequestToComment(CommentAddRequest commentAddRequest);
    @Mappings({
            @Mapping(source = "user.id",target = "userId"),
            @Mapping(source = "comment.id",target = "id"),
            @Mapping(source = "comment.post.id",target = "postId"),
            @Mapping(source = "user.firstName",target = "userFirstName"),
            @Mapping(source = "user.lastName",target = "userLastName")
    })
    CommentResponse commentToResponse(Comment comment, UserResponse user);
}
