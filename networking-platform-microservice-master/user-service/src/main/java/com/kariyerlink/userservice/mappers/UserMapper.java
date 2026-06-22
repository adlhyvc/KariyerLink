package com.kariyerlink.userservice.mappers;

import com.kariyerlink.userservice.dtos.UserRequest;
import com.kariyerlink.userservice.dtos.UserResponse;
import com.kariyerlink.userservice.models.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User requestToUser(UserRequest userRequest);
    UserResponse userToResponse(User user);

}
