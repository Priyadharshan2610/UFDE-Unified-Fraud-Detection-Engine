import { useState, useRef, useCallback } from "react";
import { createWorker } from "tesseract.js";
import "../App.css";
import Processing from "./Processing";
import {
  extractRecords,
  recordsToCSV,
  FF_COLUMN_ORDER,
  FF_COLUMN_LABELS,
} from "./Ocrextract";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_FILE_MB = 10;
const MODULE_TYPES = ["af", "ff", "ph"];

const OUTPUT_NAME = {
  af: (base) => `${base}_AdaptiveFriction.json`,
  ff: (base) => `${base}_FundFlow.csv`,
  ph: (base) => `${base}_Phishing.json`,
};

const MODULE_META = {
  af: { code: "AF", title: "Adaptive Friction", formatLabel: "JSON" },
  ff: { code: "FF", title: "Fund Flow", formatLabel: "CSV" },
  ph: { code: "PH", title: "Phishing", formatLabel: "JSON" },
};

function Upload({
  role,
  user,
  onLogout,
  onBack,
  onAnalyzeComplete,
}) {
  const [mode, setMode] = useState("manual"); // "manual" | "ocr"
  const [files, setFiles] = useState({ af: null, ff: null, ph: null });
  const [errors, setErrors] = useState({ af: "", ff: "", ph: "" });
  const [processing, setProcessing] = useState(false);

  // --- OCR-mode state ---
  const [ocrStatus, setOcrStatus] = useState("idle"); // idle | processing | done
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState("");
  const [sourceFileName, setSourceFileName] = useState("");
  const [recordCounts, setRecordCounts] = useState({ af: 0, ff: 0, ph: 0 });

  const workerRef = useRef(null);

  const getWorker = useCallback(async () => {
    if (!workerRef.current) {
      workerRef.current = await createWorker("eng");
    }
    return workerRef.current;
  }, []);

  function resetFiles() {
    setFiles({ af: null, ff: null, ph: null });
    setErrors({ af: "", ff: "", ph: "" });
    setOcrStatus("idle");
    setOcrProgress(0);
    setOcrError("");
    setSourceFileName("");
    setRecordCounts({ af: 0, ff: 0, ph: 0 });
  }

  function switchMode(nextMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    resetFiles();
  }

  /*
  =======================================================
  OCR FILE HANDLER (Image -> Tesseract -> AF/FF/PH Files)
  =======================================================
  */
  async function handleOcrFileChange(file) {
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setOcrError("Unsupported file type. Use PNG, JPG, or WEBP image.");
      setFiles({ af: null, ff: null, ph: null });
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setOcrError(`File too large (max ${MAX_FILE_MB}MB).`);
      setFiles({ af: null, ff: null, ph: null });
      return;
    }

    setOcrError("");
    setFiles({ af: null, ff: null, ph: null });
    setRecordCounts({ af: 0, ff: 0, ph: 0 });
    setOcrStatus("processing");
    setOcrProgress(10);
    setSourceFileName(file.name);

    const progressTimer = setInterval(() => {
      setOcrProgress((p) => (p >= 90 ? p : p + 10));
    }, 250);

    try {
      const worker = await getWorker();
      const { data } = await worker.recognize(file);
      clearInterval(progressTimer);

      const baseName = file.name.replace(/\.[^.]+$/, "");
      const text = data.text || "";

      const nextFiles = {};
      const nextCounts = {};

      for (const type of MODULE_TYPES) {
        const records = extractRecords(type, text);
        if (!records.length) continue;
        const outputName = OUTPUT_NAME[type](baseName);

        nextFiles[type] =
          type === "ff"
            ? new File([recordsToCSV(records, FF_COLUMN_ORDER, FF_COLUMN_LABELS)], outputName, { type: "text/csv" })
            : new File([JSON.stringify(records, null, 2)], outputName, { type: "application/json" });

        nextCounts[type] = records.length;
      }

      setFiles(nextFiles);
      setRecordCounts(nextCounts);
      setOcrStatus("done");
      setOcrProgress(100);

      const emptyModules = MODULE_TYPES.filter((t) => nextCounts[t] === 0);
      if (emptyModules.length === MODULE_TYPES.length) {
        setOcrError("No records could be extracted from this image. Please use a clearer image.");
      } else if (emptyModules.length > 0) {
        const labels = emptyModules.map((t) => MODULE_META[t].title).join(", ");
        setOcrError(`No records extracted for: ${labels}. The detected records are ready for analysis.`);
      }
    } catch (err) {
      clearInterval(progressTimer);
      setOcrStatus("idle");
      setOcrProgress(0);
      setOcrError("OCR parsing failed. Please check image clarity.");
      console.error("OCR error:", err);
    }
  }

  /*
  =======================================================
  FILE VALIDATION & MANUAL FILE SELECTION
  =======================================================
  */
  function validateFile(type, file) {
    if (!file) return "Please select a file.";
    const name = file.name.toLowerCase();

    if (type === "af" && !name.endsWith(".json")) {
      return "Adaptive Friction requires a JSON file.";
    }
    if (type === "ff" && !name.endsWith(".csv")) {
      return "Fund Flow requires a CSV file.";
    }
    if (type === "ph" && !name.endsWith(".json")) {
      return "Phishing requires a JSON file.";
    }

    return "";
  }

  function handleFileChange(type, file) {
    const error = validateFile(type, file);
    setErrors((prev) => ({ ...prev, [type]: error }));
    if (error) {
      setFiles((prev) => ({ ...prev, [type]: null }));
      return;
    }
    setFiles((prev) => ({ ...prev, [type]: file }));
  }

  /*
  =======================================================
  SAVE DOCUMENT INFO (localStorage for User role)
  =======================================================
  */
  function saveUploadedDocuments() {
    const existing = JSON.parse(
      localStorage.getItem("ufdeUploadedDocuments") || "[]"
    );

    const newDocs = [];
    if (files.af) newDocs.push({ type: "Adaptive Friction", fileName: files.af.name, uploadedBy: user?.name || role, role, uploadedAt: new Date().toISOString() });
    if (files.ff) newDocs.push({ type: "Fund Flow", fileName: files.ff.name, uploadedBy: user?.name || role, role, uploadedAt: new Date().toISOString() });
    if (files.ph) newDocs.push({ type: "Phishing", fileName: files.ph.name, uploadedBy: user?.name || role, role, uploadedAt: new Date().toISOString() });

    localStorage.setItem(
      "ufdeUploadedDocuments",
      JSON.stringify([...existing, ...newDocs])
    );
  }

  function handleAnalyze() {
    const hasAny = files.af || files.ff || files.ph;
    if (!hasAny) return;
    saveUploadedDocuments();
    setProcessing(true);
  }

  function handleLogout() {
    if (onLogout) { onLogout(); return; }
    localStorage.removeItem("ufdeRole");
    window.location.reload();
  }

  if (processing) {
    return (
      <Processing
        files={files}
        onComplete={() => {
          setProcessing(false);
          if (onAnalyzeComplete) onAnalyzeComplete();
          else if (onBack) onBack();
        }}
      />
    );
  }

  if (role === "user") {
    const uploadedDocuments = JSON.parse(
      localStorage.getItem("ufdeUploadedDocuments") || "[]"
    );

    return (
      <div className="upload-page">
        <header className="dashboard-header">
          <div className="header-left">
            <button className="upload-back-button" onClick={onBack}>←</button>
            <div>
              <h1>UFDE</h1>
              <p>Unified Fraud Detection Engine</p>
            </div>
          </div>
          <div className="header-actions">
            <span className="role-badge">USER</span>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <main className="upload-container">
          <div className="upload-title">
            <h2>Available Documents</h2>
            <p>Documents uploaded and analyzed by authorized users.</p>
          </div>

          {uploadedDocuments.length === 0 ? (
            <div className="no-documents-card">
              <div className="no-documents-icon">📄</div>
              <h3>No Documents Available</h3>
              <p>An Admin or Analyzer must upload documents before they appear here.</p>
            </div>
          ) : (
            <div className="documents-list">
              {uploadedDocuments.map((doc, index) => (
                <div className="document-card" key={`${doc.fileName}-${index}`}>
                  <div className="document-icon">📄</div>
                  <div className="document-info">
                    <h3>{doc.type}</h3>
                    <p>{doc.fileName}</p>
                    <small>Uploaded by: <strong>{doc.uploadedBy}</strong></small>
                  </div>
                  <div className="document-status">Available</div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  const selectedCount = [files.af, files.ff, files.ph].filter(Boolean).length;

  return (
    <div className="upload-page">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-left">
          <button className="upload-back-button" onClick={onBack}>←</button>
          <div>
            <h1>UFDE</h1>
            <p>Unified Fraud Detection Engine</p>
          </div>
        </div>
        <div className="header-actions">
          <span className="role-badge">{role === "admin" ? "ADMIN" : "ANALYZER"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* MAIN */}
      <main className="upload-container">
        <div className="upload-title">
          <h2>Upload Transaction Data</h2>
          <p>Choose an upload mode to provide detection data for fraud analysis.</p>
        </div>

        {/* MODE SELECTOR TABS */}
        <div className="upload-mode-selector" style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <button
            type="button"
            className={`secondary-action ${mode === "manual" ? "primary-action" : ""}`}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
              background: mode === "manual" ? "#1e3a8a" : "var(--card-bg, #ffffff)",
              color: mode === "manual" ? "#ffffff" : "var(--text-color, #1e293b)",
              border: "1px solid #cbd5e1",
            }}
            onClick={() => switchMode("manual")}
          >
            📁 Direct File Upload (JSON / CSV)
          </button>
          <button
            type="button"
            className={`secondary-action ${mode === "ocr" ? "primary-action" : ""}`}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
              background: mode === "ocr" ? "#1e3a8a" : "var(--card-bg, #ffffff)",
              color: mode === "ocr" ? "#ffffff" : "var(--text-color, #1e293b)",
              border: "1px solid #cbd5e1",
            }}
            onClick={() => switchMode("ocr")}
          >
            📷 Single Image (OCR Extraction)
          </button>
        </div>

        {/* OCR UPLOAD SECTION */}
        {mode === "ocr" && (
          <div className="ocr-upload-card" style={{
            background: "var(--card-bg, #ffffff)",
            border: "1px solid #cbd5e1",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
          }}>
            <h3>📷 OCR Image Scanner</h3>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "6px 0 16px 0" }}>
              Upload a single transaction image or screenshot (PNG, JPG, WEBP). Tesseract OCR will automatically extract Adaptive Friction, Fund Flow, and Phishing data.
            </p>

            <label className="file-button" style={{ display: "inline-block", padding: "12px 24px", cursor: "pointer" }}>
              {ocrStatus === "processing" ? "⏳ Scanning Image with OCR..." : "Choose Image File"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={ocrStatus === "processing"}
                onChange={(e) => handleOcrFileChange(e.target.files[0])}
                style={{ display: "none" }}
              />
            </label>

            {ocrStatus === "processing" && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ fontSize: "13px", fontWeight: 600 }}>Extracting OCR Data ({ocrProgress}%)...</p>
                <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden", marginTop: "6px" }}>
                  <div style={{ width: `${ocrProgress}%`, height: "100%", background: "#2563eb", transition: "width 0.3s ease" }} />
                </div>
              </div>
            )}

            {ocrStatus === "done" && sourceFileName && (
              <div style={{ marginTop: "16px", background: "#f0fdf4", border: "1px solid #86efac", padding: "12px", borderRadius: "8px" }}>
                <p style={{ color: "#166534", fontWeight: 600, margin: 0 }}>✓ Successfully extracted data from {sourceFileName}:</p>
                <ul style={{ margin: "8px 0 0 18px", padding: 0, fontSize: "13px", color: "#15803d" }}>
                  <li>Adaptive Friction (JSON): <strong>{recordCounts.af} records</strong></li>
                  <li>Fund Flow (CSV): <strong>{recordCounts.ff} records</strong></li>
                  <li>Phishing (JSON): <strong>{recordCounts.ph} records</strong></li>
                </ul>
              </div>
            )}

            {ocrError && (
              <p style={{ color: "#dc2626", marginTop: "12px", fontSize: "13px", fontWeight: 600 }}>{ocrError}</p>
            )}
          </div>
        )}

        {/* DIRECT FILE UPLOAD GRID */}
        <div className="upload-grid">
          {/* Adaptive Friction */}
          <div className="file-card">
            <div className="file-icon">AF</div>
            <h3>Adaptive Friction</h3>
            <p>Upload adaptive friction detection data.</p>
            <span className="file-format">JSON</span>

            <label className="file-button">
              Select JSON File
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => handleFileChange("af", e.target.files[0])}
              />
            </label>

            {files.af && <p className="file-success">✓ {files.af.name}</p>}
            {errors.af && <p className="file-error">{errors.af}</p>}
          </div>

          {/* Fund Flow */}
          <div className="file-card">
            <div className="file-icon">FF</div>
            <h3>Fund Flow</h3>
            <p>Upload transaction fund-flow data.</p>
            <span className="file-format">CSV</span>

            <label className="file-button">
              Select CSV File
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => handleFileChange("ff", e.target.files[0])}
              />
            </label>

            {files.ff && <p className="file-success">✓ {files.ff.name}</p>}
            {errors.ff && <p className="file-error">{errors.ff}</p>}
          </div>

          {/* Phishing */}
          <div className="file-card">
            <div className="file-icon">PH</div>
            <h3>Phishing</h3>
            <p>Upload phishing detection data.</p>
            <span className="file-format">JSON</span>

            <label className="file-button">
              Select JSON File
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => handleFileChange("ph", e.target.files[0])}
              />
            </label>

            {files.ph && <p className="file-success">✓ {files.ph.name}</p>}
            {errors.ph && <p className="file-error">{errors.ph}</p>}
          </div>
        </div>

        {/* ANALYZE BUTTON */}
        <div className="upload-actions">
          <div>
            <strong>Files ready for analysis: {selectedCount} / 3</strong>
            <p>Select or extract at least one file to run fraud analysis.</p>
          </div>

          <button
            className="analyze-button"
            disabled={selectedCount === 0}
            onClick={handleAnalyze}
          >
            ANALYZE DATA
          </button>
        </div>
      </main>
    </div>
  );
}

export default Upload;
