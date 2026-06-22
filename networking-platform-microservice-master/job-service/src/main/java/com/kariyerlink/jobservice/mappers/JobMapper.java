package com.kariyerlink.jobservice.mappers;

import com.kariyerlink.jobservice.dtos.CompanyResponse;
import com.kariyerlink.jobservice.dtos.JobRequest;
import com.kariyerlink.jobservice.dtos.JobResponse;
import com.kariyerlink.jobservice.models.Job;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

@Mapper(componentModel = "spring")
public interface JobMapper {
    Job requestToJob(JobRequest jobRequest);
    @Mappings({
            @Mapping(target = "id",source = "   job.id"),
            @Mapping(target = "companyName",source = "companyResponse.name"),
            @Mapping(target = "companyId",source = "companyResponse.id")
    })
    JobResponse jobToResponse(Job job, CompanyResponse companyResponse);
}
