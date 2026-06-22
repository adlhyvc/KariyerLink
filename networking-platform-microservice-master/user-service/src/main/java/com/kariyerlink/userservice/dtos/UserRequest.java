package com.kariyerlink.userservice.dtos;

public record UserRequest(
        String firstName,
        String lastName,
        String description,
        String password,
        String email
) {}
