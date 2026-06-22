package com.kariyerlink.messageservice.repositories;

import com.kariyerlink.messageservice.models.Message;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByRoomId(String roomId);

    List<Message> findByRoomIdOrderByCreatedAtAsc(String roomId);
}
