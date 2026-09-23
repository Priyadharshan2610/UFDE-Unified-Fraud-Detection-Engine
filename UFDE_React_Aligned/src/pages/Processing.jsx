import { useEffect, useState, useRef } from "react";
import "../App.css";

const ANALYZE_URL = import.meta.env.VITE_ANALYZE_URL || "/api/ingest/unified";

const STEPS = [
  { key: "uploading", label: "Files uploaded" },
  { key: "validating", label: "Validating files" },
  { key: "engines", label: "Running fraud detection engines" },
  { key: "risk", label: "Calculating unified risk" },
  { key: "results", label: "Preparing results" },
];

function Processing({ files, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    async function run() {
      if (!files?.af && !files?.ff && !files?.ph) {
        setError("No files selected for analysis. Please upload at least one file (AF, Fund Flow, or Phishing).");
        return;
      }

      setStepIndex(0);

      const formData = new FormData();
      if (files?.af) {
        formData.append("adaptiveFile", files.af);
        formData.append("af", files.af);
      }
      if (files?.ff) {
        formData.append("fundFlowFile", files.ff);
        formData.append("ff", files.ff);
      }
      if (files?.ph) {
        formData.append("phishingFile", files.ph);
        formData.append("ph", files.ph);
      }

      try {
        setStepIndex(1);

        const response = await fetch(ANALYZE_URL, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }

        setStepIndex(2);
        const result = await response.json().catch(() => null);

        setStepIndex(3);
        setStepIndex(4);

        window.dispatchEvent(
          new CustomEvent("ufde-transaction-created", {
            detail: result,
          })
        );

        setComplete(true);
        if (onComplete) {
          onComplete(result);
        }
      } catch (err) {
        console.error("Analyze request failed:", err);
        setError(
          err.message === "Failed to fetch"
            ? "Couldn't reach the analysis server. Is the backend running on port 8080?"
            : `Analysis failed: ${err.message}`
        );
      }
    }

    run();
  }, [files, onComplete]);

  if (complete) {
    return null; // onComplete already navigated away
  }

  if (error) {
    return (
      <div className="processing-page">
        <div className="processing-card">
          <h1>Analysis Failed</h1>
          <p className="processing-subtitle">{error}</p>
          <button
            className="analyze-button"
            style={{ marginTop: "1.5rem" }}
            onClick={() => {
              if (onComplete) onComplete(null);
              else window.location.reload();
            }}
          >
            ← Back to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="processing-page">
      <div className="processing-card">
        <div className="processing-spinner"></div>

        <h1>Analyzing Transaction Data</h1>

        <p className="processing-subtitle">
          Please wait while UFDE processes your files.
        </p>

        <div className="processing-steps">
          {STEPS.map((step, i) => (
            <div
              key={step.key}
              className={`processing-step ${
                i < stepIndex ? "completed" : i === stepIndex ? "active" : ""
              }`}
            >
              <span>{i < stepIndex ? "✓" : i === stepIndex ? "●" : "○"}</span>
              <p>{step.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Processing;
