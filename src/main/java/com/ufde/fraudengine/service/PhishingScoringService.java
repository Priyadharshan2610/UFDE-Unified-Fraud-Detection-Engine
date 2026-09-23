package com.ufde.fraudengine.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.ufde.fraudengine.model.PhishingRequest;
import com.ufde.fraudengine.model.PhishingScoreResult;

@Service
public class PhishingScoringService {

    public PhishingScoreResult calculateScore(PhishingRequest request) {

        if (request == null) {
            throw new IllegalArgumentException("Phishing request cannot be null");
        }

        double ph1 = calculatePH1(request);
        double ph2 = calculatePH2(request);
        double ph3 = calculatePH3(request);

        double score =
                (ph1 * 40)
                + (ph2 * 30)
                + (ph3 * 30);

        score = Math.max(0.0, Math.min(score, 100.0));
        score = Math.round(score * 100.0) / 100.0;

        List<String> signals = new ArrayList<>();
        List<String> explanations = new ArrayList<>();

        if (ph1 > 0) {
            signals.add("PH1");
            explanations.add("Domain is relatively new.");
        }

        if (ph2 > 0) {
            signals.add("PH2");
            explanations.add(
                "Certificate is self-signed or has less than 30 days of validity."
            );
        }

        if (ph3 > 0) {
            signals.add("PH3");
            explanations.add("Domain appears on the local blacklist.");
        }

        PhishingScoreResult result = new PhishingScoreResult();

        result.setScore(score);
        result.setTriggeredSignals(signals);
        result.setExplanations(explanations);

        return result;
    }

    private double calculatePH1(PhishingRequest request) {

        if (request.getAgeDays() == null || request.getAgeDays() < 0) {
            return 0.0;
        }

        return 1.0 - Math.min(request.getAgeDays() / 180.0, 1.0);
    }

    private double calculatePH2(PhishingRequest request) {

        boolean selfSigned =
                Boolean.TRUE.equals(request.getSelfSigned());

        boolean shortValidity =
                request.getValidityDays() != null
                && request.getValidityDays() >= 0
                && request.getValidityDays() < 30;

        return (selfSigned || shortValidity) ? 1.0 : 0.0;
    }

    private double calculatePH3(PhishingRequest request) {
        boolean isBlacklisted = Boolean.TRUE.equals(request.getBlacklist())
                || (request.getLocalListing() != null && request.getLocalListing().equalsIgnoreCase("blacklist"));
        return isBlacklisted ? 1.0 : 0.0;
    }
}