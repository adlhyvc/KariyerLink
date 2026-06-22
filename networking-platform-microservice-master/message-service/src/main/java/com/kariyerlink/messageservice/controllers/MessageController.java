package com.kariyerlink.messageservice.controllers;

import com.kariyerlink.messageservice.models.Message;
import com.kariyerlink.messageservice.services.MessageService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/")
public class MessageController {
    private final MessageService messageService;
    public MessageController(MessageService messageService){
        this.messageService = messageService;
    }

    @GetMapping("/{roomId}")
    public List<Message> getMessagesByRoom(@PathVariable String roomId){
        return this.messageService.getMessagesByRoom(roomId);
    }

}
