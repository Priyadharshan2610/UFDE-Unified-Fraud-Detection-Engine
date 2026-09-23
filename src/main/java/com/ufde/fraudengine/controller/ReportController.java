package com.ufde.fraudengine.controller;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ufde.fraudengine.model.Transaction;
import com.ufde.fraudengine.repository.TransactionRepository;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    private final TransactionRepository transactionRepository;

    public ReportController(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @GetMapping(value = "/str/{transactionId}/download", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> downloadSTRReport(
            @PathVariable("transactionId") String transactionId,
            @RequestParam(value = "lang", defaultValue = "en") String lang) {
        ResponseEntity<String> resp = generateHtmlReportResponse(transactionId, true, lang);
        HttpHeaders headers = new HttpHeaders();
        headers.putAll(resp.getHeaders());
        headers.add("Content-Disposition", "attachment; filename=\"STR-Report-" + transactionId + ".html\"");
        return new ResponseEntity<>(resp.getBody(), headers, resp.getStatusCode());
    }

    @GetMapping(value = "/str/{transactionId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getSTRReport(
            @PathVariable("transactionId") String transactionId,
            @RequestParam(value = "lang", defaultValue = "en") String lang) {
        return generateHtmlReportResponse(transactionId, false, lang);
    }

    @GetMapping(value = "/{transactionId}/pdf", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getPdfReport(
            @PathVariable("transactionId") String transactionId,
            @RequestParam(value = "lang", defaultValue = "en") String lang) {
        return generateHtmlReportResponse(transactionId, true, lang);
    }

    @GetMapping(value = "/str/{transactionId}/pdf", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getStrPdfReport(
            @PathVariable("transactionId") String transactionId,
            @RequestParam(value = "lang", defaultValue = "en") String lang) {
        return generateHtmlReportResponse(transactionId, true, lang);
    }

    private ResponseEntity<String> generateHtmlReportResponse(String transactionId, boolean autoPrint, String lang) {
        Transaction tx = null;
        List<Transaction> list = transactionRepository.findByTransactionIdOrderByIdDesc(transactionId);
        if (!list.isEmpty()) {
            tx = list.get(0);
        } else {
            try {
                Long id = Long.parseLong(transactionId);
                tx = transactionRepository.findById(id).orElse(null);
            } catch (Exception e) {
                // Ignore parse error
            }
        }

        if (tx == null) {
            String errorHtml = """
                <!DOCTYPE html>
                <html>
                <head><title>Report Not Found</title></head>
                <body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center;">
                    <h2>Transaction Report Not Found</h2>
                    <p>No transaction record matching ID: <strong>%s</strong> was found in the database.</p>
                </body>
                </html>
                """.formatted(transactionId);
            return ResponseEntity.status(404).body(errorHtml);
        }

        String language = lang != null ? lang.toLowerCase() : "en";

        String txId = tx.getTransactionId() != null ? tx.getTransactionId() : "TX-" + tx.getId();
        double amount = tx.getAmount() != null ? tx.getAmount() : 0.0;
        String currency = tx.getCurrency() != null ? tx.getCurrency() : "INR";
        double score = tx.getConsolidatedScore() != null ? tx.getConsolidatedScore() : 0.0;
        String band = tx.getRiskBand() != null ? tx.getRiskBand() : "Very Low";
        String action = tx.getRecommendedAction() != null ? tx.getRecommendedAction() : "None";
        double af = tx.getAdaptiveScore() != null ? tx.getAdaptiveScore() : 0.0;
        double ff = tx.getFundFlowScore() != null ? tx.getFundFlowScore() : 0.0;
        double ph = tx.getPhishingScore() != null ? tx.getPhishingScore() : 0.0;

        String rawExplanations = tx.getExplanations() != null ? tx.getExplanations() : "";
        String evidence = translateExplanations(rawExplanations, language);

        String title = "SUSPICIOUS TRANSACTION REPORT (STR)";
        String subtitle = "Unified Fraud Detection Engine (UFDE v3.0) • BNP Paribas Specification";
        String sec1Header = "1. Header Information";
        String sec2Header = "2. Transaction Summary";
        String sec3Header = "3. Risk Assessment & Weighted Breakdown";
        String sec4Header = "4. Supporting Evidence & Explanations";

        String labelInstitution = "Reporting Institution";
        String valInstitution = "ABC Bank - Fraud Detection Unit";
        String labelReportId = "Report ID";
        String labelDate = "Date of Report";
        String labelStatus = "Status";
        String valStatus = "CONFIDENTIAL REGULATORY FILING";

        String labelTxId = "Transaction ID";
        String labelAmount = "Amount";
        String labelRiskScore = "Consolidated Risk Score";
        String labelRiskBand = "Risk Band";
        String labelAction = "Recommended Action";

        String colComponent = "Component";
        String colSubScore = "Sub-Score";
        String colWeight = "Weight";
        String colContrib = "Weighted Contribution";
        String labelTotal = "TOTAL CONSOLIDATED SCORE";

        String labelAF = "Adaptive Friction (AF)";
        String labelFF = "Fund Flow (FF)";
        String labelPH = "Phishing Site (PH)";

        String footerText = "Generated by Unified Fraud Detection Engine (UFDE) • Official Regulatory Report";

        if ("fr".equals(language)) {
            title = "DÉCLARATION DE SOUPÇON (STR)";
            subtitle = "Moteur Unifié de Détection de Fraude (UFDE v3.0) • Spécification BNP Paribas";
            sec1Header = "1. Informations d'En-tête";
            sec2Header = "2. Résumé de la Transaction";
            sec3Header = "3. Évaluation du Risque et Ventilation";
            sec4Header = "4. Preuves et Explications";

            labelInstitution = "Organisme Déclarant";
            valInstitution = "ABC Bank - Unité de Détection des Fraudes";
            labelReportId = "Identifiant du Rapport";
            labelDate = "Date du Rapport";
            labelStatus = "Statut";
            valStatus = "DÉPÔT RÉGLEMENTAIRE CONFIDENTIEL";

            labelTxId = "Identifiant Transaction";
            labelAmount = "Montant";
            labelRiskScore = "Score de Risque Consolidé";
            labelRiskBand = "Niveau de Risque";
            labelAction = "Action Recommandée";

            colComponent = "Composant";
            colSubScore = "Sous-Score";
            colWeight = "Poids";
            colContrib = "Contribution Pondérée";
            labelTotal = "SCORE CONSOLIDÉ TOTAL";

            labelAF = "Friction Adaptative (AF)";
            labelFF = "Flux de Fonds (FF)";
            labelPH = "Site de Hameçonnage (PH)";

            footerText = "Généré par Unified Fraud Detection Engine (UFDE) • Rapport Réglementaire Officiel";
            band = translateRiskBand(band, "fr");
            action = translateAction(action, "fr");
        } else if ("hi".equals(language)) {
            title = "संदेहास्पद लेन-देन रिपोर्ट (STR)";
            subtitle = "एकीकृत धोखाधड़ी पहचान इंजन (UFDE v3.0) • बीएनपी परिबा विनिर्देश";
            sec1Header = "1. शीर्षक जानकारी";
            sec2Header = "2. लेन-देन सारांश";
            sec3Header = "3. जोखिम मूल्यांकन और भारित विवरण";
            sec4Header = "4. सहायक साक्ष्य और स्पष्टीकरण";

            labelInstitution = "रिपोर्टिंग संस्था";
            valInstitution = "एबीसी बैंक - धोखाधड़ी पहचान इकाई";
            labelReportId = "रिपोर्ट आईडी";
            labelDate = "रिपोर्ट की तिथि";
            labelStatus = "स्थिति";
            valStatus = "गोपनीय नियामक फाइलिंग";

            labelTxId = "लेन-देन आईडी";
            labelAmount = "राशि";
            labelRiskScore = "समेकित जोखिम स्कोर";
            labelRiskBand = "जोखिम श्रेणी";
            labelAction = "अनुशंसित कार्रवाई";

            colComponent = "घटक";
            colSubScore = "उप-स्कोर";
            colWeight = "भार";
            colContrib = "भारित योगदान";
            labelTotal = "कुल समेकित स्कोर";

            labelAF = "अनुकूली घर्षण (AF)";
            labelFF = "फंड प्रवाह (FF)";
            labelPH = "फ़िशिंग साइट (PH)";

            footerText = "एकीकृत धोखाधड़ी पहचान इंजन (UFDE) द्वारा उत्पन्न • आधिकारिक नियामक रिपोर्ट";
            band = translateRiskBand(band, "hi");
            action = translateAction(action, "hi");
        }

        String printScript = autoPrint ? "<script>window.onload = function() { window.print(); };</script>" : "";

        String html = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>%s - %s</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f1f5f9; color: #0f172a; padding: 25px; margin: 0; }
                    .card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; max-width: 800px; margin: 0 auto; padding: 35px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
                    .lang-bar { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 20px; }
                    .lang-btn { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 6px 14px; border-radius: 6px; cursor: pointer; text-decoration: none; font-size: 13px; font-weight: 600; }
                    .lang-btn.active { background: #1e3a8a; border-color: #1e3a8a; color: #ffffff; }
                    .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 18px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
                    .title { font-size: 24px; font-weight: 800; color: #1e3a8a; letter-spacing: -0.5px; }
                    .subtitle { font-size: 14px; color: #475569; margin-top: 4px; }
                    h3 { color: #1e293b; font-size: 16px; font-weight: 700; margin-top: 25px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
                    table { width: 100%%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
                    th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
                    th { background: #f8fafc; color: #475569; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
                    td { color: #1e293b; }
                    .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; }
                    .badge-critical { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
                    .badge-high { background: #ffedd5; color: #9a3412; border: 1px solid #fb923c; }
                    .badge-medium { background: #fef9c3; color: #854d0e; border: 1px solid #facc15; }
                    .badge-low { background: #dbeafe; color: #1e40af; border: 1px solid #60a5fa; }
                    .badge-very-low { background: #dcfce7; color: #166534; border: 1px solid #4ade80; }
                    .evidence-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #ea580c; padding: 18px; margin-top: 15px; border-radius: 6px; font-size: 14px; line-height: 1.7; color: #1e293b; }
                    .footer { font-size: 12px; color: #64748b; margin-top: 35px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 18px; }
                    @media print {
                        body { background: #fff; color: #000; padding: 0; }
                        .lang-bar { display: none; }
                        .card { background: #fff; border: none; box-shadow: none; max-width: 100%%; padding: 0; }
                        th { background: #f1f5f9; color: #334155; }
                        td, th { border-bottom: 1px solid #cbd5e1; }
                        .evidence-box { background: #f8fafc; border-left: 4px solid #000; }
                    }
                </style>
                %s
            </head>
            <body>
                <div class="card">
                    <div class="lang-bar">
                        <button onclick="window.print()" class="lang-btn" style="background:#14213d; color:#ffffff; border-color:#14213d; cursor:pointer;">📥 Save as PDF / Print</button>
                        <a href="?lang=en" class="lang-btn %s">🇬🇧 English</a>
                        <a href="?lang=fr" class="lang-btn %s">🇫🇷 Français</a>
                        <a href="?lang=hi" class="lang-btn %s">🇮🇳 हिंदी</a>
                    </div>
                    <div class="header">
                        <div>
                            <div class="title">%s</div>
                            <div class="subtitle">%s</div>
                        </div>
                        <div>
                            <span class="badge badge-%s">%s</span>
                        </div>
                    </div>

                    <h3>%s</h3>
                    <table>
                        <tr><th>%s</th><td>%s</td></tr>
                        <tr><th>%s</th><td>STR-2026-%s</td></tr>
                        <tr><th>%s</th><td>%s</td></tr>
                        <tr><th>%s</th><td>%s</td></tr>
                    </table>

                    <h3>%s</h3>
                    <table>
                        <tr><th>%s</th><td><strong>%s</strong></td></tr>
                        <tr><th>%s</th><td><strong>%s %.2f</strong></td></tr>
                        <tr><th>%s</th><td><strong>%.2f / 100</strong></td></tr>
                        <tr><th>%s</th><td>%s</td></tr>
                        <tr><th>%s</th><td>%s</td></tr>
                    </table>

                    <h3>%s</h3>
                    <table>
                        <tr><th>%s</th><th>%s</th><th>%s</th><th>%s</th></tr>
                        <tr><td>%s</td><td>%.2f</td><td>45%%</td><td>%.2f</td></tr>
                        <tr><td>%s</td><td>%.2f</td><td>35%%</td><td>%.2f</td></tr>
                        <tr><td>%s</td><td>%.2f</td><td>20%%</td><td>%.2f</td></tr>
                        <tr><th>%s</th><th>—</th><th>100%%</th><th>%.2f</th></tr>
                    </table>

                    <h3>%s</h3>
                    <div class="evidence-box">
                        • %s
                    </div>

                    <div class="footer">
                        %s
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                title, txId,
                printScript,
                "en".equals(language) ? "active" : "",
                "fr".equals(language) ? "active" : "",
                "hi".equals(language) ? "active" : "",
                title, subtitle,
                tx.getRiskBand() != null ? tx.getRiskBand().toLowerCase().replace(" ", "-") : "very-low",
                band,
                sec1Header,
                labelInstitution, valInstitution,
                labelReportId, txId.substring(Math.max(0, txId.length() - 6)),
                labelDate, java.time.LocalDate.now().toString(),
                labelStatus, valStatus,
                sec2Header,
                labelTxId, txId,
                labelAmount, currency, amount,
                labelRiskScore, score,
                labelRiskBand, band,
                labelAction, action,
                sec3Header,
                colComponent, colSubScore, colWeight, colContrib,
                labelAF, af, af * 0.45,
                labelFF, ff, ff * 0.35,
                labelPH, ph, ph * 0.20,
                labelTotal, score,
                sec4Header,
                evidence,
                footerText
            );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_HTML);
        return ResponseEntity.ok().headers(headers).body(html);
    }

    private String translateRiskBand(String band, String lang) {
        if ("fr".equals(lang)) {
            if ("Critical".equalsIgnoreCase(band)) return "Critique";
            if ("High".equalsIgnoreCase(band)) return "Élevé";
            if ("Medium".equalsIgnoreCase(band)) return "Moyen";
            if ("Low".equalsIgnoreCase(band)) return "Faible";
            if ("Very Low".equalsIgnoreCase(band)) return "Très Faible";
        } else if ("hi".equals(lang)) {
            if ("Critical".equalsIgnoreCase(band)) return "गंभीर";
            if ("High".equalsIgnoreCase(band)) return "उच्च";
            if ("Medium".equalsIgnoreCase(band)) return "मध्यम";
            if ("Low".equalsIgnoreCase(band)) return "कम";
            if ("Very Low".equalsIgnoreCase(band)) return "बहुत कम";
        }
        return band;
    }

    private String translateAction(String action, String lang) {
        if ("fr".equals(lang)) {
            if (action.contains("Immediate hold")) return "Blocage immédiat de la transaction. Enquête de l'analyste et préparation du STR.";
            if (action.contains("Analyst-level review")) return "Examen de niveau analyste – transmettre le dossier au rôle Analyste.";
            if (action.contains("Automated monitoring")) return "Surveillance automatisée – marquer la transaction pour suivi.";
        } else if ("hi".equals(lang)) {
            if (action.contains("Immediate hold")) return "लेन-देन पर तत्काल रोक। विश्लेषक जांच और ड्राफ्ट STR जनरेट करें।";
            if (action.contains("Analyst-level review")) return "विश्लेषक-स्तरीय समीक्षा - मामले को विश्लेषक भूमिका को भेजें।";
            if (action.contains("Automated monitoring")) return "स्वचालित निगरानी - वॉच-लिस्ट स्थिति के लिए लेन-देन को चिह्नित करें।";
        }
        return action;
    }

    private String translateExplanations(String rawExplanations, String lang) {
        if (rawExplanations == null || rawExplanations.trim().isEmpty()) {
            return "No specific signals triggered.";
        }

        String formatted = rawExplanations.replace("; ", "\n").replace("; ", "<br>• ");

        if ("fr".equals(lang)) {
            formatted = formatted
                .replace("Device fingerprint differs from the stored profile.", "L'empreinte de l'appareil diffère du profil enregistré.")
                .replace("Transaction originated from a distant location.", "La transaction provient d'un emplacement distant.")
                .replace("Transaction amount is higher than the historic mean.", "Le montant de la transaction est supérieur à la moyenne historique.")
                .replace("Fund flow shows an imbalance between incoming and outgoing connections.", "Le flux de fonds montre un déséquilibre entre les connexions entrantes et sortantes.")
                .replace("Remaining balance is low compared with the total amount sent.", "Le solde restant est faible par rapport au montant total envoyé.")
                .replace("Funds were held for less than 60 minutes.", "Les fonds ont été détenus pendant moins de 60 minutes.")
                .replace("Domain is relatively new.", "Le domaine est relativement récent.")
                .replace("Certificate is self-signed or has less than 30 days of validity.", "Le certificat est auto-signé ou a moins de 30 jours de validité.")
                .replace("Domain appears on the local blacklist.", "Le domaine apparaît sur la liste noire locale.");
        } else if ("hi".equals(lang)) {
            formatted = formatted
                .replace("Device fingerprint differs from the stored profile.", "डिवाइस फिंगरप्रिंट संग्रहीत प्रोफ़ाइल से भिन्न है।")
                .replace("Transaction originated from a distant location.", "लेन-देन दूरस्थ स्थान से उत्पन्न हुआ।")
                .replace("Transaction amount is higher than the historic mean.", "लेन-देन की राशि ऐतिहासिक औसत से अधिक है।")
                .replace("Fund flow shows an imbalance between incoming and outgoing connections.", "फंड प्रवाह आने वाले और जाने वाले कनेक्शनों के बीच असंतुलन दिखाता है।")
                .replace("Remaining balance is low compared with the total amount sent.", "भेजी गई कुल राशि की तुलना में शेष राशि कम है।")
                .replace("Funds were held for less than 60 minutes.", "फंड 60 मिनट से कम समय के लिए रखे गए थे।")
                .replace("Domain is relatively new.", "डोमेन अपेक्षाकृत नया है।")
                .replace("Certificate is self-signed or has less than 30 days of validity.", "प्रमाणपत्र स्व-हस्ताक्षरित है या वैधता 30 दिनों से कम है।")
                .replace("Domain appears on the local blacklist.", "डोमेन स्थानीय ब्लैकलिस्ट पर दिखाई देता है।");
        }

        return formatted.replace("\n", "<br>• ");
    }
}
