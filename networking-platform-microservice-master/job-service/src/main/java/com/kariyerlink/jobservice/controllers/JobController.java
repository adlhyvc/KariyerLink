package com.kariyerlink.jobservice.controllers;

import com.kariyerlink.jobservice.dtos.JobRequest;
import com.kariyerlink.jobservice.dtos.JobResponse;
import com.kariyerlink.jobservice.dtos.ScrapedJobRequest;
import com.kariyerlink.jobservice.dtos.SkillsUpdateRequest;
import com.kariyerlink.jobservice.services.JobService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/")
public class JobController {

    private final JobService jobService;
    public JobController(JobService jobService){
        this.jobService = jobService;
    }
    @GetMapping
    public ResponseEntity<List<JobResponse>> getAll(){
        return ResponseEntity.ok().body(this.jobService.getAll());
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<JobResponse>> getByCompany(@PathVariable UUID companyId){
        return ResponseEntity.ok().body(this.jobService.getByCompany(companyId));
    }

    @PostMapping
    public ResponseEntity<String> add(@RequestBody JobRequest jobRequest){
        this.jobService.add(jobRequest);
        return ResponseEntity.ok().body("Successfully");
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobResponse> getById(@PathVariable UUID id){
        return ResponseEntity.ok().body(this.jobService.getById(id));
    }

    @PostMapping("/scraped")
    public ResponseEntity<String> addScrapedJob(@RequestBody ScrapedJobRequest request){
        boolean added = this.jobService.addScrapedJob(request);
        if (added) {
            return ResponseEntity.ok().body("Job added");
        }
        return ResponseEntity.status(409).body("Job already exists");
    }

    @PatchMapping("/{id}/skills")
    public ResponseEntity<String> updateSkills(@PathVariable UUID id,
                                                @RequestBody SkillsUpdateRequest request){
        this.jobService.updateSkills(id, request.requiredSkills());
        return ResponseEntity.ok().body("Skills updated");
    }

    @GetMapping("/by-source/{sourceJobId}")
    public ResponseEntity<?> getBySourceJobId(@PathVariable String sourceJobId){
        return this.jobService.findBySourceJobId(sourceJobId)
                .map(job -> ResponseEntity.ok().body("exists"))
                .orElse(ResponseEntity.notFound().build());
    }
}

