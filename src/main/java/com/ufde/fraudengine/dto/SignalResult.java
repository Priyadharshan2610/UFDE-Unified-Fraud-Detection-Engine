package com.ufde.fraudengine.dto;

import java.util.List;

public class SignalResult {

    private String signalGroup;
    private Double score;
    private List<SignalDetail> signals;

    public String getSignalGroup() {
        return signalGroup;
    }

    public void setSignalGroup(String signalGroup) {
        this.signalGroup = signalGroup;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public List<SignalDetail> getSignals() {
        return signals;
    }

    public void setSignals(List<SignalDetail> signals) {
        this.signals = signals;
    }
}