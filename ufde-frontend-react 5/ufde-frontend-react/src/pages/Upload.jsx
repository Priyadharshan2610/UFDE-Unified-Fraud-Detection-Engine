import { useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import "../App.css";
import Processing from "./Processing";


// =====================================================
// UPLOAD PAGE
// =====================================================

function Upload({
  role,
  user,
  onLogout,
  onBack,
}) {

  /*
  =======================================================
  ACTIVE TAB  ("files" | "ocr")
  =======================================================
  */

  const [activeTab, setActiveTab] = useState("files");


  /*
  =======================================================
  FILE UPLOAD STATE
  =======================================================
  */

  const [files, setFiles] = useState({
    af: null,
    ff: null,
    ph: null,
  });

  const [errors, setErrors] = useState({
    af: "",
    ff: "",
    ph: "",
  });

  const [processing, setProcessing] =
    useState(false);


  /*
  =======================================================
  OCR STATE
  =======================================================
  */

  const [ocrFile, setOcrFile] = useState(null);
  const [ocrDragging, setOcrDragging] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("idle"); // idle | running | done | error
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrText, setOcrText] = useState("");
  const [ocrError, setOcrError] = useState("");
  const [ocrCopied, setOcrCopied] = useState(false);
  const ocrInputRef = useRef(null);


  /*
  =======================================================
  FILE NAME NORMALIZATION
  =======================================================
  */

  function normalizeFileName(fileName) {
    return fileName
      .toLowerCase()
      .replace(/[\s_-]/g, "");
  }


  /*
  =======================================================
  FILE VALIDATION
  =======================================================
  */

  function validateFile(type, file) {

    if (!file) {
      return "Please select a file.";
    }

    const normalized =
      normalizeFileName(file.name);

    if (type === "af") {
      if (
        !normalized.includes("adaptivefriction") ||
        !file.name.toLowerCase().endsWith(".json")
      ) {
        return "Please upload the Adaptive Friction JSON file.";
      }
    }

    if (type === "ff") {
      if (
        !normalized.includes("fundflow") ||
        !file.name.toLowerCase().endsWith(".csv")
      ) {
        return "Please upload the Fund Flow CSV file.";
      }
    }

    if (type === "ph") {
      if (
        !normalized.includes("phishing") ||
        !file.name.toLowerCase().endsWith(".json")
      ) {
        return "Please upload the Phishing JSON file.";
      }
    }

    return "";
  }


  /*
  =======================================================
  FILE CHANGE
  =======================================================
  */

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
  SAVE DOCUMENT INFORMATION
  =======================================================
  */

  function saveUploadedDocuments() {
    const existing = JSON.parse(
      localStorage.getItem("ufdeUploadedDocuments") || "[]"
    );

    const newDocs = [];

    if (files.af) {
      newDocs.push({
        type: "Adaptive Friction",
        fileName: files.af.name,
        uploadedBy: user?.name || role,
        role,
        uploadedAt: new Date().toISOString(),
      });
    }

    if (files.ff) {
      newDocs.push({
        type: "Fund Flow",
        fileName: files.ff.name,
        uploadedBy: user?.name || role,
        role,
        uploadedAt: new Date().toISOString(),
      });
    }

    if (files.ph) {
      newDocs.push({
        type: "Phishing",
        fileName: files.ph.name,
        uploadedBy: user?.name || role,
        role,
        uploadedAt: new Date().toISOString(),
      });
    }

    localStorage.setItem(
      "ufdeUploadedDocuments",
      JSON.stringify([...existing, ...newDocs])
    );
  }


  /*
  =======================================================
  ANALYZE
  =======================================================
  */

  function handleAnalyze() {
    const selectedCount = [files.af, files.ff, files.ph].filter(Boolean).length;
    if (selectedCount === 0) return;
    saveUploadedDocuments();
    setProcessing(true);
  }


  /*
  =======================================================
  LOGOUT
  =======================================================
  */

  function handleLogout() {
    if (onLogout) {
      onLogout();
      return;
    }
    localStorage.removeItem("ufdeRole");
    window.location.reload();
  }


  /*
  =======================================================
  OCR – HANDLE IMAGE FILE (drag or click)
  =======================================================
  */

  function acceptOcrFile(file) {
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/bmp"];
    if (!allowed.includes(file.type)) {
      setOcrError("Please select a PNG, JPG, WEBP, or BMP image file.");
      return;
    }

    setOcrFile(file);
    setOcrText("");
    setOcrError("");
    setOcrStatus("idle");
    setOcrProgress(0);
    setOcrCopied(false);
  }

  function handleOcrDrop(event) {
    event.preventDefault();
    setOcrDragging(false);
    const file = event.dataTransfer.files[0];
    acceptOcrFile(file);
  }

  function handleOcrDragOver(event) {
    event.preventDefault();
    setOcrDragging(true);
  }

  function handleOcrDragLeave() {
    setOcrDragging(false);
  }


  /*
  =======================================================
  OCR – RUN TESSERACT
  =======================================================
  */

  async function handleRunOcr() {
    if (!ocrFile) return;

    setOcrStatus("running");
    setOcrProgress(0);
    setOcrText("");
    setOcrError("");

    try {
      const worker = await createWorker("eng", 1, {
        logger: (info) => {
          if (
            info.status === "recognizing text" &&
            typeof info.progress === "number"
          ) {
            setOcrProgress(Math.round(info.progress * 100));
          }
        },
      });

      const { data } = await worker.recognize(ocrFile);
      await worker.terminate();

      setOcrText(data.text.trim());
      setOcrProgress(100);
      setOcrStatus("done");

    } catch {
      setOcrStatus("error");
      setOcrError("OCR failed. Please try a clearer image.");
    }
  }


  /*
  =======================================================
  OCR – COPY TEXT
  =======================================================
  */

  async function handleCopyText() {
    if (!ocrText) return;
    try {
      await navigator.clipboard.writeText(ocrText);
      setOcrCopied(true);
      setTimeout(() => setOcrCopied(false), 2500);
    } catch {
      // fallback
    }
  }


  /*
  =======================================================
  OCR – CLEAR
  =======================================================
  */

  function handleClearOcr() {
    setOcrFile(null);
    setOcrText("");
    setOcrError("");
    setOcrStatus("idle");
    setOcrProgress(0);
    setOcrCopied(false);
    if (ocrInputRef.current) {
      ocrInputRef.current.value = "";
    }
  }


  /*
  =======================================================
  PROCESSING SCREEN
  =======================================================
  */

  if (processing) {
    return <Processing />;
  }


  /*
  =======================================================
  USER DOCUMENT VIEW
  =======================================================
  */

  if (role === "user") {
    const uploadedDocuments = JSON.parse(
      localStorage.getItem("ufdeUploadedDocuments") || "[]"
    );

    return (

      <div className="upload-page">

        <header className="dashboard-header">

          <div className="header-left">

            <button
              className="upload-back-button"
              onClick={onBack}
            >
              ←
            </button>

            <div>
              <h1>UFDE</h1>
              <p>Unified Fraud Detection Engine</p>
            </div>

          </div>

          <div className="header-actions">
            <span className="role-badge">USER</span>
            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
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
              <p>
                An Admin or Analyzer must upload documents before they
                become available here.
              </p>
            </div>

          ) : (

            <div className="documents-list">
              {uploadedDocuments.map((document, index) => (
                <div
                  className="document-card"
                  key={`${document.fileName}-${index}`}
                >
                  <div className="document-icon">📄</div>

                  <div className="document-info">
                    <h3>{document.type}</h3>
                    <p>{document.fileName}</p>
                    <small>
                      Uploaded by:{" "}
                      <strong>{document.uploadedBy}</strong>
                    </small>
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


  /*
  =======================================================
  ADMIN / ANALYZER UPLOAD PAGE
  =======================================================
  */

  return (

    <div className="upload-page">

      {/* Header */}

      <header className="dashboard-header">

        <div className="header-left">

          <button
            className="upload-back-button"
            onClick={onBack}
          >
            ←
          </button>

          <div>
            <h1>UFDE</h1>
            <p>Unified Fraud Detection Engine</p>
          </div>

        </div>

        <div className="header-actions">

          <span className="role-badge">
            {role === "admin" ? "ADMIN" : "ANALYZER"}
          </span>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* Main */}

      <main className="upload-container">

        <div className="upload-title">
          <h2>Upload & Scan</h2>
          <p>
            Upload detection engine data sources or extract text from
            document images using OCR.
          </p>
        </div>


        {/* ===============================================
            TABS
        =============================================== */}

        <div className="upload-tabs">

          <button
            className={`upload-tab ${activeTab === "files" ? "upload-tab-active" : ""}`}
            onClick={() => setActiveTab("files")}
          >
            📁 Upload Files
          </button>

          <button
            className={`upload-tab ${activeTab === "ocr" ? "upload-tab-active" : ""}`}
            onClick={() => setActiveTab("ocr")}
          >
            🔍 OCR Scan
          </button>

        </div>


        {/* ===============================================
            TAB: FILE UPLOAD
        =============================================== */}

        {activeTab === "files" && (

          <>

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
                    accept=".json"
                    onChange={(e) =>
                      handleFileChange("af", e.target.files[0])
                    }
                  />
                </label>

                {files.af && (
                  <p className="file-success">✓ {files.af.name}</p>
                )}
                {errors.af && (
                  <p className="file-error">{errors.af}</p>
                )}
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
                    accept=".csv"
                    onChange={(e) =>
                      handleFileChange("ff", e.target.files[0])
                    }
                  />
                </label>

                {files.ff && (
                  <p className="file-success">✓ {files.ff.name}</p>
                )}
                {errors.ff && (
                  <p className="file-error">{errors.ff}</p>
                )}
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
                    accept=".json"
                    onChange={(e) =>
                      handleFileChange("ph", e.target.files[0])
                    }
                  />
                </label>

                {files.ph && (
                  <p className="file-success">✓ {files.ph.name}</p>
                )}
                {errors.ph && (
                  <p className="file-error">{errors.ph}</p>
                )}
              </div>

            </div>


            {/* Analyze */}

            <div className="upload-actions">

              <div>
                <strong>
                  Files selected:{" "}
                  {[files.af, files.ff, files.ph].filter(Boolean).length}
                  {" / 3"}
                </strong>
                <p>Select at least one file to analyze.</p>
              </div>

              <button
                className="analyze-button"
                disabled={!files.af && !files.ff && !files.ph}
                onClick={handleAnalyze}
              >
                ANALYZE DATA
              </button>

            </div>

          </>

        )}


        {/* ===============================================
            TAB: OCR SCAN
        =============================================== */}

        {activeTab === "ocr" && (

          <div className="ocr-panel">

            <div className="ocr-info-banner">
              <span className="ocr-info-icon">🔍</span>
              <div>
                <strong>OCR — Optical Character Recognition</strong>
                <p>
                  Upload an image of a document (cheque, bank statement,
                  screenshot) to extract text automatically. Runs fully
                  in-browser — no data is sent to any external server.
                </p>
              </div>
            </div>


            {/* Drop Zone */}

            <div
              className={`ocr-drop-zone ${ocrDragging ? "ocr-dragging" : ""} ${ocrFile ? "ocr-has-file" : ""}`}
              onDrop={handleOcrDrop}
              onDragOver={handleOcrDragOver}
              onDragLeave={handleOcrDragLeave}
              onClick={() => !ocrFile && ocrInputRef.current?.click()}
            >

              <input
                ref={ocrInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp"
                style={{ display: "none" }}
                onChange={(e) => acceptOcrFile(e.target.files[0])}
              />

              {!ocrFile ? (

                <div className="ocr-drop-placeholder">
                  <div className="ocr-drop-icon">🖼️</div>
                  <p className="ocr-drop-title">
                    Drag & drop an image here
                  </p>
                  <p className="ocr-drop-sub">
                    or click to browse — PNG, JPG, WEBP, BMP
                  </p>
                </div>

              ) : (

                <div className="ocr-file-preview">

                  <img
                    src={URL.createObjectURL(ocrFile)}
                    alt="Preview"
                    className="ocr-preview-image"
                  />

                  <div className="ocr-file-info">
                    <span className="ocr-file-name">
                      📄 {ocrFile.name}
                    </span>
                    <span className="ocr-file-size">
                      {(ocrFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>

                </div>

              )}

            </div>


            {/* OCR Actions */}

            <div className="ocr-actions-row">

              <button
                className="ocr-run-button"
                disabled={!ocrFile || ocrStatus === "running"}
                onClick={handleRunOcr}
              >
                {ocrStatus === "running" ? (
                  <>
                    <span className="ocr-spinner" />
                    Scanning…
                  </>
                ) : (
                  "🔍 Extract Text"
                )}
              </button>

              {ocrFile && (
                <button
                  className="ocr-clear-button"
                  onClick={handleClearOcr}
                  disabled={ocrStatus === "running"}
                >
                  ✕ Clear
                </button>
              )}

            </div>


            {/* Progress Bar */}

            {ocrStatus === "running" && (

              <div className="ocr-progress-wrap">

                <div className="ocr-progress-bar-track">
                  <div
                    className="ocr-progress-bar-fill"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>

                <span className="ocr-progress-label">
                  {ocrProgress}%
                </span>

              </div>

            )}


            {/* Error */}

            {ocrStatus === "error" && (
              <div className="ocr-error-box">
                ⚠ {ocrError}
              </div>
            )}


            {/* Result */}

            {ocrStatus === "done" && ocrText && (

              <div className="ocr-result-panel">

                <div className="ocr-result-header">

                  <div>
                    <h3 className="ocr-result-title">
                      Extracted Text
                    </h3>
                    <span className="ocr-result-chars">
                      {ocrText.length} characters extracted
                    </span>
                  </div>

                  <button
                    className={`ocr-copy-button ${ocrCopied ? "ocr-copy-copied" : ""}`}
                    onClick={handleCopyText}
                  >
                    {ocrCopied ? "✓ Copied!" : "📋 Copy"}
                  </button>

                </div>

                <textarea
                  className="ocr-result-textarea"
                  value={ocrText}
                  readOnly
                  rows={14}
                />

              </div>

            )}


            {ocrStatus === "done" && !ocrText && (
              <div className="ocr-empty-result">
                <span>🔎</span>
                <p>No text detected. Try a higher quality or clearer image.</p>
              </div>
            )}

          </div>

        )}

      </main>

    </div>

  );
}

export default Upload;