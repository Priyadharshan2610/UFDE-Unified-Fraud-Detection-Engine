package com.ufde.fraudengine.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import com.ufde.fraudengine.model.User;
import com.ufde.fraudengine.repository.UserRepository;

@Service
public class AuthService implements CommandLineRunner {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        // Seed initial users into database if empty
        if (userRepository.count() == 0) {
            createUserIfNotExist("admin", "admin123", "ADMIN", "Administrator");
            createUserIfNotExist("user", "user123", "ANALYST", "Senior Fraud Analyst");
            createUserIfNotExist("viewer", "viewer123", "VIEWER", "Read-Only Viewer");
        }
    }

    public User createUserIfNotExist(String username, String rawPassword, String role, String fullName) {
        return userRepository.findByUsername(username).orElseGet(() -> {
            User user = new User();
            user.setUsername(username);
            user.setPassword(hashPassword(rawPassword));
            user.setRole(role);
            user.setFullName(fullName);
            user.setCreatedAt(LocalDateTime.now());
            return userRepository.save(user);
        });
    }

    public Map<String, Object> authenticate(String username, String rawPassword) {
        Map<String, Object> response = new HashMap<>();

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            response.put("success", false);
            response.put("message", "Invalid username or password.");
            return response;
        }

        String hashedPassword = hashPassword(rawPassword);
        if (!hashedPassword.equals(user.getPassword())) {
            response.put("success", false);
            response.put("message", "Invalid username or password.");
            return response;
        }

        response.put("success", true);
        response.put("username", user.getUsername());
        response.put("role", user.getRole().toLowerCase());
        response.put("fullName", user.getFullName());
        return response;
    }

    public String hashPassword(String rawPassword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(("UFDE_SALT_" + rawPassword).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
