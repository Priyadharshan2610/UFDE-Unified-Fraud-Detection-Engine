import { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import "../App.css";


// =====================================================
// SUPPORTED LANGUAGES FOR TRANSLATION
// =====================================================

const LANGUAGES = [
  { code: "en",    label: "English" },
  { code: "hi",    label: "Hindi (हिंदी)" },
  { code: "te",    label: "Telugu (తెలుగు)" },
  { code: "ta",    label: "Tamil (தமிழ்)" },
  { code: "kn",    label: "Kannada (ಕನ್ನಡ)" },
  { code: "mr",    label: "Marathi (मराठी)" },
];


// =====================================================
// TRANSLATE – MyMemory free API (no key needed)
// =====================================================

async function translateText(text, targetLang) {
  if (targetLang === "en" || !text.trim()) return text;

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
    const res  = await fetch(url);
    const data = await res.json();

    if (data?.responseStatus === 200) {
      return data.responseData.translatedText;
    }
  } catch {
    // network failure – return original
  }
  return text;
}


// =====================================================
// TRANSLATE MULTIPLE STRINGS IN PARALLEL (batch)
// =====================================================

async function translateBatch(strings, lang) {
  if (lang === "en") return strings;
  return Promise.all(strings.map((s) => translateText(s, lang)));
}


// =====================================================
// TRANSACTION DETAIL
// =====================================================

