package com.kariyerlink.userservice.mappers;

import com.kariyerlink.userservice.dtos.follow.FollowRequest;
import com.kariyerlink.userservice.dtos.follow.FollowResponse;
import com.kariyerlink.userservice.models.Follow;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

@Mapper(componentModel = "spring")
public interface FollowMapper {
    @Mappings({
            @Mapping(source = "userId", target = "user.id"),
            @Mapping(source = "followingId", target = "following.id")
            })
    Follow requestToFollow(FollowRequest followRequest);

    @Mapping(source = "user.id",target = "userId")
    @Mapping(source = "following.id",target = "followingId")
    @Mapping(target = "followingName",expression = "java(follow.getFollowing().getFirstName() + \" \"+follow.getFollowing().getLastName())")
    @Mapping(target = "userName",expression = "java(follow.getUser().getFirstName() + \" \"+follow.getUser().getLastName())")
    FollowResponse followToResponse(Follow follow);

}
