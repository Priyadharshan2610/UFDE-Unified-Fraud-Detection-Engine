package com.ufde.fraudengine.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.ufde.fraudengine.dto.RiskResponse;
import com.ufde.fraudengine.model.AuditLog;
import com.ufde.fraudengine.model.Transaction;
import com.ufde.fraudengine.repository.AuditLogRepository;
import com.ufde.fraudengine.repository.TransactionRepository;

@Service
public class UnifiedRiskService {

    private final RiskBandService riskBandService;
    private final TransactionRepository transactionRepository;
    private final AuditLogRepository auditLogRepository;

    public UnifiedRiskService(
            RiskBandService riskBandService,
            TransactionRepository transactionRepository,
            AuditLogRepository auditLogRepository) {
        this.riskBandService = riskBandService;
        this.transactionRepository = transactionRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public RiskResponse calculateRisk(
            String transactionId,
            Double amount,
            String currency,
            Double adaptiveScore,
            Double fundFlowScore,
            Double phishingScore) {
        return calculateRisk(transactionId, amount, currency, adaptiveScore, fundFlowScore, phishingScore, null);
    }

    public RiskResponse calculateRisk(
            String transactionId,
            Double amount,
            String currency,
            Double adaptiveScore,
            Double fundFlowScore,
            Double phishingScore,
            List<String> explanations) {
        return calculateRisk(transactionId, amount, currency, adaptiveScore, fundFlowScore, phishingScore, explanations, false);
    }

    public RiskResponse calculateRisk(
            String transactionId,
            Double amount,
            String currency,
            Double adaptiveScore,
            Double fundFlowScore,
            Double phishingScore,
            List<String> explanations,
            boolean hasMissingData) {

        Double af = adaptiveScore;
        Double ff = fundFlowScore;
        Double ph = phishingScore;

        Double consolidatedScore = null;
        String riskBand;
        String recommendedAction;

        if (hasMissingData) {
            consolidatedScore = null; // Do not assign score!
            riskBand = "Critical"; // Flagged as RED color!
            recommendedAction = "Invalid or Missing Data - Immediate Analyst Review Required";
            if (explanations == null) explanations = new java.util.ArrayList<>();
            boolean alreadyNoted = false;
            for (String exp : explanations) {
                if (exp.contains("Invalid or Missing Data")) {
                    alreadyNoted = true;
                    break;
                }
            }
            if (!alreadyNoted) {
                explanations.add(0, "Invalid or Missing Data: Required payload or attributes missing in transaction file.");
            }
        } else {
            double safeAf = af != null ? af : 0.0;
            double safeFf = ff != null ? ff : 0.0;
            double safePh = ph != null ? ph : 0.0;
            double score = (safeAf * 0.45) + (safeFf * 0.35) + (safePh * 0.20);
            consolidatedScore = Math.round(score * 100.0) / 100.0;
            riskBand = riskBandService.getRiskBand(consolidatedScore);
            recommendedAction = riskBandService.getRecommendedAction(consolidatedScore);
        }

        String reportReference = "STR-2026-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Transaction transaction = new Transaction();
        transaction.setTransactionId(transactionId);
        transaction.setAmount(amount);
        transaction.setCurrency(currency != null ? currency : "INR");
        transaction.setAdaptiveScore(af);
        transaction.setFundFlowScore(ff);
        transaction.setPhishingScore(ph);
        transaction.setConsolidatedScore(consolidatedScore);
        transaction.setRiskBand(riskBand);
        transaction.setRecommendedAction(recommendedAction);
        if (explanations != null && !explanations.isEmpty()) {
            transaction.setExplanations(String.join("; ", explanations));
        }
        transaction.setCreatedAt(LocalDateTime.now());
        transactionRepository.save(transaction);

        AuditLog auditLog = new AuditLog();
        auditLog.setTransactionId(transactionId);
        auditLog.setEvent("RISK_EVALUATION");
        auditLog.setDetails("Consolidated Risk Score evaluated: " + (consolidatedScore != null ? consolidatedScore : "UNASSIGNED (Missing Data)") + " (" + riskBand + ")");
        auditLog.setRiskBand(riskBand);
        auditLog.setRiskScore(consolidatedScore != null ? consolidatedScore : 0.0);
        auditLog.setTimestamp(LocalDateTime.now());
        auditLogRepository.save(auditLog);

        RiskResponse response = new RiskResponse();
        response.setTransactionId(transactionId);
        response.setAdaptiveScore(af);
        response.setFundFlowScore(ff);
        response.setPhishingScore(ph);
        response.setConsolidatedScore(consolidatedScore);
        response.setRiskBand(riskBand);
        response.setRecommendedAction(recommendedAction);
        response.setExplanations(explanations);
        response.setReportReference(reportReference);

        return response;
    }
}