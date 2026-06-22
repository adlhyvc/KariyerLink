package com.kariyerlink.postservice.repositories;

import com.kariyerlink.postservice.models.PostImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PostImageRepository extends JpaRepository<PostImage, UUID> {
    List<PostImage> findAllPostImageByPost_Id(UUID postId);
}
