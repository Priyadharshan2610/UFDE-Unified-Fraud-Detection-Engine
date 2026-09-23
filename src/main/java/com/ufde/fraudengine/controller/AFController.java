package com.ufde.fraudengine.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.ufde.fraudengine.model.AFRecord;
import com.ufde.fraudengine.model.AFScoreResult;
import com.ufde.fraudengine.service.AFScoringService;

@RestController
public class AFController {

    private final AFScoringService afScoringService;

    public AFController(AFScoringService afScoringService) {
        this.afScoringService = afScoringService;
    }

    @PostMapping("/api/af/score")
    public AFScoreResult calculateAFScore(@RequestBody AFRecord record) {

        return afScoringService.calculateScore(record);
    }
}