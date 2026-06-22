package com.kariyerlink.postservice.repositories;

import com.kariyerlink.postservice.models.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {
    List<Post> findByUserIdOrderByCreatedDateDesc(UUID userId);

    List<Post> findAllByOrderByCreatedDateDesc();
}
