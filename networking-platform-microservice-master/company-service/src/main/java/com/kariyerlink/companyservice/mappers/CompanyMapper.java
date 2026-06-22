package com.kariyerlink.companyservice.mappers;

import com.kariyerlink.companyservice.dtos.CompanyRequest;
import com.kariyerlink.companyservice.dtos.CompanyResponse;
import com.kariyerlink.companyservice.dtos.UserResponse;
import com.kariyerlink.companyservice.models.Company;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

@Mapper(componentModel = "spring")
public interface CompanyMapper {

    Company requestToComponent(CompanyRequest companyRequest);
    @Mappings({
            @Mapping(source = "user.id", target = "ownerId"),
            @Mapping(source = "company.id",target = "id"),
            @Mapping(source = "user.firstName",target = "ownerFirstName"),
            @Mapping(source = "user.lastName",target = "ownerLastName")
    })
    CompanyResponse companyToResponse(Company company, UserResponse user);
}
