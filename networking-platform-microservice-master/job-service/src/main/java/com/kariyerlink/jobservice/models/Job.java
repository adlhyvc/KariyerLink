package com.kariyerlink.jobservice.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String title;
    private UUID companyId;
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requiredSkills;

    private String sourceUrl;
    private String sourceJobId;
    private String location;

    @CreatedDate
    private LocalDateTime createdDate;

    @LastModifiedDate
    private LocalDateTime lastModifiedDate;

    private LocalDateTime endDate;

    private Boolean quizEnabled = false;
    private String experienceLevel;

    /**
     * The date the job was originally posted on its source (e.g. LinkedIn).
     * May be null for older rows that were imported before this field existed;
     * in that case clients should fall back to {@link #createdDate}.
     */
    private LocalDateTime postedDate;

    @OneToMany(mappedBy = "job")
    private Set<JobApplication> applications;
}
