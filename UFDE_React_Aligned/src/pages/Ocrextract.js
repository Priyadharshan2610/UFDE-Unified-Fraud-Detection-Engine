// Ocrextract.js

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

function isolateModuleText(type, text) {
  const hint = MODULE_FIELD_HINTS[type];
  if (!hint) return text;

  const lines = text.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => hint.sectionHeader.test(line));

  if (headerIndex === -1) {
    return text;
  }

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
      const rawKey = match[1].trim();
      const val = match[2].trim();
      const cleanKey = rawKey.replace(/\s+/g, "");
      record[cleanKey] = val;

      const lower = cleanKey.toLowerCase();
      if (lower.includes("transactionid") || lower === "txid" || lower === "id") {
        record.TransactionId = val;
        record.transactionId = val;
      }
      if (lower.includes("recordid")) {
        record.RecordId = val;
        record.recordId = val;
      }
      if (lower.includes("amount") || lower.includes("totalsent")) {
        const num = parseFloat(val.replace(/[^0-9.]/g, ""));
        if (!isNaN(num)) record.amount = num;
        record.TotalSent = val;
        record.totalSent = val;
      }
      if (lower.includes("currency")) {
        record.Currency = val;
        record.currency = val;
      }
      if (lower.includes("indegree")) {
        record.InDegree = val;
        record.inDegree = val;
      }
      if (lower.includes("outdegree")) {
        record.OutDegree = val;
        record.outDegree = val;
      }
      if (lower.includes("remaining")) {
        record.RemainingBalance = val;
        record.remainingBalance = val;
      }
      if (lower.includes("holding")) {
        record.HoldingMinutes = val;
        record.holdingMinutes = val;
      }
      if (lower.includes("agedays")) {
        const num = parseFloat(val.replace(/[^0-9.]/g, ""));
        if (!isNaN(num)) record.ageDays = num;
      }
      if (lower.includes("selfsigned")) {
        record.selfSigned = val.toLowerCase() === "true" || val === "1" || val.toLowerCase() === "yes";
      }
      if (lower.includes("validitydays")) {
        const num = parseFloat(val.replace(/[^0-9.]/g, ""));
        if (!isNaN(num)) record.validityDays = num;
      }
    } else if (line.trim()) {
      rawLeftovers.push(line.trim());
    }
  }

  if (rawLeftovers.length) {
    record.raw_text = rawLeftovers.join(" ");
  }

  return record;
}

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

export function extractRecords(type, text) {
  const hint = MODULE_FIELD_HINTS[type];
  if (!hint) {
    console.warn(`extractRecords: unknown module type "${type}"`);
    return [];
  }

  const moduleText = isolateModuleText(type, text || "");
  const lines = moduleText.split(/\r?\n/);

  let records = groupIntoRecords(lines, hint.idKeys);

  if (!records.length && text && text.trim().length > 0) {
    records = [parseLinesToRecord(lines)];
  }

  return records.map((r, i) => {
    const txId = r.TransactionId || r.transactionId || r.RecordId || r.recordId;
    return {
      ...r,
      TransactionId: txId,
      transactionId: txId,
      RecordId: r.RecordId || r.recordId,
      Currency: r.Currency || r.currency,
    };
  });
}

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
