package com.ufde.fraudengine.controller;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.ufde.fraudengine.dto.BatchIngestionResponse;
import com.ufde.fraudengine.model.AFScoreResult;
import com.ufde.fraudengine.model.FundFlowScoreResult;
import com.ufde.fraudengine.model.PhishingScoreResult;
import com.ufde.fraudengine.service.IngestionService;

@RestController
@RequestMapping("/api/ingest")
@CrossOrigin(origins = "*")
public class IngestionController {

    private final IngestionService ingestionService;

    public IngestionController(IngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    @PostMapping(
            value = "/adaptive",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public AFScoreResult ingestAdaptive(
            @RequestParam("file") MultipartFile file)
            throws IOException {
        return ingestionService.processAdaptiveFile(file);
    }

    @PostMapping(
            value = "/phishing",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public PhishingScoreResult ingestPhishing(
            @RequestParam("file") MultipartFile file)
            throws IOException {
        return ingestionService.processPhishingFile(file);
    }

    @PostMapping(
            value = "/fund-flow",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public FundFlowScoreResult ingestFundFlow(
            @RequestParam("file") MultipartFile file)
            throws IOException {
        return ingestionService.processFundFlowFile(file);
    }

    @PostMapping(
            value = "/unified",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public BatchIngestionResponse ingestUnified(
            @RequestParam(value = "adaptiveFile", required = false) MultipartFile adaptiveFile,
            @RequestParam(value = "af", required = false) MultipartFile af,
            @RequestParam(value = "fundFlowFile", required = false) MultipartFile fundFlowFile,
            @RequestParam(value = "ff", required = false) MultipartFile ff,
            @RequestParam(value = "phishingFile", required = false) MultipartFile phishingFile,
            @RequestParam(value = "ph", required = false) MultipartFile ph)
            throws IOException {

        MultipartFile targetAf = adaptiveFile != null ? adaptiveFile : af;
        MultipartFile targetFf = fundFlowFile != null ? fundFlowFile : ff;
        MultipartFile targetPh = phishingFile != null ? phishingFile : ph;

        return ingestionService.processUnifiedFiles(
                targetAf,
                targetFf,
                targetPh
        );
    }
}