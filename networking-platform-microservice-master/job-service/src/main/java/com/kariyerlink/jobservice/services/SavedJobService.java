package com.kariyerlink.jobservice.services;

import com.kariyerlink.jobservice.clients.CompanyClient;
import com.kariyerlink.jobservice.dtos.CompanyResponse;
import com.kariyerlink.jobservice.dtos.JobResponse;
import com.kariyerlink.jobservice.dtos.SavedJobRequest;
import com.kariyerlink.jobservice.models.Job;
import com.kariyerlink.jobservice.models.SavedJob;
import com.kariyerlink.jobservice.repositories.JobRepository;
import com.kariyerlink.jobservice.repositories.SavedJobRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SavedJobService {

    private final SavedJobRepository savedJobRepository;
    private final JobRepository jobRepository;
    private final CompanyClient companyClient;

    public SavedJobService(SavedJobRepository savedJobRepository,
                           JobRepository jobRepository,
                           CompanyClient companyClient) {
        this.savedJobRepository = savedJobRepository;
        this.jobRepository = jobRepository;
        this.companyClient = companyClient;
    }

    public void save(SavedJobRequest request) {
        if (savedJobRepository.existsByUserIdAndJob_Id(request.userId(), request.jobId())) {
            return;
        }
        Job job = jobRepository.findById(request.jobId())
                .orElseThrow(() -> new RuntimeException("Job not found"));
        SavedJob saved = new SavedJob();
        saved.setUserId(request.userId());
        saved.setJob(job);
        savedJobRepository.save(saved);
    }

    @Transactional
    public void unsave(UUID userId, UUID jobId) {
        savedJobRepository.deleteByUserIdAndJob_Id(userId, jobId);
    }

    public boolean isSaved(UUID userId, UUID jobId) {
        return savedJobRepository.existsByUserIdAndJob_Id(userId, jobId);
    }

    public List<JobResponse> listForUser(UUID userId) {
        List<SavedJob> saved = savedJobRepository.findByUserIdOrderByCreatedDateDesc(userId);
        return saved.stream()
                .map(sj -> {
                    Job job = sj.getJob();
                    String companyName = "";
                    if (job.getCompanyId() != null) {
                        try {
                            CompanyResponse company = companyClient.getCompany(job.getCompanyId());
                            companyName = company.name();
                        } catch (Exception e) {
                            companyName = "Unknown";
                        }
                    }
                    return new JobResponse(
                            job.getId(), job.getTitle(), job.getDescription(),
                            companyName, job.getCompanyId(),
                            job.getCreatedDate(), job.getEndDate(),
                            job.getRequiredSkills(), job.getSourceUrl(), job.getLocation(),
                            job.getPostedDate(),
                            job.getQuizEnabled(), job.getExperienceLevel()
                    );
                })
                .collect(Collectors.toList());
    }
}
