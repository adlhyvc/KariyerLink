package com.kariyerlink.userservice.controllers;

import com.kariyerlink.userservice.dtos.CvDataRequest;
import com.kariyerlink.userservice.dtos.LoginRequest;
import com.kariyerlink.userservice.dtos.UserRequest;
import com.kariyerlink.userservice.dtos.UserResponse;
import com.kariyerlink.userservice.dtos.UserUpdateRequest;
import com.kariyerlink.userservice.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/")
public class UserController {
    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    public UserController(UserService userService,AuthenticationManager authenticationManager){
        this.userService = userService;
        this.authenticationManager = authenticationManager;
    }
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getById(@PathVariable UUID id){
        return ResponseEntity.ok().body(this.userService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAll(){
        return ResponseEntity.ok().body(this.userService.getAll());
    }

    @GetMapping("/ids")
    public ResponseEntity<List<UserResponse>> getUsersByIds(@RequestParam List<UUID> ids){
        return ResponseEntity.ok().body(this.userService.getByIds(ids));
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody UserRequest userRequest){
        this.userService.add(userRequest);
        return ResponseEntity.ok().body("User Added "+userRequest.toString());
    }

    @PatchMapping("/update/{id}")
    public ResponseEntity<String> update(@RequestBody UserUpdateRequest userUpdateRequest,
                                         @PathVariable UUID id){
        this.userService.update(userUpdateRequest,id);
        return ResponseEntity.ok().body("User updated");
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest){
        Authentication authentication = authenticationManager
                .authenticate(new UsernamePasswordAuthenticationToken(loginRequest.email(),loginRequest.password()));
        if (authentication.isAuthenticated()){
            return ResponseEntity.ok().body(this.userService.generateToken(loginRequest));
        }
        throw new RuntimeException("Invalid access");
    }

    @PatchMapping("/cv/{id}")
    public ResponseEntity<String> updateCvData(@RequestBody CvDataRequest cvDataRequest,
                                                @PathVariable UUID id){
        this.userService.updateCvData(id, cvDataRequest.cvData());
        return ResponseEntity.ok().body("CV data updated");
    }


}
