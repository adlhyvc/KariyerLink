package com.kariyerlink.jobservice.services;

import com.kariyerlink.jobservice.clients.CompanyClient;
import com.kariyerlink.jobservice.dtos.CompanyResponse;
import com.kariyerlink.jobservice.dtos.JobRequest;
import com.kariyerlink.jobservice.dtos.JobResponse;
import com.kariyerlink.jobservice.dtos.ScrapedJobRequest;
import com.kariyerlink.jobservice.mappers.JobMapper;
import com.kariyerlink.jobservice.models.Job;
import com.kariyerlink.jobservice.repositories.JobRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class JobService {
    private final JobRepository jobRepository;
    private final JobMapper jobMapper;
    private final CompanyClient companyClient;
    public JobService(JobRepository jobRepository, JobMapper jobMapper,
                      CompanyClient companyClient){
        this.jobRepository = jobRepository;
        this.jobMapper = jobMapper;
        this.companyClient = companyClient;
    }
    public void add(JobRequest jobRequest){
        Job job = this.jobMapper.requestToJob(jobRequest);
        this.jobRepository.save(job);
    }

    public List<JobResponse> getAll(){
            List<Job> jobs = this.jobRepository.findAll();
            return jobs.stream()
                    .map(job -> {
                        String companyName = "";
                        if (job.getCompanyId() != null) {
                            try {
                                CompanyResponse companyResponse = this.companyClient.getCompany(job.getCompanyId());
                                companyName = companyResponse.name();
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
                    }).collect(Collectors.toList());
    }

    public List<JobResponse> getByCompany(UUID companyId){
        List<Job> jobs = this.jobRepository.findByCompanyId(companyId);
        CompanyResponse companyResponse = this.companyClient.getCompany(companyId);
        return jobs.stream()
                .map(job -> new JobResponse(
                    job.getId(), job.getTitle(), job.getDescription(),
                    companyResponse.name(), companyResponse.id(),
                    job.getCreatedDate(), job.getEndDate(),
                    job.getRequiredSkills(), job.getSourceUrl(), job.getLocation(),
                    job.getPostedDate(),
                    job.getQuizEnabled(), job.getExperienceLevel()
                ))
                .collect(Collectors.toList());
    }

    public JobResponse getById(UUID id){
        Job job = this.jobRepository.findById(id).get();
        String companyName = "";
        if (job.getCompanyId() != null) {
            try {
                CompanyResponse company = this.companyClient.getCompany(job.getCompanyId());
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
    }

    public boolean addScrapedJob(ScrapedJobRequest request) {
        // Dedup: skip if this LinkedIn job ID already exists
        if (request.sourceJobId() != null) {
            Optional<Job> existing = jobRepository.findBySourceJobId(request.sourceJobId());
            if (existing.isPresent()) {
                return false; // already exists
            }
        }

        Job job = new Job();
        job.setTitle(request.title());
        job.setDescription(request.description());
        job.setRequiredSkills(request.requiredSkills());
        job.setSourceUrl(request.sourceUrl());
        job.setSourceJobId(request.sourceJobId());
        job.setLocation(request.location());
        job.setCompanyId(request.companyId());
        job.setPostedDate(request.postedDate());
        // Auto-enable quiz for all scraped jobs
        job.setQuizEnabled(true);
        jobRepository.save(job);
        return true;
    }

    public void updateSkills(UUID id, String requiredSkills) {
        jobRepository.findById(id)
                .ifPresent(job -> {
                    job.setRequiredSkills(requiredSkills);
                    jobRepository.save(job);
                });
    }

    public Optional<Job> findBySourceJobId(String sourceJobId) {
        return jobRepository.findBySourceJobId(sourceJobId);
    }
}

