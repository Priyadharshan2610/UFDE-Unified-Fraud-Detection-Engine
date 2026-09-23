package com.ufde.fraudengine.dto;

import java.util.List;

public class RiskResponse {

    private String transactionId;

    private Double adaptiveScore;
    private Double fundFlowScore;
    private Double phishingScore;

    private Double consolidatedScore;

    private String riskBand;
    private String recommendedAction;

    private List<String> explanations;

    private String reportReference;

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
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

    public List<String> getExplanations() {
        return explanations;
    }

    public void setExplanations(List<String> explanations) {
        this.explanations = explanations;
    }

    public String getReportReference() {
        return reportReference;
    }

    public void setReportReference(String reportReference) {
        this.reportReference = reportReference;
    }
}