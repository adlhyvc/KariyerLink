package com.kariyerlink.userservice.dtos;

import java.util.UUID;

public record UserResponse
        (UUID id,
         String firstName,
         String lastName,
         String description,
         String email,
         String cvData
        ) {}
