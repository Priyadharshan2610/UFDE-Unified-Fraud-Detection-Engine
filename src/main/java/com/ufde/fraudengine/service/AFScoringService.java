package com.ufde.fraudengine.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.ufde.fraudengine.model.AFRecord;
import com.ufde.fraudengine.model.AFScoreResult;

@Service
public class AFScoringService {

    public AFScoreResult calculateScore(AFRecord record) {

        double af1 = calculateAF1(record);
        double af2 = calculateAF2(record);
        double af3 = calculateAF3(record);

        double score =
                (af1 * 50)
                + (af2 * 30)
                + (af3 * 20);

        score = Math.max(0, Math.min(score, 100));
        score = Math.round(score * 100.0) / 100.0;

        List<String> signals = new ArrayList<>();
        List<String> explanations = new ArrayList<>();

        if (af1 > 0) {
            signals.add("AF1");
            explanations.add("Device fingerprint differs from the stored profile.");
        }

        if (af2 > 0) {
            signals.add("AF2");
            explanations.add("Transaction originated from a distant location.");
        }

        if (af3 > 0) {
            signals.add("AF3");
            explanations.add("Transaction amount is higher than the historic mean.");
        }

        AFScoreResult result = new AFScoreResult();

        result.setScore(score);
        result.setTriggeredSignals(signals);
        result.setExplanations(explanations);

        return result;
    }

    private double calculateAF1(AFRecord record) {

        boolean different =
                !safeEquals(record.getCurrentOs(), record.getStoredOs())
                || !safeEquals(record.getCurrentBrowser(), record.getStoredBrowser())
                || !safeEquals(record.getCurrentIp(), record.getStoredIp())
                || !safeEquals(record.getCurrentUserAgent(), record.getStoredUserAgent());

        return different ? 1.0 : 0.0;
    }

    private double calculateAF2(AFRecord record) {

        if (record.getDistanceKm() == null) {
            return 0.0;
        }

        return Math.min(record.getDistanceKm() / 1500.0, 1.0);
    }

    private double calculateAF3(AFRecord record) {

        if (record.getAmount() == null
                || record.getHistoricMean() == null
                || record.getHistoricMean() <= 0) {
            return 0.0;
        }

        double value =
                (record.getAmount() - record.getHistoricMean())
                / record.getHistoricMean();

        return Math.max(0.0, Math.min(value, 1.0));
    }

    private boolean safeEquals(String first, String second) {

        if (first == null && second == null) {
            return true;
        }

        if (first == null || second == null) {
            return false;
        }

        return first.equals(second);
    }
}