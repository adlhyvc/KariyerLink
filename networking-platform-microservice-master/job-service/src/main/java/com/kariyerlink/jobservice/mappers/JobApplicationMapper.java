package com.kariyerlink.jobservice.mappers;

import com.kariyerlink.jobservice.dtos.JobApplicationRequest;
import com.kariyerlink.jobservice.dtos.JobApplicationResponse;
import com.kariyerlink.jobservice.dtos.UserResponse;
import com.kariyerlink.jobservice.models.JobApplication;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;

@Mapper(componentModel = "spring")
public interface JobApplicationMapper {

    @Mappings({
            @Mapping(target = "job.id",source = "jobId"),
            @Mapping(target = "userId",source = "userId")
    })
    JobApplication requestToJobApplication(JobApplicationRequest jobApplicationRequest);

    @Mappings({
            @Mapping(target = "id",source = "jobApplication.id"),
            @Mapping(target = "jobId",source = "jobApplication.job.id"),
            @Mapping(target = "jobName", source = "jobApplication.job.title"),
            @Mapping(target = "userFirstName",source = "user.firstName"),
            @Mapping(target = "userLastName",source = "user.lastName")
    })
    JobApplicationResponse jobApplicationToResponse(JobApplication jobApplication, UserResponse user);

}
