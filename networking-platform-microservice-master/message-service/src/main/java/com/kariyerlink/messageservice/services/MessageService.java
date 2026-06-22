package com.kariyerlink.messageservice.services;

import com.kariyerlink.messageservice.models.Message;
import com.kariyerlink.messageservice.repositories.MessageRepository;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class MessageService {
    private final MessageRepository messageRepository;
    public MessageService(MessageRepository messageRepository){
        this.messageRepository = messageRepository;
    }

    public void saveMessage(Message message) {
        this.messageRepository.save(message);
    }

    public List<Message> getMessagesByRoom(String roomId){
        List<Message> messages = this.messageRepository.findByRoomId(roomId);
        Collections.reverse(messages);
        return messages;
    }

    public List<Message> getOrderedMessagesByRoom(String roomId){
        return this.messageRepository.findByRoomIdOrderByCreatedAtAsc(roomId);
    }
}
