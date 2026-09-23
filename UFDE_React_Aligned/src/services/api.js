const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export async function analyzeUnifiedFiles({ adaptiveFile, fundFlowFile, phishingFile }) {
  const formData = new FormData();
  formData.append("adaptiveFile", adaptiveFile);
  formData.append("fundFlowFile", fundFlowFile);
  formData.append("phishingFile", phishingFile);

  const response = await fetch(`${API_BASE_URL}/api/ingest/unified`, {
    method: "POST",
    body: formData,
  });

  let body;
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof body === "string"
        ? body
        : body?.message || body?.error || "Backend rejected the uploaded files.";
    throw new Error(message);
  }

  return body;
}
