import { useState, useEffect, useMemo } from "react";

import "../App.css";

import TransactionDetail from "./TransactionDetail";
import Upload from "./Upload";

const API_URL = "/api/transactions";

// =====================================================
// PARSE DATE — handles ISO string OR LocalDateTime
// array format: [2026, 9, 19, 15, 30, 0, 0]
// =====================================================

function parseDate(rawDate) {
  if (!rawDate) return new Date().toLocaleDateString("en-CA");

  // Already a string date (ISO 8601 or similar)
  if (typeof rawDate === "string") {
    // Try parsing directly
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("en-CA");
    return rawDate.slice(0, 10); // fallback: take first 10 chars YYYY-MM-DD
  }

  // Jackson LocalDateTime array: [year, month, day, hour, minute, second, nano]
  if (Array.isArray(rawDate) && rawDate.length >= 3) {
    const [year, month, day] = rawDate;
    // month in Java LocalDateTime is 1-indexed, JS Date is 0-indexed
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("en-CA");
  }

  return new Date().toLocaleDateString("en-CA");
}


// =====================================================
// NORMALIZE backend record → UI shape
// =====================================================

function normalizeResult(tx) {
  const rawId = tx.transactionId || tx.transaction_id || String(tx.id);
  const rawScore = tx.consolidatedScore ?? tx.consolidated_score;
  const rawExps = tx.explanations
    ? (typeof tx.explanations === "string"
        ? tx.explanations.split(/;|\|/).map((s) => s.trim()).filter(Boolean)
        : tx.explanations)
    : [];

  const hasMissingData = rawScore === null || rawScore === undefined ||
    rawExps.some(e => typeof e === "string" && e.toLowerCase().includes("missing data"));

  const score = hasMissingData ? null : Math.round(Number(rawScore));
  const band = hasMissingData ? "Critical" : (tx.riskBand || tx.risk_band || "Very Low");
  const status = hasMissingData ? "Alert" : (band === "Critical" || band === "High" ? "Alert" : band === "Medium" ? "Review" : "Normal");

  const rawDate = tx.createdAt || tx.created_at || tx.processedAt;
  const dateStr = parseDate(rawDate);

  return {
    id: rawId,
    dbId: tx.id,
    amount: Number(tx.amount ?? 0),
    currency: tx.currency || "INR",
    score,
    hasMissingData,
    band,
    status,
    date: dateStr,
    adaptiveScore: tx.adaptiveScore != null ? Number(tx.adaptiveScore) : null,
    fundFlowScore: tx.fundFlowScore != null ? Number(tx.fundFlowScore) : null,
    phishingScore: tx.phishingScore != null ? Number(tx.phishingScore) : null,
    recommendedAction: tx.recommendedAction || tx.recommended_action || (hasMissingData ? "Invalid or Missing Data - Manual Review Required" : ""),
    explanations: rawExps,
  };
}




// =====================================================
// TRANSACTIONS COMPONENT
// =====================================================

