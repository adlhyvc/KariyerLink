package com.kariyerlink.jobservice.repositories;

import com.kariyerlink.jobservice.models.SavedJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SavedJobRepository extends JpaRepository<SavedJob, UUID> {
    List<SavedJob> findByUserIdOrderByCreatedDateDesc(UUID userId);

    boolean existsByUserIdAndJob_Id(UUID userId, UUID jobId);

    void deleteByUserIdAndJob_Id(UUID userId, UUID jobId);
}
