package com.kariyerlink.messageservice.repositories;

import com.kariyerlink.messageservice.models.Room;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends MongoRepository<Room, String> {
    Optional<Room> findBySenderUserIdAndReceiverUserId(String senderUserId, String ReceiverUserId);

    List<Room> findBySenderUserIdOrReceiverUserId(String senderUserId, String receiverUserId);
}
