package com.kariyerlink.postservice.mappers;

import com.kariyerlink.postservice.dtos.requests.PostRequest;
import com.kariyerlink.postservice.dtos.respones.PostResponse;
import com.kariyerlink.postservice.dtos.respones.UserResponse;
import com.kariyerlink.postservice.models.Post;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

@Mapper(componentModel = "spring")
public interface PostMapper {

    @Mappings({
            @Mapping(source = "user.id", target = "userId"),
            @Mapping(source = "post.id", target = "id"),
            @Mapping(source = "user.firstName",target = "userFirstName"),
            @Mapping(source = "user.lastName",target = "userLastName")

    })
    PostResponse postToResponse(Post post, UserResponse user);

    Post requestToPost(PostRequest postRequest);
}
