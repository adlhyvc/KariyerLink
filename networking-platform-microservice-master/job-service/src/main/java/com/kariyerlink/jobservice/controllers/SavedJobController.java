package com.kariyerlink.jobservice.controllers;

import com.kariyerlink.jobservice.dtos.JobResponse;
import com.kariyerlink.jobservice.dtos.SavedJobRequest;
import com.kariyerlink.jobservice.services.SavedJobService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/saved")
public class SavedJobController {

    private final SavedJobService savedJobService;

    public SavedJobController(SavedJobService savedJobService) {
        this.savedJobService = savedJobService;
    }

    @PostMapping
    public ResponseEntity<String> save(@RequestBody SavedJobRequest request) {
        savedJobService.save(request);
        return ResponseEntity.ok().body("Saved");
    }

    @DeleteMapping("/{userId}/{jobId}")
    public ResponseEntity<String> unsave(@PathVariable UUID userId, @PathVariable UUID jobId) {
        savedJobService.unsave(userId, jobId);
        return ResponseEntity.ok().body("Unsaved");
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> check(@RequestParam UUID userId,
                                                       @RequestParam UUID jobId) {
        return ResponseEntity.ok().body(Map.of("saved", savedJobService.isSaved(userId, jobId)));
    }

    @GetMapping("/list/{userId}")
    public ResponseEntity<List<JobResponse>> list(@PathVariable UUID userId) {
        return ResponseEntity.ok().body(savedJobService.listForUser(userId));
    }
}
