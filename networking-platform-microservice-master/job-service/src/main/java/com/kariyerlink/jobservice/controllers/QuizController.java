package com.kariyerlink.jobservice.controllers;

import com.kariyerlink.jobservice.dtos.QuizResultResponse;
import com.kariyerlink.jobservice.dtos.QuizSubmitRequest;
import com.kariyerlink.jobservice.models.QuizResult;
import com.kariyerlink.jobservice.repositories.QuizResultRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/quiz")
public class QuizController {

    private final QuizResultRepository quizResultRepository;

    public QuizController(QuizResultRepository quizResultRepository) {
        this.quizResultRepository = quizResultRepository;
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitQuiz(@RequestBody QuizSubmitRequest request) {
        UUID userId = UUID.fromString(request.userId());
        UUID jobId = UUID.fromString(request.jobId());

        // Check if user already took quiz for this job
        if (quizResultRepository.existsByUserIdAndJobId(userId, jobId)) {
            return ResponseEntity.status(409).body("Quiz already taken for this job");
        }

        QuizResult result = new QuizResult();
        result.setUserId(userId);
        result.setJobId(jobId);
        result.setScore(request.score());
        result.setTotalQuestions(request.totalQuestions());
        result.setAnswers(request.answers());

        quizResultRepository.save(result);

        return ResponseEntity.ok().body(toResponse(result));
    }

    @GetMapping("/result/{jobId}/{userId}")
    public ResponseEntity<?> getResult(
            @PathVariable UUID jobId,
            @PathVariable UUID userId) {
        return quizResultRepository.findByUserIdAndJobId(userId, jobId)
                .map(r -> ResponseEntity.ok().body(toResponse(r)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/results/{jobId}")
    public ResponseEntity<List<QuizResultResponse>> getResultsByJob(@PathVariable UUID jobId) {
        List<QuizResultResponse> results = quizResultRepository.findByJobId(jobId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(results);
    }

    @GetMapping("/check/{jobId}/{userId}")
    public ResponseEntity<Boolean> checkIfTaken(
            @PathVariable UUID jobId,
            @PathVariable UUID userId) {
        return ResponseEntity.ok(quizResultRepository.existsByUserIdAndJobId(userId, jobId));
    }

    private QuizResultResponse toResponse(QuizResult r) {
        return new QuizResultResponse(
                r.getId(), r.getUserId(), r.getJobId(),
                r.getScore(), r.getTotalQuestions(),
                r.getAnswers(), r.getCompletedAt()
        );
    }
}
