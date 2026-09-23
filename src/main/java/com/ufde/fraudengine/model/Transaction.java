package com.ufde.fraudengine.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String transactionId;

    private Double amount;

    private String currency;

    private Double adaptiveScore;

    private Double fundFlowScore;

    private Double phishingScore;

    private Double consolidatedScore;

    private String riskBand;

    private String recommendedAction;

    @Column(columnDefinition = "TEXT")
    private String explanations;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Double getAdaptiveScore() {
        return adaptiveScore;
    }

    public void setAdaptiveScore(Double adaptiveScore) {
        this.adaptiveScore = adaptiveScore;
    }

    public Double getFundFlowScore() {
        return fundFlowScore;
    }

    public void setFundFlowScore(Double fundFlowScore) {
        this.fundFlowScore = fundFlowScore;
    }

    public Double getPhishingScore() {
        return phishingScore;
    }

    public void setPhishingScore(Double phishingScore) {
        this.phishingScore = phishingScore;
    }

    public Double getConsolidatedScore() {
        return consolidatedScore;
    }

    public void setConsolidatedScore(Double consolidatedScore) {
        this.consolidatedScore = consolidatedScore;
    }

    public String getRiskBand() {
        return riskBand;
    }

    public void setRiskBand(String riskBand) {
        this.riskBand = riskBand;
    }

    public String getRecommendedAction() {
        return recommendedAction;
    }

    public void setRecommendedAction(String recommendedAction) {
        this.recommendedAction = recommendedAction;
    }

    public String getExplanations() {
        return explanations;
    }

    public void setExplanations(String explanations) {
        this.explanations = explanations;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}