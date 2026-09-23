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
  af: { code: "AF", title: "Adaptive Friction", description: "Adaptive Friction detection data", formatLabel: "JSON", accept: "application/json,.json", nativeType: "application/json" },
  ff: { code: "FF", title: "Fund Flow", description: "Fund Flow transaction data", formatLabel: "CSV", accept: "text/csv,.csv", nativeType: "text/csv" },
  ph: { code: "PH", title: "Phishing", description: "Phishing detection data", formatLabel: "JSON", accept: "application/json,.json", nativeType: "application/json" },
};

function Upload() {
  // "ocr"    = single image upload, auto-extracted into af/ff/ph
  // "manual" = three separate native-file buttons (original behavior)
  const [mode, setMode] = useState("ocr");

  const [files, setFiles] = useState({ af: null, ff: null, ph: null });
  const [recordCounts, setRecordCounts] = useState({ af: 0, ff: 0, ph: 0 });

  // --- OCR-mode state ---
  const [ocrStatus, setOcrStatus] = useState("idle"); // idle | processing | done
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState("");
  const [sourceFileName, setSourceFileName] = useState("");

  // --- Manual-mode state (per card) ---
  const [manualStatus, setManualStatus] = useState({ af: "idle", ff: "idle", ph: "idle" });
  const [manualErrors, setManualErrors] = useState({ af: "", ff: "", ph: "" });

  const [processing, setProcessing] = useState(false);
  const workerRef = useRef(null);

  const getWorker = useCallback(async () => {
    if (!workerRef.current) {
      workerRef.current = await createWorker("eng");
    }
    return workerRef.current;
  }, []);

  function resetAll() {
    setFiles({ af: null, ff: null, ph: null });
    setRecordCounts({ af: 0, ff: 0, ph: 0 });
    setOcrStatus("idle");
    setOcrProgress(0);
    setOcrError("");
    setSourceFileName("");
    setManualStatus({ af: "idle", ff: "idle", ph: "idle" });
    setManualErrors({ af: "", ff: "", ph: "" });
  }

  function switchMode(nextMode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    resetAll();
  }

  // ---------- OCR MODE: single image -> OCR once -> extract all 3 ----------
  async function handleOcrFileChange(file) {
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setOcrError("Unsupported file type. Use PNG, JPG, or WEBP.");
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
    setOcrProgress(0);
    setSourceFileName(file.name);

    const progressTimer = setInterval(() => {
      setOcrProgress((p) => (p >= 90 ? p : p + 10));
    }, 200);

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
      if (emptyModules.length) {
        const labels = emptyModules.map((t) => MODULE_META[t].title).join(", ");
        setOcrError(
          emptyModules.length === MODULE_TYPES.length
            ? "No records could be read from this image. Try a clearer photo."
            : `No records found for: ${labels}. The rest extracted fine.`
        );
      }
    } catch (err) {
      clearInterval(progressTimer);
      setOcrStatus("idle");
      setOcrProgress(0);
      setOcrError("OCR failed. Try a clearer image.");
      // eslint-disable-next-line no-console
      console.error("OCR error:", err);
    }
  }

  // ---------- MANUAL MODE: 3 separate native-file buttons, no OCR ----------
  function handleManualFileChange(type, file) {
    if (!file) return;

    const meta = MODULE_META[type];
    const looksRight =
      type === "ff"
        ? file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv"
        : file.name.toLowerCase().endsWith(".json") || file.type === "application/json";

    if (!looksRight) {
      setManualErrors((prev) => ({ ...prev, [type]: `Expected a ${meta.formatLabel} file.` }));
      setFiles((prev) => ({ ...prev, [type]: null }));
      setManualStatus((prev) => ({ ...prev, [type]: "idle" }));
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setManualErrors((prev) => ({ ...prev, [type]: `File too large (max ${MAX_FILE_MB}MB).` }));
      setFiles((prev) => ({ ...prev, [type]: null }));
      setManualStatus((prev) => ({ ...prev, [type]: "idle" }));
      return;
    }

    setManualErrors((prev) => ({ ...prev, [type]: "" }));
    setFiles((prev) => ({ ...prev, [type]: file })); // used as-is, no OCR
    setManualStatus((prev) => ({ ...prev, [type]: "done" }));
  }

  const canAnalyze = MODULE_TYPES.every((t) => files[t] !== null);

  if (processing) {
    return <Processing files={files} />;
  }

  return (
    <div className="upload-page">
      <header className="dashboard-header">
        <div>
          <h1>UFDE</h1>
          <p>Unified Fraud Detection Engine</p>
        </div>
        <button
          className="logout-button"
          onClick={() => {
            localStorage.removeItem("ufdeRole");
            window.location.reload();
          }}
        >
          Logout
        </button>
      </header>

      <main className="upload-container">
        <div className="upload-title">
          <h2>Upload Transaction Data</h2>
          <p>
            Choose one: upload a single image and let OCR extract all three
            data sets, or upload the AF/FF/Phishing files individually.
          </p>
        </div>

        {/*   MODE TOGGLE   */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <button
            className="analyze-button"
            style={{
              background: mode === "ocr" ? "#111" : "#e5e7eb",
              color: mode === "ocr" ? "#fff" : "#111",
            }}
            onClick={() => switchMode("ocr")}
          >
            Upload One Image (OCR)
          </button>
          <button
            className="analyze-button"
            style={{
              background: mode === "manual" ? "#111" : "#e5e7eb",
              color: mode === "manual" ? "#fff" : "#111",
            }}
            onClick={() => switchMode("manual")}
          >
            Upload Files Individually
          </button>
        </div>

        {mode === "ocr" ? (
          <>
            {/*   SINGLE SOURCE UPLOAD   */}
            <div className="file-card" style={{ marginBottom: "1.5rem" }}>
              <h3>Source Image</h3>
              <p>One image is used to populate all three modules below.</p>

              <label className="file-button">
                {ocrStatus === "processing" ? "Processing..." : "Choose Image"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={ocrStatus === "processing"}
                  onChange={(e) => handleOcrFileChange(e.target.files[0])}
                />
              </label>

              {ocrStatus === "processing" && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ height: "6px", width: "100%", borderRadius: "999px", backgroundColor: "#e5e7eb", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${ocrProgress}%`, backgroundColor: "#4f46e5", transition: "width 0.2s ease" }} />
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>Extracting text...</p>
                </div>
              )}

              {ocrStatus === "done" && sourceFileName && <p className="file-success">✓ {sourceFileName}</p>}
              {ocrError && <p className="file-error">{ocrError}</p>}
            </div>

            {/*   RESULT CARDS (read-only, from the one image)   */}
            <div className="upload-grid">
              {MODULE_TYPES.map((type) => (
                <ResultCard
                  key={type}
                  {...MODULE_META[type]}
                  file={files[type]}
                  status={ocrStatus}
                  recordCount={recordCounts[type]}
                />
              ))}
            </div>
          </>
        ) : (
          /*   MANUAL MODE: original 3 separate pickers   */
          <div className="upload-grid">
            {MODULE_TYPES.map((type) => (
              <UploadCard
                key={type}
                type={type}
                {...MODULE_META[type]}
                file={files[type]}
                status={manualStatus[type]}
                error={manualErrors[type]}
                onFileChange={handleManualFileChange}
              />
            ))}
          </div>
        )}

        <div className="upload-actions">
          <span>
            Status: <strong>{canAnalyze ? "Ready" : "Awaiting files"}</strong>
          </span>
          <button className="analyze-button" disabled={!canAnalyze} onClick={() => setProcessing(true)}>
            ANALYZE
          </button>
        </div>
      </main>
    </div>
  );
}

function ResultCard({ code, title, description, formatLabel, file, status, recordCount }) {
  const isReady = status === "done" && file;
  return (
    <div className="file-card">
      <div className="file-icon">{code}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="file-format">{formatLabel}</span>
      <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.5rem" }}>
        {status === "processing" ? "Waiting on OCR pass..." : status === "idle" ? "Populates once an image is uploaded above." : null}
      </p>
      {isReady && (
        <p className="file-success">
          ✓ {file.name} — {recordCount} record{recordCount === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

function UploadCard({ type, code, title, description, formatLabel, accept, file, status, error, onFileChange }) {
  return (
    <div className="file-card">
      <div className="file-icon">{code}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="file-format">{formatLabel}</span>

      <label className="file-button">
        Choose {formatLabel} File
        <input
          type="file"
          accept={accept}
          onChange={(e) => onFileChange(type, e.target.files[0])}
        />
      </label>

      {file && status === "done" && <p className="file-success">✓ {file.name}</p>}
      {error && <p className="file-error">{error}</p>}
    </div>
  );
}

export default Upload;
