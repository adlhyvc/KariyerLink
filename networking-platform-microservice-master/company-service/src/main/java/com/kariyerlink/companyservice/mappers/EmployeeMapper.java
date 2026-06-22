package com.kariyerlink.companyservice.mappers;

import com.kariyerlink.companyservice.dtos.EmployeeRequest;
import com.kariyerlink.companyservice.dtos.EmployeeResponse;
import com.kariyerlink.companyservice.dtos.UserResponse;
import com.kariyerlink.companyservice.models.Employee;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EmployeeMapper {

    @Mapping(target = "company.id", source = "companyId")
    @Mapping(target = "userId",source = "userId")
    Employee requestToEmployee(EmployeeRequest employeeRequest);

    @Mapping(target = "id",source = "employee.id")
    @Mapping(target = "companyId",source = "employee.company.id")
    @Mapping(target = "userId",source = "userResponse.id")
    @Mapping(target = "userFirstName",source = "userResponse.firstName")
    @Mapping(target = "userLastName",source = "userResponse.lastName")
    EmployeeResponse employeeToResponse(Employee employee, UserResponse userResponse);
}
