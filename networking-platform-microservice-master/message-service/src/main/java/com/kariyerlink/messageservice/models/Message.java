package com.kariyerlink.messageservice.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;


@Document(collection = "messages")
@AllArgsConstructor
@NoArgsConstructor
@Data
public class Message {
    @Id
    private String id;
    private String message;
    private String senderId;
    private String roomId;

    @CreatedDate
    private Instant createdAt;
}
