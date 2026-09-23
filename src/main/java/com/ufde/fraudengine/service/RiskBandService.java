package com.ufde.fraudengine.service;

import org.springframework.stereotype.Service;

@Service
public class RiskBandService {

    public String getRiskBand(double score) {
        if (score <= 20) {
            return "Very Low";
        } else if (score <= 40) {
            return "Low";
        } else if (score <= 60) {
            return "Medium";
        } else if (score <= 80) {
            return "High";
        } else {
            return "Critical";
        }
    }

    public String getRecommendedAction(double score) {
        if (score <= 20) {
            return "No immediate action – transaction is considered normal. Log event for audit. Continue routine monitoring.";
        } else if (score <= 40) {
            return "Automated monitoring – flag transaction for watch-list status. Route to Viewer role.";
        } else if (score <= 60) {
            return "Analyst-level review – route case to Analyst role. Display full risk breakdown on dashboard.";
        } else if (score <= 80) {
            return "Immediate hold of transaction. Customer outreach & Analyst investigation. Generate draft STR.";
        } else {
            return "Automatic transaction freeze – block movement of funds. Immediate escalation to senior compliance (Admin role). Full STR generation.";
        }
    }
}