import { useEffect, useState, useRef } from "react";
import "../App.css";
import Transactions from "./Transactions";

// TODO: point this at your friend's real backend endpoint once it's up.
// Can also be set via a .env file as VITE_ANALYZE_URL=http://localhost:8000/analyze
const ANALYZE_URL = import.meta.env.VITE_ANALYZE_URL || "http://localhost:8000/analyze";

const STEPS = [
  { key: "uploading", label: "Files uploaded" },
  { key: "validating", label: "Validating files" },
  { key: "engines", label: "Running fraud detection engines" },
  { key: "risk", label: "Calculating unified risk" },
  { key: "results", label: "Preparing results" },
];

function Processing({ files }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode / re-render double-firing the upload.
    if (startedRef.current) return;
    startedRef.current = true;

    async function run() {
      if (!files?.af || !files?.ff || !files?.ph) {
        setError("Missing one or more files (AF / FF / Phishing). Go back and re-upload.");
        return;
      }

      setStepIndex(0); // "Files uploaded" — about to send them

      const formData = new FormData();
      // Three SEPARATE fields, not one bundled payload.
      formData.append("af", files.af);
      formData.append("ff", files.ff);
      formData.append("ph", files.ph);

      try {
        setStepIndex(1); // Validating

        const response = await fetch(ANALYZE_URL, {
          method: "POST",
          body: formData,
          // Do NOT set Content-Type manually — the browser sets the
          // correct multipart boundary automatically for FormData.
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        setStepIndex(2); // Running fraud detection engines
        await response.json().catch(() => null); // consume body if backend returns one

        setStepIndex(3); // Calculating unified risk
        setStepIndex(4); // Preparing results

        setComplete(true);
      } catch (err) {
        console.error("Analyze request failed:", err);
        setError(
          err.message === "Failed to fetch"
            ? "Couldn't reach the analysis server. Is the backend running?"
            : `Analysis failed: ${err.message}`
        );
      }
    }

    run();
  }, [files]);

  if (complete) {
    return <Transactions />;
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
            onClick={() => window.location.reload()}
          >
            Back to Upload
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