function TransactionDetail({ transaction, onBack }) {

  const [showEdit, setShowEdit] = useState(false);
  const [showSTR,  setShowSTR]  = useState(false);

  const role = localStorage.getItem("ufdeRole");


  // =====================================================
  // TEMPORARY FRONTEND DETAIL DATA
  // =====================================================

  const detail = {
    adaptiveFriction: transaction.score,
    fundFlow:         transaction.score,
    phishing:         transaction.score,

    alerts: [
      "Suspicious transaction pattern detected",
      "Fund-flow activity requires review",
      "Transaction risk indicators detected",
    ],

    explanation:
      "The transaction contains risk indicators across the detection engines. Further investigation is recommended.",

    flow: [
      { name: "Source Account",  value: "ACC-1024" },
      { name: "Intermediate",    value: "ACC-5831" },
      { name: "Merchant",        value: "MER-2098" },
      { name: "Destination",     value: "ACC-7732" },
    ],
  };


  // =====================================================
  // RISK
  // =====================================================

  const totalScore = transaction.score;
  const riskBand   = transaction.band;

  function getRiskClass() {
    return riskBand.toLowerCase().replace(" ", "-");
  }


  // =====================================================
  // LOCK BACKGROUND SCROLL WHEN MODAL IS OPEN
  // =====================================================

  useEffect(() => {
    const modalOpen = showEdit || showSTR;

    if (modalOpen) {
      document.body.classList.add("ufde-modal-open");
    } else {
      document.body.classList.remove("ufde-modal-open");
    }

    return () => {
      document.body.classList.remove("ufde-modal-open");
    };
  }, [showEdit, showSTR]);


  // =====================================================
  // DOWNLOAD TRANSACTION JSON
  // =====================================================

  function downloadTransaction() {
    if (role !== "admin") return;

    const data = {
      transaction,
      riskScore: totalScore,
      riskBand,
      signals: {
        adaptiveFriction: detail.adaptiveFriction,
        fundFlow:         detail.fundFlow,
        phishing:         detail.phishing,
      },
      alerts:      detail.alerts,
      explanation: detail.explanation,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: "application/json" }
    );

    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = `${transaction.id}-investigation.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }


  // =====================================================
  // GENERATE STR
  // =====================================================

  function generateSTR() {
    if (role !== "admin") return;
    setShowSTR(true);
  }

  function closeSTR()  { setShowSTR(false); }
  function closeEdit() { setShowEdit(false); }


  // =====================================================
  // RETURN UI
  // =====================================================

  return (

    <div className="transaction-detail-panel">


      {/* =================================================
          DETAIL HEADER
      ================================================= */}

      <div className="transaction-detail-header">

        <div>
          <span className="detail-panel-label">INVESTIGATION</span>
          <h2>{transaction.id}</h2>
        </div>

        <button
          className="detail-close-button"
          onClick={onBack}
          aria-label="Close transaction details"
        >
          ×
        </button>

      </div>


      {/* =================================================
          TRANSACTION SUMMARY
      ================================================= */}

      <section className="compact-transaction-summary">

        <div>
          <span className="detail-label">Amount</span>

          <strong className="compact-amount">
            ₹{transaction.amount.toLocaleString("en-IN")}
          </strong>

          <span className="transaction-date">
            {transaction.date}
          </span>
        </div>

        <div className="compact-risk-box">
          <span className="detail-label">Risk Score</span>

          <strong className="compact-risk-score">
            {totalScore}
            <small>/100</small>
          </strong>

          <span className={`risk-badge ${getRiskClass()}`}>
            {riskBand}
          </span>
        </div>

      </section>


      {/* =================================================
          STATUS
      ================================================= */}

      <div className="detail-status-row">
        <span className="detail-label">Status</span>
        <span className="status-text">{transaction.status}</span>
      </div>


      {/* =================================================
          RISK SIGNAL BREAKDOWN
      ================================================= */}

      <section className="compact-detail-section">

        <div className="compact-section-heading">
          <h3>Risk Signal Breakdown</h3>
          <p>Detection engine results</p>
        </div>

        <div className="compact-signal-card">
          <div className="compact-signal-header">
            <div>
              <span className="signal-code">AF</span>
              <strong>Adaptive Friction</strong>
            </div>
            <strong>{detail.adaptiveFriction}/100</strong>
          </div>
          <div className="score-bar">
            <div
              className="score-fill"
              style={{ width: `${detail.adaptiveFriction}%` }}
            />
          </div>
        </div>

        <div className="compact-signal-card">
          <div className="compact-signal-header">
            <div>
              <span className="signal-code">FF</span>
              <strong>Fund Flow</strong>
            </div>
            <strong>{detail.fundFlow}/100</strong>
          </div>
          <div className="score-bar">
            <div
              className="score-fill"
              style={{ width: `${detail.fundFlow}%` }}
            />
          </div>
        </div>

        <div className="compact-signal-card">
          <div className="compact-signal-header">
            <div>
              <span className="signal-code">PH</span>
              <strong>Phishing</strong>
            </div>
            <strong>{detail.phishing}/100</strong>
          </div>
          <div className="score-bar">
            <div
              className="score-fill"
              style={{ width: `${detail.phishing}%` }}
            />
          </div>
        </div>

      </section>


      {/* =================================================
          ALERTS
      ================================================= */}

      <section className="compact-detail-section">

        <div className="compact-section-heading">
          <h3>Alerts</h3>
        </div>

        <div className="compact-alerts-list">
          {detail.alerts.map((alert, index) => (
            <div className="compact-alert-item" key={index}>
              <span>⚠</span>
              <p>{alert}</p>
            </div>
          ))}
        </div>

      </section>


      {/* =================================================
          EXPLANATION
      ================================================= */}

      <section className="compact-detail-section">

        <div className="compact-section-heading">
          <h3>Explanation</h3>
        </div>

        <p className="compact-explanation">
          {detail.explanation}
        </p>

      </section>


      {/* =================================================
          FUND FLOW
      ================================================= */}

      <section className="compact-detail-section">

        <div className="compact-section-heading">
          <h3>Fund Flow</h3>
          <p>Transaction movement</p>
        </div>

        <div className="compact-flow">
          {detail.flow.map((node, index) => (
            <div className="compact-flow-item" key={node.value}>

              <div className="compact-flow-node">
                <span>{node.name}</span>
                <strong>{node.value}</strong>
              </div>

              {index < detail.flow.length - 1 && (
                <div className="compact-flow-arrow">↓</div>
              )}

            </div>
          ))}
        </div>

      </section>


      {/* =================================================
          ADMIN ACTIONS
      ================================================= */}

      {role === "admin" && (

        <section className="compact-detail-actions">

          <button
            className="secondary-action compact-action"
            onClick={() => setShowEdit(true)}
          >
            Edit
          </button>

          <button
            className="secondary-action compact-action"
            onClick={downloadTransaction}
          >
            ↓ JSON
          </button>

          <button
            className="primary-action compact-action"
            onClick={generateSTR}
          >
            STR
          </button>

        </section>

      )}


      {/* =================================================
          EDIT TRANSACTION MODAL
      ================================================= */}

      {showEdit && (

        <div
          className="modal-overlay edit-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >

          <div
            className="settings-modal edit-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >

            <div className="settings-header">
              <div>
                <span className="str-small-label">TRANSACTION UPDATE</span>
                <h2>Edit Transaction</h2>
              </div>
              <button onClick={closeEdit} aria-label="Close edit">×</button>
            </div>

            <div className="edit-form">

              <label>Transaction ID</label>
              <input value={transaction.id} readOnly />

              <label>Amount</label>
              <input defaultValue={transaction.amount} type="number" />

              <p className="edit-warning">
                Risk score is calculated by the detection engine and cannot
                be directly edited.
              </p>

            </div>

            <div className="edit-actions">
              <button className="secondary-action" onClick={closeEdit}>
                Cancel
              </button>
              <button
                className="primary-action"
                onClick={() => {
                  alert("Transaction update will be sent to the backend.");
                  closeEdit();
                }}
              >
                Save Changes
              </button>
            </div>

          </div>

        </div>

      )}


      {/* =================================================
          STR MODAL – with PDF download + translation
      ================================================= */}

      {showSTR && (
        <STRModal
          transaction={transaction}
          detail={detail}
          totalScore={totalScore}
          riskBand={riskBand}
          getRiskClass={getRiskClass}
          onClose={closeSTR}
        />
      )}

    </div>

  );
}


// =====================================================
// STR MODAL (extracted for cleanliness)
// =====================================================

function STRModal({
  transaction,
  detail,
  totalScore,
  riskBand,
  getRiskClass,
  onClose,
}) {

  const [lang,           setLang]           = useState("en");
  const [translating,    setTranslating]    = useState(false);
  const [translatedText, setTranslatedText] = useState(null);
  const [pdfLoading,     setPdfLoading]     = useState(false);
  const prevLangRef = useRef("en");


  // ---------------------------------------------------
  // STRINGS TO TRANSLATE
  // ---------------------------------------------------

  const ORIGINAL_STRINGS = {
    heading:     "Suspicious Transaction Report",
    sectionTxn:  "Transaction Information",
    sectionSignals: "Risk Signal Evidence",
    sectionEvidence: "Supporting Evidence",
    sectionExpl: "Investigation Explanation",
    generated:   "Report generated by UFDE",
    labelId:     "Transaction ID",
    labelAmount: "Amount",
    labelScore:  "Risk Score",
    labelBand:   "Risk Band",
    labelDate:   "Transaction Date",
    labelAction: "Recommended Action",
    actionValue: riskBand === "Critical" || riskBand === "High"
      ? "Further Investigation"
      : "Continue Monitoring",
    explanation: detail.explanation,
    alerts:      detail.alerts,
  };


  // ---------------------------------------------------
  // RUN TRANSLATION WHEN LANGUAGE CHANGES
  // ---------------------------------------------------

  useEffect(() => {
    if (lang === prevLangRef.current) return;
    prevLangRef.current = lang;

    if (lang === "en") {
      setTranslatedText(null);
      return;
    }

    setTranslating(true);

    const staticStrings = [
      ORIGINAL_STRINGS.heading,
      ORIGINAL_STRINGS.sectionTxn,
      ORIGINAL_STRINGS.sectionSignals,
      ORIGINAL_STRINGS.sectionEvidence,
      ORIGINAL_STRINGS.sectionExpl,
      ORIGINAL_STRINGS.generated,
      ORIGINAL_STRINGS.labelId,
      ORIGINAL_STRINGS.labelAmount,
      ORIGINAL_STRINGS.labelScore,
      ORIGINAL_STRINGS.labelBand,
      ORIGINAL_STRINGS.labelDate,
      ORIGINAL_STRINGS.labelAction,
      ORIGINAL_STRINGS.actionValue,
      ORIGINAL_STRINGS.explanation,
      ...ORIGINAL_STRINGS.alerts,
    ];

    translateBatch(staticStrings, lang)
      .then((results) => {

        const alertsStart = 14;
        setTranslatedText({
          heading:          results[0],
          sectionTxn:       results[1],
          sectionSignals:   results[2],
          sectionEvidence:  results[3],
          sectionExpl:      results[4],
          generated:        results[5],
          labelId:          results[6],
          labelAmount:      results[7],
          labelScore:       results[8],
          labelBand:        results[9],
          labelDate:        results[10],
          labelAction:      results[11],
          actionValue:      results[12],
          explanation:      results[13],
          alerts:           results.slice(alertsStart),
        });

        setTranslating(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);


  // Helper: resolved (translated or original) string
  function t(key) {
    if (translatedText && translatedText[key]) {
      return translatedText[key];
    }
    return ORIGINAL_STRINGS[key];
  }

  function tAlert(index) {
    if (translatedText?.alerts?.[index]) {
      return translatedText.alerts[index];
    }
    return ORIGINAL_STRINGS.alerts[index];
  }


  // ---------------------------------------------------
  // DOWNLOAD STR AS PDF  (jsPDF)
  // ---------------------------------------------------

  async function handleDownloadPdf() {
    setPdfLoading(true);

    try {
      const doc  = new jsPDF({ unit: "pt", format: "a4" });
      const PW   = doc.internal.pageSize.getWidth();
      const PH   = doc.internal.pageSize.getHeight();
      const ML   = 48;          // margin left
      const MR   = PW - 48;     // margin right
      const LW   = PW - 96;     // line width
      let   y    = 48;

      const COLOR_NAVY   = [23, 37, 84];
      const COLOR_PRIMARY = [37, 99, 235];
      const COLOR_MUTED  = [100, 116, 139];
      const COLOR_TEXT   = [15, 23, 42];
      const COLOR_BORDER = [226, 232, 240];

      /* -------- helpers -------- */

      function checkPage(needed = 28) {
        if (y + needed > PH - 60) {
          doc.addPage();
          y = 48;
        }
      }

      function drawRule(color = COLOR_BORDER) {
        checkPage(12);
        doc.setDrawColor(...color);
        doc.setLineWidth(0.5);
        doc.line(ML, y, MR, y);
        y += 10;
      }

      function heading1(text) {
        checkPage(32);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...COLOR_NAVY);
        const lines = doc.splitTextToSize(text, LW);
        doc.text(lines, ML, y);
        y += lines.length * 14 + 6;
      }

      function bodyText(text, color = COLOR_TEXT) {
        checkPage(20);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, LW);
        doc.text(lines, ML, y);
        y += lines.length * 12;
      }

      function labelValue(label, value) {
        checkPage(18);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...COLOR_MUTED);
        doc.text(label.toUpperCase(), ML, y);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...COLOR_TEXT);
        doc.text(String(value), ML + 140, y);
        y += 16;
      }

      function scoreRow(code, name, score) {
        checkPage(22);
        // badge
        doc.setFillColor(...COLOR_PRIMARY);
        doc.roundedRect(ML, y - 10, 22, 14, 3, 3, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text(code, ML + 4, y);

        // label
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...COLOR_TEXT);
        doc.text(name, ML + 28, y);

        // value
        doc.setFont("helvetica", "bold");
        doc.text(`${score}/100`, MR - 45, y);

        // progress bar track
        y += 5;
        const trackX = ML + 28;
        const trackW = LW - 28 - 50;
        doc.setFillColor(...COLOR_BORDER);
        doc.roundedRect(trackX, y, trackW, 5, 2, 2, "F");
        doc.setFillColor(...COLOR_PRIMARY);
        doc.roundedRect(trackX, y, (trackW * score) / 100, 5, 2, 2, "F");
        y += 14;
      }

      /* -------- HEADER -------- */

      doc.setFillColor(...COLOR_NAVY);
      doc.rect(0, 0, PW, 56, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text("UFDE", ML, 35);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("Unified Fraud Detection Engine", ML + 46, 35);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      const headingText = t("heading");
      doc.text(headingText, MR - doc.getTextWidth(headingText), 35);

      y = 76;

      /* -------- TRANSACTION INFO -------- */

      heading1(t("sectionTxn"));
      drawRule();

      labelValue(t("labelId"),     transaction.id);
      labelValue(t("labelAmount"), `INR ${transaction.amount.toLocaleString("en-IN")}`);
      labelValue(t("labelScore"),  `${totalScore} / 100`);
      labelValue(t("labelBand"),   riskBand);
      labelValue(t("labelDate"),   transaction.date);
      labelValue(t("labelAction"), t("actionValue"));
      y += 10;

      /* -------- RISK SIGNALS -------- */

      heading1(t("sectionSignals"));
      drawRule();

      scoreRow("AF", "Adaptive Friction", detail.adaptiveFriction);
      scoreRow("FF", "Fund Flow",         detail.fundFlow);
      scoreRow("PH", "Phishing",          detail.phishing);
      y += 10;

      /* -------- SUPPORTING EVIDENCE -------- */

      heading1(t("sectionEvidence"));
      drawRule();

      detail.alerts.forEach((_, i) => {
        checkPage(20);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...COLOR_TEXT);
        const bullet = `•  ${tAlert(i)}`;
        const lines  = doc.splitTextToSize(bullet, LW - 10);
        doc.text(lines, ML + 5, y);
        y += lines.length * 12 + 4;
      });
      y += 6;

      /* -------- EXPLANATION -------- */

      heading1(t("sectionExpl"));
      drawRule();
      bodyText(t("explanation"));
      y += 14;

      /* -------- FOOTER -------- */

      const now = new Date().toLocaleString("en-IN");
      doc.setDrawColor(...COLOR_BORDER);
      doc.setLineWidth(0.5);
      doc.line(ML, PH - 40, MR, PH - 40);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_MUTED);
      doc.text(`${t("generated")} — ${now}`, ML, PH - 25);
      doc.text(`Language: ${LANGUAGES.find(l => l.code === lang)?.label || "English"}`, MR - 150, PH - 25);

      /* -------- SAVE -------- */

      const dateStamp = new Date().toISOString().slice(0, 10);
      doc.save(`STR-${transaction.id}-${dateStamp}.pdf`);

    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF generation failed. Please try again.");
    }

    setPdfLoading(false);
  }


  // ---------------------------------------------------
  // RENDER STR MODAL
  // ---------------------------------------------------

  return (

    <div
      className="modal-overlay str-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >

      <div
        className="settings-modal str-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >


        {/* =========================================
            STR HEADER
        ========================================= */}

        <div className="settings-header str-header">

          <div>
            <span className="str-small-label">UFDE REPORT</span>
            <h2>{t("heading")}</h2>
          </div>

          <div className="str-header-controls">

            {/* LANGUAGE SELECTOR */}

            <div className="str-lang-wrap">
              <span className="str-lang-icon">🌐</span>
              <select
                className="str-lang-select"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                disabled={translating}
                aria-label="Report language"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="str-close-button"
              onClick={onClose}
              aria-label="Close STR"
            >
              ×
            </button>

          </div>

        </div>


        {/* Translation indicator */}

        {translating && (
          <div className="str-translating-bar">
            <span className="str-translating-spinner" />
            Translating report to{" "}
            {LANGUAGES.find(l => l.code === lang)?.label}…
          </div>
        )}


        {/* =========================================
            SCROLLABLE STR CONTENT
        ========================================= */}

        <div className="str-scroll-content">


          {/* TRANSACTION INFORMATION */}

          <div className="str-section">

            <h3>{t("sectionTxn")}</h3>

            <div className="str-info-grid">

              <div className="str-info-item">
                <span>{t("labelId")}</span>
                <strong>{transaction.id}</strong>
              </div>

              <div className="str-info-item">
                <span>{t("labelAmount")}</span>
                <strong>
                  ₹{transaction.amount.toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="str-info-item">
                <span>{t("labelScore")}</span>
                <strong>{totalScore} / 100</strong>
              </div>

              <div className="str-info-item">
                <span>{t("labelBand")}</span>
                <span className={`risk-badge ${getRiskClass()}`}>
                  {riskBand}
                </span>
              </div>

              <div className="str-info-item">
                <span>{t("labelDate")}</span>
                <strong>{transaction.date}</strong>
              </div>

              <div className="str-info-item">
                <span>{t("labelAction")}</span>
                <strong>{t("actionValue")}</strong>
              </div>

            </div>

          </div>


          {/* RISK SIGNAL EVIDENCE */}

          <div className="str-section">

            <h3>{t("sectionSignals")}</h3>

            <div className="str-signal-list">

              <div className="str-signal-row">
                <div>
                  <span className="str-signal-code">AF</span>
                  <strong>Adaptive Friction</strong>
                </div>
                <strong>{detail.adaptiveFriction} / 100</strong>
              </div>

              <div className="str-signal-row">
                <div>
                  <span className="str-signal-code">FF</span>
                  <strong>Fund Flow</strong>
                </div>
                <strong>{detail.fundFlow} / 100</strong>
              </div>

              <div className="str-signal-row">
                <div>
                  <span className="str-signal-code">PH</span>
                  <strong>Phishing</strong>
                </div>
                <strong>{detail.phishing} / 100</strong>
              </div>

            </div>

          </div>


          {/* SUPPORTING EVIDENCE */}

          <div className="str-section">

            <h3>{t("sectionEvidence")}</h3>

            <div className="str-evidence-list">
              {detail.alerts.map((_, index) => (
                <div className="str-evidence-item" key={index}>
                  <span>•</span>
                  <p>{tAlert(index)}</p>
                </div>
              ))}
            </div>

          </div>


          {/* EXPLANATION */}

          <div className="str-section">

            <h3>{t("sectionExpl")}</h3>

            <p className="str-explanation">
              {t("explanation")}
            </p>

          </div>


          {/* GENERATED INFO */}

          <div className="str-generated-info">
            <span>{t("generated")}</span>
            <span>{new Date().toLocaleString("en-IN")}</span>
          </div>


        </div>


        {/* =========================================
            STR FOOTER
        ========================================= */}

        <div className="str-footer">

          <button className="secondary-action" onClick={onClose}>
            Close
          </button>

          <button
            className={`primary-action str-pdf-button ${pdfLoading ? "str-pdf-loading" : ""}`}
            onClick={handleDownloadPdf}
            disabled={pdfLoading || translating}
          >
            {pdfLoading ? (
              <>
                <span className="str-translating-spinner" />
                Generating PDF…
              </>
            ) : (
              "↓ Download STR PDF"
            )}
          </button>

        </div>


      </div>

    </div>

  );
}


export default TransactionDetail;