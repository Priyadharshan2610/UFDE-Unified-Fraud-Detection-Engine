package com.ufde.fraudengine.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ufde.fraudengine.model.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findAllByOrderByCreatedAtDesc();

    Optional<Transaction> findByTransactionId(String transactionId);

    List<Transaction> findByTransactionIdOrderByIdDesc(String transactionId);
}