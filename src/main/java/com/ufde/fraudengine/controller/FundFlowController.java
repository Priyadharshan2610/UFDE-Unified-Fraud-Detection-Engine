package com.ufde.fraudengine.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.ufde.fraudengine.model.FundFlowScoreResult;
import com.ufde.fraudengine.model.FundFlowTransactionInput;
import com.ufde.fraudengine.service.FundFlowScoringService;

@RestController
public class FundFlowController {

    private final FundFlowScoringService fundFlowScoringService;

    public FundFlowController(
            FundFlowScoringService fundFlowScoringService) {

        this.fundFlowScoringService = fundFlowScoringService;
    }

    @PostMapping("/api/fund-flow/score")
    public FundFlowScoreResult calculateFundFlowScore(
            @RequestBody FundFlowTransactionInput input) {

        return fundFlowScoringService.calculateScore(input);
    }
}