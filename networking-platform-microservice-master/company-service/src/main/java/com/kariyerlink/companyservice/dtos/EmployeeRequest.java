package com.kariyerlink.companyservice.dtos;

import java.util.UUID;

public record EmployeeRequest(UUID userId,UUID companyId) {
}
