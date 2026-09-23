package com.ufde.fraudengine.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.ufde.fraudengine.dto.RiskRequest;
import com.ufde.fraudengine.dto.RiskResponse;
import com.ufde.fraudengine.model.AFRecord;
import com.ufde.fraudengine.model.AFScoreResult;
import com.ufde.fraudengine.model.FundFlowScoreResult;
import com.ufde.fraudengine.model.FundFlowTransactionInput;
import com.ufde.fraudengine.model.PhishingRequest;
import com.ufde.fraudengine.model.PhishingScoreResult;
import com.ufde.fraudengine.service.AFScoringService;
import com.ufde.fraudengine.service.FundFlowScoringService;
import com.ufde.fraudengine.service.PhishingScoringService;
import com.ufde.fraudengine.service.UnifiedRiskService;

@RestController
public class RiskScoreController {

    private final UnifiedRiskService unifiedRiskService;
    private final AFScoringService afScoringService;
    private final FundFlowScoringService fundFlowScoringService;
    private final PhishingScoringService phishingScoringService;

    public RiskScoreController(
            UnifiedRiskService unifiedRiskService,
            AFScoringService afScoringService,
            FundFlowScoringService fundFlowScoringService,
            PhishingScoringService phishingScoringService) {

        this.unifiedRiskService = unifiedRiskService;
        this.afScoringService = afScoringService;
        this.fundFlowScoringService = fundFlowScoringService;
        this.phishingScoringService = phishingScoringService;
    }

    @PostMapping("/risk-score")
    public RiskResponse calculateRisk(@RequestBody RiskRequest request) {

        AFRecord afRecord = new AFRecord();

        afRecord.setTransactionId(request.getTransactionId());
        afRecord.setCurrentOs(request.getCurrentOs());
        afRecord.setCurrentBrowser(request.getCurrentBrowser());
        afRecord.setCurrentIp(request.getCurrentIp());
        afRecord.setCurrentUserAgent(request.getCurrentUserAgent());

        afRecord.setStoredOs(request.getStoredOs());
        afRecord.setStoredBrowser(request.getStoredBrowser());
        afRecord.setStoredIp(request.getStoredIp());
        afRecord.setStoredUserAgent(request.getStoredUserAgent());

        afRecord.setDistanceKm(request.getDistanceKm());
        afRecord.setAmount(request.getAmount());
        afRecord.setHistoricMean(request.getHistoricMean());

        AFScoreResult afResult =
                afScoringService.calculateScore(afRecord);


        FundFlowTransactionInput ffInput =
                new FundFlowTransactionInput();

        ffInput.setTransactionId(request.getTransactionId());
        ffInput.setInDegree(request.getInDegree());
        ffInput.setOutDegree(request.getOutDegree());
        ffInput.setRemaining(request.getRemaining());
        ffInput.setTotalSent(request.getTotalSent());
        ffInput.setHoldingMinutes(request.getHoldingMinutes());

        FundFlowScoreResult ffResult =
                fundFlowScoringService.calculateScore(ffInput);


        PhishingRequest phishingRequest =
                new PhishingRequest();

        phishingRequest.setAgeDays(request.getPhishingAgeDays());
        phishingRequest.setSelfSigned(request.getPhishingSelfSigned());
        phishingRequest.setValidityDays(request.getPhishingValidityDays());
        phishingRequest.setLocalListing(request.getPhishingLocalListing());
        phishingRequest.setBlacklist(
        	    Boolean.parseBoolean(request.getPhishingBlacklist())
        	);

        PhishingScoreResult phishingResult =
                phishingScoringService.calculateScore(phishingRequest);


        RiskResponse response =
                unifiedRiskService.calculateRisk(
                        request.getTransactionId(),
                        request.getAmount(),
                        request.getCurrency(),
                        afResult.getScore(),
                        ffResult.getScore(),
                        phishingResult.getScore()
                );


        List<String> explanations = new ArrayList<>();

        if (afResult.getExplanations() != null) {
            explanations.addAll(afResult.getExplanations());
        }

        if (ffResult.getExplanations() != null) {
            explanations.addAll(ffResult.getExplanations());
        }

        if (phishingResult.getExplanations() != null) {
            explanations.addAll(phishingResult.getExplanations());
        }

        response.setExplanations(explanations);

        return response;
    }
}