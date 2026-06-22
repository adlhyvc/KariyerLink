package com.kariyerlink.jobservice.repositories;

import com.kariyerlink.jobservice.models.Job;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID> {
    List<Job> findByCompanyId(UUID companyId);
    Optional<Job> findBySourceJobId(String sourceJobId);
}
