package com.ufde.fraudengine.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/config/policy")
@CrossOrigin(origins = "*")
public class PolicyConfigController {

    private double weightAF = 0.45;
    private double weightFF = 0.35;
    private double weightPH = 0.20;

    private int cutOffVeryLow = 20;
    private int cutOffLow = 40;
    private int cutOffMedium = 60;
    private int cutOffHigh = 80;

    @GetMapping
    public Map<String, Object> getPolicy() {
        Map<String, Object> policy = new HashMap<>();
        policy.put("weightAF", weightAF);
        policy.put("weightFF", weightFF);
        policy.put("weightPH", weightPH);
        policy.put("cutOffVeryLow", cutOffVeryLow);
        policy.put("cutOffLow", cutOffLow);
        policy.put("cutOffMedium", cutOffMedium);
        policy.put("cutOffHigh", cutOffHigh);
        return policy;
    }

    @PostMapping
    public Map<String, Object> updatePolicy(@RequestBody Map<String, Object> newPolicy) {
        if (newPolicy.containsKey("weightAF")) weightAF = ((Number) newPolicy.get("weightAF")).doubleValue();
        if (newPolicy.containsKey("weightFF")) weightFF = ((Number) newPolicy.get("weightFF")).doubleValue();
        if (newPolicy.containsKey("weightPH")) weightPH = ((Number) newPolicy.get("weightPH")).doubleValue();

        return getPolicy();
    }
}
