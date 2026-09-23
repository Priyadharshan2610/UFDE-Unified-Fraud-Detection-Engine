package com.ufde.fraudengine.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ufde.fraudengine.model.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

}