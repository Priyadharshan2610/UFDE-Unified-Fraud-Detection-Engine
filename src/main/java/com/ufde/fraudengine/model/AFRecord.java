package com.ufde.fraudengine.model;

import java.util.Map;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AFRecord {

    @JsonProperty("recordId")
    @JsonAlias({"RecordId", "record_id", "Record ID"})
    private String recordId;

    @JsonProperty("transactionId")
    @JsonAlias({"TransactionId", "transaction_id", "Transaction ID", "id", "ID"})
    private String transactionId;

    @JsonProperty("currentOs")
    @JsonAlias({"CurrentOs", "current_os", "os"})
    private String currentOs;

    @JsonProperty("currentBrowser")
    @JsonAlias({"CurrentBrowser", "current_browser", "browser"})
    private String currentBrowser;

    @JsonProperty("currentIp")
    @JsonAlias({"CurrentIp", "current_ip", "ipAddress", "ip"})
    private String currentIp;

    @JsonProperty("currentUserAgent")
    @JsonAlias({"CurrentUserAgent", "current_user_agent", "userAgent"})
    private String currentUserAgent;

    @JsonProperty("storedOs")
    @JsonAlias({"StoredOs", "stored_os"})
    private String storedOs;

    @JsonProperty("storedBrowser")
    @JsonAlias({"StoredBrowser", "stored_browser"})
    private String storedBrowser;

    @JsonProperty("storedIp")
    @JsonAlias({"StoredIp", "stored_ip"})
    private String storedIp;

    @JsonProperty("storedUserAgent")
    @JsonAlias({"StoredUserAgent", "stored_user_agent"})
    private String storedUserAgent;

    @JsonProperty("distanceKm")
    @JsonAlias({"DistanceKm", "distance_km", "distance"})
    private Double distanceKm;

    @JsonProperty("amount")
    @JsonAlias({"Amount", "amount", "totalSent"})
    private Double amount;

    @JsonProperty("historicMean")
    @JsonAlias({"HistoricMean", "historic_mean", "historicalAvgAmount"})
    private Double historicMean;

    @JsonProperty("currency")
    @JsonAlias({"Currency", "currency"})
    private String currency;

    @JsonProperty("liveTransaction")
    private void unpackLiveTransaction(Map<String, Object> liveTx) {
        if (liveTx != null) {
            if (liveTx.containsKey("amount") && liveTx.get("amount") != null) {
                this.amount = ((Number) liveTx.get("amount")).doubleValue();
            }
            if (liveTx.containsKey("currency") && liveTx.get("currency") != null) {
                this.currency = liveTx.get("currency").toString();
            }
            if (liveTx.containsKey("distanceKm") && liveTx.get("distanceKm") != null) {
                this.distanceKm = ((Number) liveTx.get("distanceKm")).doubleValue();
            }
            if (liveTx.containsKey("deviceFingerprint") && liveTx.get("deviceFingerprint") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> fp = (Map<String, Object>) liveTx.get("deviceFingerprint");
                if (fp.get("os") != null) this.currentOs = fp.get("os").toString();
                if (fp.get("browser") != null) this.currentBrowser = fp.get("browser").toString();
                if (fp.get("ipAddress") != null) this.currentIp = fp.get("ipAddress").toString();
                else if (fp.get("ip") != null) this.currentIp = fp.get("ip").toString();
                if (fp.get("userAgent") != null) this.currentUserAgent = fp.get("userAgent").toString();
            }
        }
    }

    @JsonProperty("storedProfile")
    private void unpackStoredProfile(Map<String, Object> profile) {
        if (profile != null) {
            if (profile.containsKey("historicalAvgAmount") && profile.get("historicalAvgAmount") != null) {
                this.historicMean = ((Number) profile.get("historicalAvgAmount")).doubleValue();
            } else if (profile.containsKey("historicMean") && profile.get("historicMean") != null) {
                this.historicMean = ((Number) profile.get("historicMean")).doubleValue();
            }
            if (profile.containsKey("knownDeviceFingerprint") && profile.get("knownDeviceFingerprint") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> fp = (Map<String, Object>) profile.get("knownDeviceFingerprint");
                if (fp.get("os") != null) this.storedOs = fp.get("os").toString();
                if (fp.get("browser") != null) this.storedBrowser = fp.get("browser").toString();
                if (fp.get("ipAddress") != null) this.storedIp = fp.get("ipAddress").toString();
                else if (fp.get("ip") != null) this.storedIp = fp.get("ip").toString();
                if (fp.get("userAgent") != null) this.storedUserAgent = fp.get("userAgent").toString();
            }
        }
    }

    public String getRecordId() {
        return recordId;
    }

    public void setRecordId(String recordId) {
        this.recordId = recordId;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getCurrentOs() {
        return currentOs;
    }

    public void setCurrentOs(String currentOs) {
        this.currentOs = currentOs;
    }

    public String getCurrentBrowser() {
        return currentBrowser;
    }

    public void setCurrentBrowser(String currentBrowser) {
        this.currentBrowser = currentBrowser;
    }

    public String getCurrentIp() {
        return currentIp;
    }

    public void setCurrentIp(String currentIp) {
        this.currentIp = currentIp;
    }

    public String getCurrentUserAgent() {
        return currentUserAgent;
    }

    public void setCurrentUserAgent(String currentUserAgent) {
        this.currentUserAgent = currentUserAgent;
    }

    public String getStoredOs() {
        return storedOs;
    }

    public void setStoredOs(String storedOs) {
        this.storedOs = storedOs;
    }

    public String getStoredBrowser() {
        return storedBrowser;
    }

    public void setStoredBrowser(String storedBrowser) {
        this.storedBrowser = storedBrowser;
    }

    public String getStoredIp() {
        return storedIp;
    }

    public void setStoredIp(String storedIp) {
        this.storedIp = storedIp;
    }

    public String getStoredUserAgent() {
        return storedUserAgent;
    }

    public void setStoredUserAgent(String storedUserAgent) {
        this.storedUserAgent = storedUserAgent;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Double getHistoricMean() {
        return historicMean;
    }

    public void setHistoricMean(Double historicMean) {
        this.historicMean = historicMean;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}