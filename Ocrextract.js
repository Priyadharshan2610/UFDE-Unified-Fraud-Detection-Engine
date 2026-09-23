// Ocrextract.js
//
// Called once per module from a single OCR text block:
//   extractRecords("af", text)
//   extractRecords("ff", text)
//   extractRecords("ph", text)
//
// Each call searches the FULL text for that module's records — it does
// NOT assume the text is pre-split into sections. This is a generic
// "Label: value" line parser as a placeholder until you drop in the
// real field schema per module (see MODULE_FIELD_HINTS below).

// Keywords used to recognize where a module's block starts in the text,
// and which fields to prioritize when parsing it. Adjust these once you
// know exactly how your source images are laid out.
const MODULE_FIELD_HINTS = {
  af: {
    sectionHeader: /adaptive\s*friction/i,
    idKeys: ["TransactionId", "RecordId", "Id"],
  },
  ff: {
    sectionHeader: /fund\s*flow/i,
    idKeys: ["TransactionId", "RecordId", "Id"],
  },
  ph: {
    sectionHeader: /phishing/i,
    idKeys: ["TransactionId", "RecordId", "Id", "Url"],
  },
};

// Column order + display labels for the Fund Flow CSV. Edit this once
// you know your real FF schema; recordsToCSV falls back to whatever
// keys actually exist on each record if a listed column is missing.
export const FF_COLUMN_ORDER = [
  "TransactionId",
  "RecordId",
  "Currency",
  "InDegree",
  "OutDegree",
  "RemainingBalance",
  "TotalSent",
  "HoldingMinutes",
];

export const FF_COLUMN_LABELS = {
  TransactionId: "Transaction ID",
  RecordId: "Record ID",
  Currency: "Currency",
  InDegree: "In Degree",
  OutDegree: "Out Degree",
  RemainingBalance: "Remaining Balance",
  TotalSent: "Total Sent",
  HoldingMinutes: "Holding Minutes",
};

/**
 * Pulls out the slice of `text` relevant to `type`, using its section
 * header if one is present in the image. If no header is found, falls
 * back to scanning the whole text (useful for images that only ever
 * contain one module's data with no explicit header).
 */
function isolateModuleText(type, text) {
  const hint = MODULE_FIELD_HINTS[type];
  if (!hint) return text;

  const lines = text.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => hint.sectionHeader.test(line));

  if (headerIndex === -1) {
    return text; // no explicit header — scan everything
  }

  // Grab everything from this module's header up to the next module's
  // header (or end of text), whichever comes first.
  const otherHeaders = Object.entries(MODULE_FIELD_HINTS)
    .filter(([key]) => key !== type)
    .map(([, h]) => h.sectionHeader);

  let endIndex = lines.length;
  for (let i = headerIndex + 1; i < lines.length; i++) {
    if (otherHeaders.some((re) => re.test(lines[i]))) {
      endIndex = i;
      break;
    }
  }

  return lines.slice(headerIndex + 1, endIndex).join("\n");
}

function parseLinesToRecord(lines) {
  const record = {};
  const rawLeftovers = [];

  for (const line of lines) {
    const match = line.match(/^([^:]{1,40}):\s*(.+)$/);
    if (match) {
      const key = match[1].trim().replace(/\s+/g, "");
      record[key] = match[2].trim();
    } else if (line.trim()) {
      rawLeftovers.push(line.trim());
    }
  }

  if (rawLeftovers.length) {
    record.raw_text = rawLeftovers.join(" ");
  }

  return record;
}

/**
 * Groups flat "Label: value" lines into records. A new record starts
 * each time the first-seen key repeats (e.g. a new "TransactionId:").
 * Falls back to a single record if no repeated key is found.
 */
function groupIntoRecords(rawLines, idKeys = []) {
  const lines = rawLines.map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  const idKeyPattern =
    idKeys.length > 0 ? new RegExp(`^(${idKeys.join("|")})\\s*:`, "i") : null;

  const firstKeyMatch = lines[0].match(/^([^:]{1,40}):/);
  const firstKey = firstKeyMatch ? firstKeyMatch[1].trim() : null;

  const isRecordBoundary = (line) =>
    (idKeyPattern && idKeyPattern.test(line)) ||
    (firstKey && new RegExp(`^${firstKey}\\s*:`, "i").test(line));

  if (!firstKey && !idKeyPattern) {
    return [parseLinesToRecord(lines)];
  }

  const records = [];
  let currentLines = [];

  for (const line of lines) {
    if (currentLines.length > 0 && isRecordBoundary(line)) {
      records.push(parseLinesToRecord(currentLines));
      currentLines = [];
    }
    currentLines.push(line);
  }
  if (currentLines.length) records.push(parseLinesToRecord(currentLines));

  return records;
}

/**
 * Main entry point. Call once per module against the same OCR text:
 *   extractRecords("af", text) -> array of record objects
 *   extractRecords("ff", text) -> array of record objects
 *   extractRecords("ph", text) -> array of record objects
 */
export function extractRecords(type, text) {
  const hint = MODULE_FIELD_HINTS[type];
  if (!hint) {
    console.warn(`extractRecords: unknown module type "${type}"`);
    return [];
  }

  const moduleText = isolateModuleText(type, text || "");
  const lines = moduleText.split(/\r?\n/);

  return groupIntoRecords(lines, hint.idKeys);
}

/**
 * Converts an array of record objects to CSV text.
 * `columnOrder` (optional) fixes column order/inclusion; any record
 * keys not listed are appended after it. `columnLabels` (optional)
 * maps raw keys to display headers.
 */
export function recordsToCSV(records, columnOrder, columnLabels = {}) {
  if (!records || !records.length) return "";

  const allKeys = Array.from(new Set(records.flatMap((r) => Object.keys(r))));
  const orderedKeys = columnOrder
    ? [...columnOrder.filter((k) => allKeys.includes(k)), ...allKeys.filter((k) => !columnOrder.includes(k))]
    : allKeys;

  const escape = (v = "") => `"${String(v).replace(/"/g, '""')}"`;
  const headerRow = orderedKeys.map((k) => escape(columnLabels[k] || k)).join(",");
  const dataRows = records.map((r) => orderedKeys.map((k) => escape(r[k] ?? "")).join(","));

  return [headerRow, ...dataRows].join("\n");
}
