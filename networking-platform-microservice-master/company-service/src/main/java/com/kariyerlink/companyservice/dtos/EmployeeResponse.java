package com.kariyerlink.companyservice.dtos;

import java.util.UUID;

public record EmployeeResponse(UUID id, UUID userId,String userFirstName,
                               String userLastName, UUID companyId) {
}
