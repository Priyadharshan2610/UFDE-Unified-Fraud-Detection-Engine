package com.ufde.fraudengine.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.ufde.fraudengine.model.FundFlowScoreResult;
import com.ufde.fraudengine.model.FundFlowTransactionInput;

@Service
public class FundFlowScoringService {

    public FundFlowScoreResult calculateScore(
            FundFlowTransactionInput input) {

        validateInput(input);

        double ff1 = calculateFF1(
                input.getInDegree(),
                input.getOutDegree());

        double ff2 = calculateFF2(
                input.getRemaining(),
                input.getTotalSent());

        double ff3 = calculateFF3(
                input.getHoldingMinutes());

        double score =
                (ff1 * 45)
                + (ff2 * 30)
                + (ff3 * 25);

        score = Math.max(0.0, Math.min(score, 100.0));
        score = Math.round(score * 100.0) / 100.0;

        List<String> signals = new ArrayList<>();
        List<String> explanations = new ArrayList<>();

        if (ff1 > 0) {
            signals.add("FF1");
            explanations.add(
                    "Fund flow shows an imbalance between incoming and outgoing connections.");
        }

        if (ff2 > 0) {
            signals.add("FF2");
            explanations.add(
                    "Remaining balance is low compared with the total amount sent.");
        }

        if (ff3 > 0) {
            signals.add("FF3");
            explanations.add(
                    "Funds were held for less than 60 minutes.");
        }

        FundFlowScoreResult result =
                new FundFlowScoreResult();

        result.setScore(score);
        result.setTriggeredSignals(signals);
        result.setExplanations(explanations);

        return result;
    }

    private double calculateFF1(
            Integer inDegree,
            Integer outDegree) {

        int in = (inDegree != null) ? inDegree : 0;
        int out = (outDegree != null) ? outDegree : 0;

        int smaller = Math.min(in, out);
        int larger = Math.max(in, out);

        if (larger == 0) {
            return 0.0;
        }

        return 1.0 - ((double) smaller / larger);
    }

    private double calculateFF2(
            Double remaining,
            Double totalSent) {

        if (totalSent == null || totalSent <= 0) {
            return 0.0;
        }

        double rem = (remaining != null) ? remaining : 0.0;
        double value = 1.0 - (rem / totalSent);

        return Math.max(0.0, Math.min(value, 1.0));
    }

    private double calculateFF3(
            Integer holdingMinutes) {

        if (holdingMinutes == null || holdingMinutes < 0) {
            return 0.0;
        }

        double value = 1.0 - (holdingMinutes / 60.0);

        return Math.max(0.0, Math.min(value, 1.0));
    }

    private void validateInput(
            FundFlowTransactionInput input) {

        if (input == null) {
            throw new IllegalArgumentException(
                    "Fund flow input cannot be null");
        }
    }
}