function Transactions({
  role,
  user,
  availableRoles: availableRolesFromApp = [],
  onRoleChange,
  onLogout,
  onNavigate,
  darkMode = false,
  onDarkModeChange,
}) {

  // ===================================================
  // STATE
  // ===================================================

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [summaryFilter, setSummaryFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("high");

  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [downloading, setDownloading] = useState(false);


  // ===================================================
  // LOAD TRANSACTIONS FROM BACKEND
  // ===================================================

  async function loadTransactions() {
    try {
      setLoading(true);
      setLoadError("");
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const raw = Array.isArray(data) ? data.map(normalizeResult) : [];

      // DEDUPLICATE: per transactionId keep the record with the highest dbId
      const seen = new Map();
      for (const tx of raw) {
        const existing = seen.get(tx.id);
        if (!existing || (tx.dbId > existing.dbId)) {
          seen.set(tx.id, tx);
        }
      }
      const normalized = Array.from(seen.values());

      setTransactions(normalized);
      // Re-sync selected transaction if open
      setSelectedTransaction((current) => {
        if (!current) return null;
        return normalized.find((t) => t.id === current.id) || null;
      });
    } catch (err) {
      console.error("Transaction load failed:", err);
      setLoadError("Unable to load transactions from backend.");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  // Reload when a new analysis completes
  useEffect(() => {
    function handleNew() { loadTransactions(); }
    window.addEventListener("ufde-transaction-created", handleNew);
    return () => window.removeEventListener("ufde-transaction-created", handleNew);
  }, []);


  // ===================================================
  // GET USER'S AVAILABLE ROLES
  // ===================================================

  function getAvailableRoles() {
    if (user && Array.isArray(user.roles)) {
      const valid = user.roles.filter((r) => ["admin", "analyzer", "user"].includes(r));
      if (valid.length > 0) return valid;
    }
    if (Array.isArray(availableRolesFromApp) && availableRolesFromApp.length > 0) {
      const valid = availableRolesFromApp.filter((r) => ["admin", "analyzer", "user"].includes(r));
      if (valid.length > 0) return valid;
    }
    try {
      const stored = JSON.parse(localStorage.getItem("ufdeRoles") || "[]");
      if (Array.isArray(stored) && stored.length > 0) {
        return stored.filter((r) => ["admin", "analyzer", "user"].includes(r));
      }
    } catch { /* ignore */ }
    if (role === "admin" || role === "analyzer" || role === "user") return [role];
    return ["user"];
  }

  const availableRoles = getAvailableRoles();


  // ===================================================
  // ROLE DISPLAY NAME
  // ===================================================

  function getRoleName(roleName = role) {
    if (roleName === "admin") return "ADMIN";
    if (roleName === "analyzer") return "ANALYZER";
    return "USER";
  }


  // ===================================================
  // ROLE SWITCHING
  // ===================================================

  function handleRoleChange(event) {
    const newRole = event.target.value;
    if (!availableRoles.includes(newRole)) return;
    localStorage.setItem("ufdeRole", newRole);
    setMenuOpen(false);
    setSettingsOpen(false);
    setSelectedTransaction(null);
    setShowUpload(false);
    if (onRoleChange) { onRoleChange(newRole); return; }
    window.location.reload();
  }


  // ===================================================
  // DARK MODE
  // ===================================================

  function handleDarkModeToggle() {
    if (typeof onDarkModeChange !== "function") return;
    onDarkModeChange(!darkMode);
  }


  // ===================================================
  // ACCESS HELPERS
  // ===================================================

  function canUpload() { return role === "admin" || role === "analyzer"; }
  function canDownload() { return role === "admin"; }


  // ===================================================
  // FILTER + SORT
  // ===================================================

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter((tx) => {
      const matchSearch = tx.id.toLowerCase().includes(search.toLowerCase());
      const matchRisk = riskFilter === "All" || tx.band === riskFilter;
      const matchSummary =
        summaryFilter === "All" ||
        (summaryFilter === "High Risk" && tx.band === "High") ||
        (summaryFilter === "Critical" && tx.band === "Critical") ||
        (summaryFilter === "Alerts" && tx.status === "Alert");
      return matchSearch && matchRisk && matchSummary;
    });

    result = [...result].sort((a, b) => {
      if (sortOrder === "high") return b.score - a.score;
      if (sortOrder === "low") return a.score - b.score;
      if (sortOrder === "amount-high") return b.amount - a.amount;
      if (sortOrder === "amount-low") return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [transactions, search, riskFilter, summaryFilter, sortOrder]);


  // ===================================================
  // SUMMARY COUNTS
  // ===================================================

  const totalTransactions = transactions.length;
  const highRisk = transactions.filter((t) => t.band === "High").length;
  const criticalRisk = transactions.filter((t) => t.band === "Critical").length;
  const alerts = transactions.filter((t) => t.status === "Alert").length;

  function handleSummaryClick(filter) {
    setSummaryFilter(summaryFilter === filter ? "All" : filter);
  }


  // ===================================================
  // DOWNLOAD JSON (admin only)
  // ===================================================

  function downloadJSON() {
    if (!canDownload()) return;
    setDownloading(true);
    try {
      const blob = new Blob([JSON.stringify(filteredTransactions, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ufde-transactions.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }


  // ===================================================
  // DOWNLOAD CSV (admin only)
  // ===================================================

  function downloadCSV() {
    if (!canDownload()) return;
    setDownloading(true);
    try {
      const headers = ["Transaction ID", "Amount", "Currency", "Risk Score", "Risk Band", "Status", "Date", "AF Score", "FF Score", "PH Score", "Recommended Action"];
      const rows = filteredTransactions.map((t) => [
        t.id, t.amount, t.currency, t.score, t.band, t.status, t.date,
        t.adaptiveScore, t.fundFlowScore, t.phishingScore, t.recommendedAction,
      ]);
      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ufde-transactions.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }


  // ===================================================
  // UPLOAD
  // ===================================================

  function handleOpenUpload() {
    if (!canUpload()) return;
    setMenuOpen(false);
    setSettingsOpen(false);
    setSelectedTransaction(null);
    setShowUpload(true);
  }

  function handleBackFromUpload() {
    setShowUpload(false);
    loadTransactions();
  }


  // ===================================================
  // LOGOUT
  // ===================================================

  function handleLogout() {
    if (onLogout) { onLogout(); return; }
    localStorage.removeItem("ufdeUser");
    localStorage.removeItem("ufdeRoles");
    localStorage.removeItem("ufdeRole");
    window.location.reload();
  }


  // ===================================================
  // SETTINGS
  // ===================================================

  function handleOpenSettings() {
    setMenuOpen(false);
    setSettingsOpen(true);
  }


  // ===================================================
  // UPLOAD PAGE
  // ===================================================

  if (showUpload) {
    return (
      <div className="upload-wrapper">
        <Upload
          role={role}
          user={user}
          onLogout={handleLogout}
          onBack={handleBackFromUpload}
          onAnalyzeComplete={handleBackFromUpload}
        />
      </div>
    );
  }


  // ===================================================
  // DASHBOARD
  // ===================================================

  return (
    <div className="transactions-page">

      {/* ================================================
          HEADER
      ================================================ */}

      <header className="dashboard-header">

        {/* LEFT */}
        <div className="header-left">
          <button
            className="menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
          >
            <span aria-hidden="true">☰</span>
          </button>

          <div>
            <h1>UFDE</h1>
            <p>Unified Fraud Detection Engine</p>
          </div>
        </div>


        {/* RIGHT */}
        <div className="header-actions">

          {/* Role switcher (multi-role users) */}
          {availableRoles.length > 1 ? (
            <select
              className="header-role-select"
              value={role}
              onChange={handleRoleChange}
              title="Switch role"
              aria-label="Switch role"
            >
              {availableRoles.includes("admin") && <option value="admin">ADMIN</option>}
              {availableRoles.includes("analyzer") && <option value="analyzer">ANALYZER</option>}
              {availableRoles.includes("user") && <option value="user">USER</option>}
            </select>
          ) : (
            <span className="role-badge">{getRoleName()}</span>
          )}

          <button
            className="theme-button"
            onClick={handleDarkModeToggle}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={darkMode}
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            <span aria-hidden="true">{darkMode ? "☀" : "☾"}</span>
          </button>

          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>

        </div>
      </header>


      {/* ================================================
          SIDE MENU
      ================================================ */}

      {menuOpen && (
        <>
          <div className="menu-overlay" onClick={() => setMenuOpen(false)} />

          <aside className="side-menu">

            <div className="side-menu-header">
              <strong>UFDE Menu</strong>
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button>
            </div>

            {/* Upload — admin + analyzer */}
            {canUpload() && (
              <button className="menu-item" onClick={handleOpenUpload}>
                <span>↑</span> Upload
              </button>
            )}

            {/* Refresh */}
            <button className="menu-item" onClick={() => { setMenuOpen(false); loadTransactions(); }}>
              <span>↺</span> Refresh Data
            </button>

            {/* Settings */}
            <button className="menu-item" onClick={handleOpenSettings}>
              <span>⚙</span> Settings
            </button>

            {/* Admin download */}
            {canDownload() && (
              <button className="menu-item" onClick={() => { setMenuOpen(false); downloadCSV(); }}>
                <span>↓</span> Download Data
              </button>
            )}

            <div className="menu-divider" />

            <button className="menu-item logout-menu-item" onClick={handleLogout}>
              <span>→</span> Logout
            </button>

          </aside>
        </>
      )}


      {/* ================================================
          SETTINGS MODAL
      ================================================ */}

      {settingsOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false); }}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>

            <div className="settings-header">
              <h2>Settings</h2>
              <button onClick={() => setSettingsOpen(false)} aria-label="Close settings">×</button>
            </div>

            <div className="settings-content">

              <div className="setting-row">
                <div>
                  <strong>Active Role</strong>
                  <p>Role currently active in UFDE</p>
                </div>
                <span className="role-badge">{getRoleName()}</span>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Account</strong>
                  <p>Signed-in UFDE account</p>
                </div>
                <span>{user?.name || user?.username || "User"}</span>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Assigned Roles</strong>
                  <p>Roles available to this account</p>
                </div>
                <span>{availableRoles.map((r) => getRoleName(r)).join(" • ")}</span>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Transaction Display</strong>
                  <p>Live data from MySQL database</p>
                </div>
                <span>Enabled</span>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Notifications</strong>
                  <p>Fraud alert notifications</p>
                </div>
                <button
                  className="setting-toggle enabled"
                  onClick={(e) => e.currentTarget.classList.toggle("enabled")}
                >
                  ON
                </button>
              </div>

              <div className="setting-row">
                <div>
                  <strong>Appearance</strong>
                  <p>Current dashboard theme</p>
                </div>
                <span>{darkMode ? "Dark Mode" : "Light Mode"}</span>
              </div>

            </div>

            <button className="close-settings-button" onClick={() => setSettingsOpen(false)}>
              Close
            </button>

          </div>
        </div>
      )}


      {/* ================================================
          MAIN CONTENT
      ================================================ */}

      <main className="transactions-container">
        <div className="transactions-workspace">


          {/* =============================================
              LEFT — TRANSACTIONS OVERVIEW
          ============================================= */}

          <section className="transactions-overview-panel">

            {/* TITLE */}
            <div className="transactions-title">
              <div>
                <h2>Transactions Overview</h2>
                <p>
                  {loading
                    ? "Loading transaction data…"
                    : loadError
                    ? loadError
                    : "Review and investigate stored transaction data."}
                </p>
              </div>
              <button
                className="toolbar-download-button icon-action-button"
                style={{ marginLeft: "auto" }}
                onClick={loadTransactions}
                title="Refresh transaction data"
                aria-label="Refresh transaction data"
              >
                <span aria-hidden="true">↻</span>
              </button>
            </div>


            {/* SUMMARY CARDS */}
            <div className="summary-grid">

              <div
                className={`summary-card ${summaryFilter === "All" ? "summary-card-active" : ""}`}
                onClick={() => handleSummaryClick("All")}
              >
                <span>Total Transactions</span>
                <strong>{totalTransactions}</strong>
              </div>

              <div
                className={`summary-card ${summaryFilter === "High Risk" ? "summary-card-active" : ""}`}
                onClick={() => handleSummaryClick("High Risk")}
              >
                <span>High Risk</span>
                <strong>{highRisk}</strong>
              </div>

              <div
                className={`summary-card ${summaryFilter === "Critical" ? "summary-card-active" : ""}`}
                onClick={() => handleSummaryClick("Critical")}
              >
                <span>Critical</span>
                <strong>{criticalRisk}</strong>
              </div>

              <div
                className={`summary-card ${summaryFilter === "Alerts" ? "summary-card-active" : ""}`}
                onClick={() => handleSummaryClick("Alerts")}
              >
                <span>Alerts</span>
                <strong>{alerts}</strong>
              </div>

            </div>


            {/* TOOLBAR */}
            <div className="transaction-toolbar">

              <input
                type="text"
                placeholder="Search transaction ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
                <option value="All">All Risk Levels</option>
                <option value="Very Low">Very Low</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>

              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="high">Risk: High to Low</option>
                <option value="low">Risk: Low to High</option>
                <option value="amount-high">Amount: High to Low</option>
                <option value="amount-low">Amount: Low to High</option>
              </select>

              {canDownload() && (
                <button className="toolbar-download-button" onClick={downloadCSV} disabled={downloading}>
                  <span aria-hidden="true">↓</span> {downloading ? "Preparing…" : "Download"}
                </button>
              )}

            </div>


            {/* TABLE */}
            <div className="transaction-table-card">
              <div className="table-scroll">

                {loading ? (
                  <div className="empty-transactions" style={{ padding: "40px 0" }}>
                    Loading transactions…
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Amount</th>
                        <th>Risk Score (100)</th>
                        <th>Risk Band</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => {
                        const isSelected = selectedTransaction?.id === transaction.id;
                        return (
                          <tr
                            key={`${transaction.dbId ?? transaction.id}`}
                            className={`transaction-row ${isSelected ? "selected-transaction-row" : ""} ${transaction.hasMissingData ? "missing-data-row" : ""}`}
                            onClick={() => setSelectedTransaction(transaction)}
                          >
                            <td><strong>{transaction.id}</strong></td>
                            <td>₹{transaction.amount.toLocaleString("en-IN")}</td>
                            <td>
                              {transaction.hasMissingData || transaction.score === null ? (
                                <span style={{ color: "#dc2626", fontStyle: "italic", fontWeight: "bold" }}>Unassigned (Missing Data)</span>
                              ) : (
                                <strong>{transaction.score} / 100</strong>
                              )}
                            </td>
                            <td>
                              <span className={`risk-badge ${transaction.band.toLowerCase().replace(" ", "-")}`}>
                                {transaction.band}
                              </span>
                            </td>
                            <td><span className="status-text">{transaction.status}</span></td>
                            <td>{transaction.date}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {!loading && filteredTransactions.length === 0 && (
                  <div className="empty-transactions">
                    {loadError ? loadError : "No transactions found."}
                  </div>
                )}

              </div>
            </div>


            {/* RESULT COUNT */}
            <div className="transaction-result-count">
              Showing <strong>{filteredTransactions.length}</strong> of{" "}
              <strong>{totalTransactions}</strong> transactions
            </div>


            {/* ADMIN EXPORT */}
            {canDownload() && (
              <div className="download-section">
                <div>
                  <h3>Export Transaction Data</h3>
                  <p>Export the transactions currently shown after applying filters.</p>
                </div>
                <div className="download-buttons">
                  <button onClick={downloadJSON} disabled={downloading}><span aria-hidden="true">↓</span> JSON</button>
                  <button onClick={downloadCSV} disabled={downloading}><span aria-hidden="true">↓</span> CSV</button>
                </div>
              </div>
            )}

          </section>


          {/* =============================================
              RIGHT — TRANSACTION DETAILS
          ============================================= */}

          <aside className="transaction-detail-side">

            {selectedTransaction ? (
              <TransactionDetail
                transaction={selectedTransaction}
                role={role}
                onBack={() => setSelectedTransaction(null)}
              />
            ) : (
              <div className="empty-detail-panel">
                <div className="empty-detail-icon">↗</div>
                <h2>Transaction Details</h2>
                <p>
                  Select a transaction from the overview to investigate its
                  risk signals, alerts, explanation and fund flow.
                </p>
              </div>
            )}

          </aside>


        </div>
      </main>

    </div>
  );
}


export default Transactions;