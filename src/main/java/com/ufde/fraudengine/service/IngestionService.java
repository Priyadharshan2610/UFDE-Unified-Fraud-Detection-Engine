package com.ufde.fraudengine.service;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ufde.fraudengine.dto.BatchIngestionResponse;
import com.ufde.fraudengine.dto.RiskResponse;
import com.ufde.fraudengine.model.AFRecord;
import com.ufde.fraudengine.model.AFScoreResult;
import com.ufde.fraudengine.model.FundFlowScoreResult;
import com.ufde.fraudengine.model.FundFlowTransactionInput;
import com.ufde.fraudengine.model.PhishingRequest;
import com.ufde.fraudengine.model.PhishingScoreResult;

@Service
public class IngestionService {

    private final AFScoringService afScoringService;
    private final PhishingScoringService phishingScoringService;
    private final FundFlowScoringService fundFlowScoringService;
    private final UnifiedRiskService unifiedRiskService;
    private final ObjectMapper objectMapper;

    public IngestionService(
            AFScoringService afScoringService,
            PhishingScoringService phishingScoringService,
            FundFlowScoringService fundFlowScoringService,
            UnifiedRiskService unifiedRiskService,
            ObjectMapper objectMapper) {

        this.afScoringService = afScoringService;
        this.phishingScoringService = phishingScoringService;
        this.fundFlowScoringService = fundFlowScoringService;
        this.unifiedRiskService = unifiedRiskService;
        this.objectMapper = objectMapper;
    }

