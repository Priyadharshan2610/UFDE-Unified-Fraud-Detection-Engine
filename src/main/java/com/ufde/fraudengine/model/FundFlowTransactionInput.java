package com.ufde.fraudengine.model;

public class FundFlowTransactionInput {

    private String transactionId;
    private String recordId;
    private String currency;

    private Integer inDegree;
    private Integer outDegree;

    private Double remaining;
    private Double totalSent;

    private Integer holdingMinutes;

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getRecordId() {
        return recordId;
    }

    public void setRecordId(String recordId) {
        this.recordId = recordId;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
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
}