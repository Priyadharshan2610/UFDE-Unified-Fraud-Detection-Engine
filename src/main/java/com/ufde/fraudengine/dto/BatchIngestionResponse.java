package com.ufde.fraudengine.dto;

import java.util.ArrayList;
import java.util.List;

public class BatchIngestionResponse {

    private int totalProcessed;
    private int validationFailures;

    private int veryLowCount;
    private int lowCount;
    private int mediumCount;
    private int highCount;
    private int criticalCount;

    private List<RiskResponse> transactions = new ArrayList<>();

    public int getTotalProcessed() {
        return totalProcessed;
    }

    public void setTotalProcessed(int totalProcessed) {
        this.totalProcessed = totalProcessed;
    }

    public int getValidationFailures() {
        return validationFailures;
    }

    public void setValidationFailures(int validationFailures) {
        this.validationFailures = validationFailures;
    }

    public int getVeryLowCount() {
        return veryLowCount;
    }

    public void setVeryLowCount(int veryLowCount) {
        this.veryLowCount = veryLowCount;
    }

    public int getLowCount() {
        return lowCount;
    }

    public void setLowCount(int lowCount) {
        this.lowCount = lowCount;
    }

    public int getMediumCount() {
        return mediumCount;
    }

    public void setMediumCount(int mediumCount) {
        this.mediumCount = mediumCount;
    }

    public int getHighCount() {
        return highCount;
    }

    public void setHighCount(int highCount) {
        this.highCount = highCount;
    }

    public int getCriticalCount() {
        return criticalCount;
    }

    public void setCriticalCount(int criticalCount) {
        this.criticalCount = criticalCount;
    }

    public List<RiskResponse> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<RiskResponse> transactions) {
        this.transactions = transactions;
    }
}