    public AFScoreResult processAdaptiveFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Adaptive Friction file cannot be empty");
        }
        List<AFRecord> list = parseAdaptiveRecords(file.getBytes());
        if (list.isEmpty()) {
            throw new IllegalArgumentException("No Adaptive Friction records found in file");
        }
        return afScoringService.calculateScore(list.get(0));
    }

    public PhishingScoreResult processPhishingFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Phishing file cannot be empty");
        }
        List<PhishingRequest> list = parsePhishingRequests(file.getBytes());
        if (list.isEmpty()) {
            throw new IllegalArgumentException("No Phishing records found in file");
        }
        return phishingScoringService.calculateScore(list.get(0));
    }

    public FundFlowScoreResult processFundFlowFile(MultipartFile file) throws IOException {
        List<FundFlowTransactionInput> inputs = parseFundFlowInputs(file);
        if (inputs.isEmpty()) {
            throw new IllegalArgumentException("Fund Flow CSV contains no valid data");
        }
        return fundFlowScoringService.calculateScore(inputs.get(0));
    }

    public BatchIngestionResponse processUnifiedFiles(
            MultipartFile adaptiveFile,
            MultipartFile fundFlowFile,
            MultipartFile phishingFile) throws IOException {

        if ((adaptiveFile == null || adaptiveFile.isEmpty()) &&
            (fundFlowFile == null || fundFlowFile.isEmpty()) &&
            (phishingFile == null || phishingFile.isEmpty())) {
            throw new IllegalArgumentException("At least one data file (Adaptive Friction, Fund Flow, or Phishing) must be uploaded.");
        }

        // 1. Parse AF records if present
        List<AFRecord> afList = (adaptiveFile != null && !adaptiveFile.isEmpty()) ? parseAdaptiveRecords(adaptiveFile.getBytes()) : new ArrayList<>();
        Map<String, AFRecord> afMap = new HashMap<>();
        int afCounter = 1;
        for (AFRecord r : afList) {
            String txId = r.getTransactionId();
            if (txId == null || txId.trim().isEmpty()) {
                txId = r.getRecordId() != null ? r.getRecordId() : "TXN-AF-" + afCounter++;
                r.setTransactionId(txId);
            }
            afMap.put(txId.trim(), r);
        }

        // 2. Parse Fund Flow records if present
        List<FundFlowTransactionInput> ffList = (fundFlowFile != null && !fundFlowFile.isEmpty()) ? parseFundFlowInputs(fundFlowFile) : new ArrayList<>();
        Map<String, FundFlowTransactionInput> ffMap = new HashMap<>();
        int ffCounter = 1;
        for (FundFlowTransactionInput input : ffList) {
            String txId = input.getTransactionId();
            if (txId == null || txId.trim().isEmpty()) {
                txId = input.getRecordId() != null ? input.getRecordId() : "TXN-FF-" + ffCounter++;
                input.setTransactionId(txId);
            }
            ffMap.put(txId.trim(), input);
        }

        // 3. Parse Phishing records if present
        List<PhishingRequest> phList = (phishingFile != null && !phishingFile.isEmpty()) ? parsePhishingRequests(phishingFile.getBytes()) : new ArrayList<>();
        Map<String, PhishingRequest> phMap = new HashMap<>();
        int phCounter = 1;
        for (PhishingRequest req : phList) {
            String txId = req.getTransactionId();
            if (txId == null || txId.trim().isEmpty()) {
                txId = req.getRecordId() != null ? req.getRecordId() : "TXN-PH-" + phCounter++;
                req.setTransactionId(txId);
            }
            phMap.put(txId.trim(), req);
        }

        // 4. Collect Union of all Transaction IDs
        Set<String> allTxIds = new LinkedHashSet<>();
        allTxIds.addAll(afMap.keySet());
        allTxIds.addAll(ffMap.keySet());
        allTxIds.addAll(phMap.keySet());

        if (allTxIds.isEmpty()) {
            allTxIds.add("TXN-OCR-" + System.currentTimeMillis() % 10000);
        }

        BatchIngestionResponse batchResponse = new BatchIngestionResponse();
        List<RiskResponse> processedTransactions = new ArrayList<>();

        int veryLow = 0, low = 0, medium = 0, high = 0, critical = 0;

        for (String txId : allTxIds) {
            AFRecord afRecord = afMap.get(txId);
            FundFlowTransactionInput ffInput = ffMap.get(txId);
            PhishingRequest phRequest = phMap.get(txId);

            List<String> explanations = new ArrayList<>();
            boolean hasMissingData = false;
            List<String> missingDetails = new ArrayList<>();

            // Only flag HAS_MISSING_DATA if a PRESENT record has missing required attribute fields
            if (afRecord != null) {
                if (afRecord.getAmount() == null) {
                    hasMissingData = true;
                    missingDetails.add("Adaptive Friction 'amount' attribute is missing");
                }
            }

            if (ffInput != null) {
                if (ffInput.getTotalSent() == null && ffInput.getRemaining() == null) {
                    hasMissingData = true;
                    missingDetails.add("Fund Flow 'totalSent' / 'remainingBalance' attribute is missing");
                }
                if (ffInput.getInDegree() == null && ffInput.getOutDegree() == null) {
                    hasMissingData = true;
                    missingDetails.add("Fund Flow degree attributes ('inDegree' / 'outDegree') are missing");
                }
            }

            if (phRequest != null) {
                boolean hasDomainInfo = phRequest.getUrl() != null && !phRequest.getUrl().trim().isEmpty();
                boolean hasAgeInfo = phRequest.getAgeDays() != null;
                boolean hasCertInfo = phRequest.getSelfSigned() != null || phRequest.getValidityDays() != null;
                boolean hasListingInfo = phRequest.getLocalListing() != null && !phRequest.getLocalListing().trim().isEmpty() && !"none".equalsIgnoreCase(phRequest.getLocalListing().trim());
                boolean hasBlacklistInfo = Boolean.TRUE.equals(phRequest.getBlacklist());

                if (!hasDomainInfo && !hasAgeInfo && !hasCertInfo && !hasListingInfo && !hasBlacklistInfo) {
                    hasMissingData = true;
                    missingDetails.add("Phishing domain/certificate attributes are missing or incomplete");
                }
            }

            if (hasMissingData) {
                for (String md : missingDetails) {
                    explanations.add("Invalid or Missing Data: " + md);
                }
            }

            Double afScore = null;
            if (afRecord != null) {
                AFScoreResult afRes = afScoringService.calculateScore(afRecord);
                afScore = afRes.getScore();
                if (afRes.getExplanations() != null) explanations.addAll(afRes.getExplanations());
            }

            Double ffScore = null;
            if (ffInput != null) {
                FundFlowScoreResult ffRes = fundFlowScoringService.calculateScore(ffInput);
                ffScore = ffRes.getScore();
                if (ffRes.getExplanations() != null) explanations.addAll(ffRes.getExplanations());
            }

            Double phScore = null;
            if (phRequest != null) {
                PhishingScoreResult phRes = phishingScoringService.calculateScore(phRequest);
                phScore = phRes.getScore();
                if (phRes.getExplanations() != null) explanations.addAll(phRes.getExplanations());
            }

            double amount = 0.0;
            if (afRecord != null && afRecord.getAmount() != null) {
                amount = afRecord.getAmount();
            } else if (ffInput != null && ffInput.getTotalSent() != null) {
                amount = ffInput.getTotalSent();
            }

            String currency = "INR";
            if (ffInput != null && ffInput.getCurrency() != null) {
                currency = ffInput.getCurrency();
            } else if (afRecord != null && afRecord.getCurrency() != null) {
                currency = afRecord.getCurrency();
            }

            RiskResponse resp = unifiedRiskService.calculateRisk(
                    txId,
                    amount,
                    currency,
                    afScore,
                    ffScore,
                    phScore,
                    explanations,
                    hasMissingData
            );

            processedTransactions.add(resp);

            String band = resp.getRiskBand();
            if ("Very Low".equalsIgnoreCase(band)) veryLow++;
            else if ("Low".equalsIgnoreCase(band)) low++;
            else if ("Medium".equalsIgnoreCase(band)) medium++;
            else if ("High".equalsIgnoreCase(band)) high++;
            else if ("Critical".equalsIgnoreCase(band)) critical++;
        }

        batchResponse.setTotalProcessed(processedTransactions.size());
        batchResponse.setValidationFailures(0);
        batchResponse.setVeryLowCount(veryLow);
        batchResponse.setLowCount(low);
        batchResponse.setMediumCount(medium);
        batchResponse.setHighCount(high);
        batchResponse.setCriticalCount(critical);
        batchResponse.setTransactions(processedTransactions);

        return batchResponse;
    }

    private List<AFRecord> parseAdaptiveRecords(byte[] bytes) throws IOException {
        if (bytes == null || bytes.length == 0) return new ArrayList<>();
        try {
            JsonNode node = objectMapper.readTree(bytes);
            List<AFRecord> list = new ArrayList<>();

            if (node.isArray()) {
                for (JsonNode elem : node) {
                    AFRecord rec = objectMapper.treeToValue(elem, AFRecord.class);
                    if (rec != null) list.add(rec);
                }
            } else if (node.isObject()) {
                AFRecord rec = objectMapper.treeToValue(node, AFRecord.class);
                if (rec != null) list.add(rec);
            }
            return list;
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<PhishingRequest> parsePhishingRequests(byte[] bytes) throws IOException {
        if (bytes == null || bytes.length == 0) return new ArrayList<>();
        try {
            JsonNode node = objectMapper.readTree(bytes);
            List<PhishingRequest> list = new ArrayList<>();

            if (node.isArray()) {
                for (JsonNode elem : node) {
                    PhishingRequest req = objectMapper.treeToValue(elem, PhishingRequest.class);
                    if (req != null) list.add(req);
                }
            } else if (node.isObject()) {
                PhishingRequest req = objectMapper.treeToValue(node, PhishingRequest.class);
                if (req != null) list.add(req);
            }
            return list;
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private List<FundFlowTransactionInput> parseFundFlowInputs(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return new ArrayList<>();
        }

        List<FundFlowTransactionInput> list = new ArrayList<>();

        try (
            Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)
        ) {
            Iterable<CSVRecord> records = CSVFormat.DEFAULT.builder()
                    .setHeader()
                    .setSkipHeaderRecord(true)
                    .setIgnoreHeaderCase(true)
                    .setTrim(true)
                    .build()
                    .parse(reader);

            int rowIdx = 1;
            for (CSVRecord record : records) {
                try {
                    String txId = getOptionalValue(record, "TransactionId", "transaction_id", "transactionId", "Transaction ID", "tx_id", "id");
                    if (txId == null || txId.isEmpty()) {
                        txId = "TXN-CSV-" + rowIdx;
                    }

                    FundFlowTransactionInput input = new FundFlowTransactionInput();
                    input.setTransactionId(txId);
                    input.setRecordId(getOptionalValue(record, "RecordId", "record_id", "recordId", "Record ID"));
                    input.setCurrency(getOptionalValueWithDefault(record, "SEK", "Currency", "currency"));
                    input.setInDegree(parseInteger(record, null, "InDegree", "in_degree", "inDegree", "In Degree"));
                    input.setOutDegree(parseInteger(record, null, "OutDegree", "out_degree", "outDegree", "Out Degree"));
                    input.setRemaining(parseDouble(record, null, "RemainingBalance", "remaining_balance", "remainingBalance", "Remaining Balance", "remaining"));
                    input.setTotalSent(parseDouble(record, null, "TotalSent", "total_sent", "totalSent", "Total Sent", "amount"));
                    input.setHoldingMinutes(parseInteger(record, null, "HoldingMinutes", "holding_minutes", "holdingMinutes", "Holding Minutes"));
                    list.add(input);
                    rowIdx++;
                } catch (Exception e) {
                    // Ignore malformed individual row
                }
            }
        } catch (Exception e) {
            // Ignore CSV format exception
        }

        return list;
    }

    private String getOptionalValue(CSVRecord record, String... columnAliases) {
        return getOptionalValueWithDefault(record, null, columnAliases);
    }

    private String getOptionalValueWithDefault(CSVRecord record, String defaultValue, String... columnAliases) {
        for (String col : columnAliases) {
            if (record.isMapped(col)) {
                String val = record.get(col);
                if (val != null && !val.trim().isEmpty() && !isMissingPlaceholder(val)) {
                    return val.trim();
                }
            }
        }
        return defaultValue;
    }

    private boolean isMissingPlaceholder(String val) {
        String s = val.trim().toLowerCase();
        return s.equals("null") || s.equals("n/a") || s.equals("none") || s.equals("-") || s.equals("undefined") || s.equals("nan");
    }

    private Integer parseInteger(CSVRecord record, Integer defaultValue, String... columnAliases) {
        String val = getOptionalValue(record, columnAliases);
        if (val == null) return defaultValue;
        try {
            return Integer.parseInt(val);
        } catch (NumberFormatException e) {
            try {
                return (int) Double.parseDouble(val);
            } catch (Exception ex) {
                return defaultValue;
            }
        }
    }

    private Double parseDouble(CSVRecord record, Double defaultValue, String... columnAliases) {
        String val = getOptionalValue(record, columnAliases);
        if (val == null) return defaultValue;
        try {
            return Double.parseDouble(val);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}