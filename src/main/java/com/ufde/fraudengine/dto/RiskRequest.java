package com.ufde.fraudengine.dto;

public class RiskRequest {

    private String transactionId;
    private Double amount;
    private String currency;

    // Adaptive Friction
    private String currentOs;
    private String currentBrowser;
    private String currentIp;
    private String currentUserAgent;

    private String storedOs;
    private String storedBrowser;
    private String storedIp;
    private String storedUserAgent;

    private Double distanceKm;
    private Double historicMean;

    // Fund Flow
    private Integer inDegree;
    private Integer outDegree;
    private Double remaining;
    private Double totalSent;
    private Integer holdingMinutes;

    // Phishing
    private Double phishingAgeDays;
    private Boolean phishingSelfSigned;
    private Double phishingValidityDays;
    private String phishingLocalListing;
    private String phishingBlacklist;

    private Object adaptiveFriction;
    private Object fundFlow;
    private Object phishing;

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

    public String getCurrentOs() {
        return currentOs;
    }

    public void setCurrentOs(String currentOs) {
        this.currentOs = currentOs;
    }

    public String getCurrentBrowser() {
        return currentBrowser;
    }

    public void setCurrentBrowser(String currentBrowser) {
        this.currentBrowser = currentBrowser;
    }

    public String getCurrentIp() {
        return currentIp;
    }

    public void setCurrentIp(String currentIp) {
        this.currentIp = currentIp;
    }

    public String getCurrentUserAgent() {
        return currentUserAgent;
    }

    public void setCurrentUserAgent(String currentUserAgent) {
        this.currentUserAgent = currentUserAgent;
    }

    public String getStoredOs() {
        return storedOs;
    }

    public void setStoredOs(String storedOs) {
        this.storedOs = storedOs;
    }

    public String getStoredBrowser() {
        return storedBrowser;
    }

    public void setStoredBrowser(String storedBrowser) {
        this.storedBrowser = storedBrowser;
    }

    public String getStoredIp() {
        return storedIp;
    }

    public void setStoredIp(String storedIp) {
        this.storedIp = storedIp;
    }

    public String getStoredUserAgent() {
        return storedUserAgent;
    }

    public void setStoredUserAgent(String storedUserAgent) {
        this.storedUserAgent = storedUserAgent;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Double getHistoricMean() {
        return historicMean;
    }

    public void setHistoricMean(Double historicMean) {
        this.historicMean = historicMean;
    }

    public Integer getInDegree() {
        return inDegree;
    }

    public void setInDegree(Integer inDegree) {
        this.inDegree = inDegree;
    }

    public Integer getOutDegree() {
        return outDegree;
    }

    public void setOutDegree(Integer outDegree) {
        this.outDegree = outDegree;
    }

    public Double getRemaining() {
        return remaining;
    }

    public void setRemaining(Double remaining) {
        this.remaining = remaining;
    }

    public Double getTotalSent() {
        return totalSent;
    }

    public void setTotalSent(Double totalSent) {
        this.totalSent = totalSent;
    }

    public Integer getHoldingMinutes() {
        return holdingMinutes;
    }

    public void setHoldingMinutes(Integer holdingMinutes) {
        this.holdingMinutes = holdingMinutes;
    }

    public Double getPhishingAgeDays() {
        return phishingAgeDays;
    }

    public void setPhishingAgeDays(Double phishingAgeDays) {
        this.phishingAgeDays = phishingAgeDays;
    }

    public Boolean getPhishingSelfSigned() {
        return phishingSelfSigned;
    }

    public void setPhishingSelfSigned(Boolean phishingSelfSigned) {
        this.phishingSelfSigned = phishingSelfSigned;
    }

    public Double getPhishingValidityDays() {
        return phishingValidityDays;
    }

    public void setPhishingValidityDays(Double phishingValidityDays) {
        this.phishingValidityDays = phishingValidityDays;
    }

    public String getPhishingLocalListing() {
        return phishingLocalListing;
    }

    public void setPhishingLocalListing(String phishingLocalListing) {
        this.phishingLocalListing = phishingLocalListing;
    }

    public String getPhishingBlacklist() {
        return phishingBlacklist;
    }

    public void setPhishingBlacklist(String phishingBlacklist) {
        this.phishingBlacklist = phishingBlacklist;
    }

    public Object getAdaptiveFriction() {
        return adaptiveFriction;
    }

    public void setAdaptiveFriction(Object adaptiveFriction) {
        this.adaptiveFriction = adaptiveFriction;
    }

    public Object getFundFlow() {
        return fundFlow;
    }

    public void setFundFlow(Object fundFlow) {
        this.fundFlow = fundFlow;
    }

    public Object getPhishing() {
        return phishing;
    }

    public void setPhishing(Object phishing) {
        this.phishing = phishing;
    }
}