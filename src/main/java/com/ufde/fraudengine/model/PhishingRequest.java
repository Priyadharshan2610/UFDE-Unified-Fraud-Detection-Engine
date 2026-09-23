package com.ufde.fraudengine.model;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PhishingRequest {

    @JsonProperty("recordId")
    @JsonAlias({"RecordId", "record_id", "Record ID"})
    private String recordId;

    @JsonProperty("transactionId")
    @JsonAlias({"TransactionId", "transaction_id", "Transaction ID", "id", "ID"})
    private String transactionId;

    @JsonProperty("submittedAt")
    @JsonAlias({"SubmittedAt", "submitted_at"})
    private String submittedAt;

    @JsonProperty("url")
    @JsonAlias({"Url", "URL", "domain", "link"})
    private String url;

    @JsonProperty("ageDays")
    @JsonAlias({"AgeDays", "age_days"})
    private Double ageDays;

    @JsonProperty("selfSigned")
    @JsonAlias({"SelfSigned", "self_signed"})
    private Boolean selfSigned;

    @JsonProperty("validityDays")
    @JsonAlias({"ValidityDays", "validity_days"})
    private Double validityDays;

    @JsonProperty("localListing")
    @JsonAlias({"LocalListing", "local_listing"})
    private String localListing;

    @JsonProperty("blacklist")
    @JsonAlias({"Blacklist", "black_list"})
    private Boolean blacklist;

    private String registrationDate;
    private String validFrom;
    private String validTo;

    @JsonProperty("domain")
    private void unpackDomain(Map<String, Object> domain) {
        if (domain != null) {
            if (domain.containsKey("ageDays") && domain.get("ageDays") != null) {
                this.ageDays = ((Number) domain.get("ageDays")).doubleValue();
            } else if (domain.containsKey("age_days") && domain.get("age_days") != null) {
                this.ageDays = ((Number) domain.get("age_days")).doubleValue();
            }
            if (domain.containsKey("registrationDate") && domain.get("registrationDate") != null) {
                this.registrationDate = domain.get("registrationDate").toString();
            }
        }
    }

    @JsonProperty("certificate")
    private void unpackCertificate(Map<String, Object> cert) {
        if (cert != null) {
            if (cert.containsKey("selfSigned") && cert.get("selfSigned") != null) {
                this.selfSigned = (Boolean) cert.get("selfSigned");
            }
            if (cert.containsKey("validityDays") && cert.get("validityDays") != null) {
                this.validityDays = ((Number) cert.get("validityDays")).doubleValue();
            }
            if (cert.containsKey("validFrom") && cert.get("validFrom") != null) {
                this.validFrom = cert.get("validFrom").toString();
            }
            if (cert.containsKey("validTo") && cert.get("validTo") != null) {
                this.validTo = cert.get("validTo").toString();
            }
        }
    }

    private Double calculateDaysBetween(String startIso, String endIso) {
        try {
            if (startIso == null || endIso == null) return null;
            Instant start = Instant.parse(startIso);
            Instant end = Instant.parse(endIso);
            long seconds = ChronoUnit.SECONDS.between(start, end);
            return Math.max(0.0, (double) seconds / 86400.0);
        } catch (Exception e) {
            return null;
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

    public String getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(String submittedAt) {
        this.submittedAt = submittedAt;
    }

    public Double getAgeDays() {
        if (ageDays != null) {
            return ageDays;
        }
        if (registrationDate != null && submittedAt != null) {
            return calculateDaysBetween(registrationDate, submittedAt);
        }
        return null;
    }

    public void setAgeDays(Double ageDays) {
        this.ageDays = ageDays;
    }

    public Boolean getSelfSigned() {
        return selfSigned;
    }

    public void setSelfSigned(Boolean selfSigned) {
        this.selfSigned = selfSigned;
    }

    public Double getValidityDays() {
        if (validityDays != null) {
            return validityDays;
        }
        if (validFrom != null && validTo != null) {
            return calculateDaysBetween(validFrom, validTo);
        }
        return null;
    }

    public void setValidityDays(Double validityDays) {
        this.validityDays = validityDays;
    }

    public String getLocalListing() {
        return localListing;
    }

    public void setLocalListing(String localListing) {
        this.localListing = localListing;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public Boolean getBlacklist() {
        return blacklist;
    }

    public void setBlacklist(Boolean blacklist) {
        this.blacklist = blacklist;
    }
}