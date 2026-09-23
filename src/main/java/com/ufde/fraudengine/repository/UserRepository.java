package com.ufde.fraudengine.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ufde.fraudengine.model.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}
