package com.ufde.fraudengine.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.ufde.fraudengine.model.PhishingRequest;
import com.ufde.fraudengine.model.PhishingScoreResult;
import com.ufde.fraudengine.service.PhishingScoringService;

@RestController
public class PhishingController {

    private final PhishingScoringService phishingScoringService;

    public PhishingController(PhishingScoringService phishingScoringService) {
        this.phishingScoringService = phishingScoringService;
    }

    @PostMapping("/api/phishing/score")
    public PhishingScoreResult calculatePhishingScore(
            @RequestBody PhishingRequest request) {

        return phishingScoringService.calculateScore(request);
    }
}