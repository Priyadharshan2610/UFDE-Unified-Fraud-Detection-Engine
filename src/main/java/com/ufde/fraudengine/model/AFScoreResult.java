package com.ufde.fraudengine.model;

import java.util.List;

public class AFScoreResult {

    private Double score;
    private List<String> triggeredSignals;
    private List<String> explanations;

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public List<String> getTriggeredSignals() {
        return triggeredSignals;
    }

    public void setTriggeredSignals(List<String> triggeredSignals) {
        this.triggeredSignals = triggeredSignals;
    }

    public List<String> getExplanations() {
        return explanations;
    }

    public void setExplanations(List<String> explanations) {
        this.explanations = explanations;
    }
}