import { useState } from "react";

import "../App.css";

import TransactionDetail from "./TransactionDetail";
import Upload from "./Upload";


// =====================================================
// DEMO TRANSACTION DATA
// =====================================================

const transactions = [
  {
    id: "TXN-1001",
    amount: 85000,
    score: 92,
    band: "Critical",
    status: "Alert",
    date: "2026-09-19",
  },
  {
    id: "TXN-1002",
    amount: 42000,
    score: 76,
    band: "High",
    status: "Alert",
    date: "2026-09-19",
  },
  {
    id: "TXN-1003",
    amount: 12500,
    score: 55,
    band: "Medium",
    status: "Review",
    date: "2026-09-18",
  },
  {
    id: "TXN-1004",
    amount: 5800,
    score: 34,
    band: "Low",
    status: "Normal",
    date: "2026-09-18",
  },
  {
    id: "TXN-1005",
    amount: 210000,
    score: 88,
    band: "Critical",
    status: "Alert",
    date: "2026-09-17",
  },
  {
    id: "TXN-1006",
    amount: 7200,
    score: 18,
    band: "Very Low",
    status: "Normal",
    date: "2026-09-17",
  },
  {
    id: "TXN-1007",
    amount: 33000,
    score: 68,
    band: "High",
    status: "Alert",
    date: "2026-09-16",
  },
  {
    id: "TXN-1008",
    amount: 15000,
    score: 47,
    band: "Medium",
    status: "Review",
    date: "2026-09-16",
  },
  {
    id: "TXN-1009",
    amount: 9500,
    score: 27,
    band: "Low",
    status: "Normal",
    date: "2026-09-15",
  },
  {
    id: "TXN-1010",
    amount: 175000,
    score: 84,
    band: "Critical",
    status: "Alert",
    date: "2026-09-15",
  },
  {
    id: "TXN-1011",
    amount: 64000,
    score: 73,
    band: "High",
    status: "Alert",
    date: "2026-09-14",
  },
  {
    id: "TXN-1012",
    amount: 4200,
    score: 12,
    band: "Very Low",
    status: "Normal",
    date: "2026-09-14",
  },
  {
    id: "TXN-1013",
    amount: 28500,
    score: 51,
    band: "Medium",
    status: "Review",
    date: "2026-09-13",
  },
  {
    id: "TXN-1014",
    amount: 92000,
    score: 81,
    band: "Critical",
    status: "Alert",
    date: "2026-09-13",
  },
  {
    id: "TXN-1015",
    amount: 11000,
    score: 38,
    band: "Low",
    status: "Normal",
    date: "2026-09-12",
  },
];


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

  const [search, setSearch] = useState("");

  const [riskFilter, setRiskFilter] = useState("All");

  const [summaryFilter, setSummaryFilter] = useState("All");

  const [sortOrder, setSortOrder] = useState("high");

  const [menuOpen, setMenuOpen] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  const [showUpload, setShowUpload] = useState(false);


  // ===================================================
  // GET USER'S AVAILABLE ROLES
  // ===================================================

  function getAvailableRoles() {

    /*
      Preferred source:
      user.roles

      Example:

      {
        name: "Ram",
        username: "ram",
        roles: ["admin", "analyzer", "user"]
      }
    */

    if (user && Array.isArray(user.roles)) {

      const validRoles = user.roles.filter((item) =>
        ["admin", "analyzer", "user"].includes(item)
      );

      if (validRoles.length > 0) {
        return validRoles;
      }
    }


    /*
      App.jsx already passes the user's assigned roles.

      Use this before localStorage so role state remains
      controlled by App.jsx.
    */

    if (
      Array.isArray(availableRolesFromApp) &&
      availableRolesFromApp.length > 0
    ) {

      const validRoles =
        availableRolesFromApp.filter((item) =>
          ["admin", "analyzer", "user"].includes(item)
        );


      if (validRoles.length > 0) {
        return validRoles;
      }

    }


    /*
      Fallback:
      localStorage

      This keeps the current demo application
      compatible while the backend is being built.
    */

    try {

      const storedRoles =
        JSON.parse(
          localStorage.getItem("ufdeRoles") || "[]"
        );


      if (
        Array.isArray(storedRoles) &&
        storedRoles.length > 0
      ) {

        return storedRoles.filter((item) =>
          ["admin", "analyzer", "user"].includes(item)
        );
      }

    } catch (error) {

      console.error(
        "Unable to read stored roles:",
        error
      );

    }


    /*
      Final fallback:
      current active role only.
    */

    if (
      role === "admin" ||
      role === "analyzer" ||
      role === "user"
    ) {

      return [role];

    }


    return ["user"];
  }


  const availableRoles = getAvailableRoles();


  // ===================================================
  // ROLE DISPLAY NAME
  // ===================================================

  function getRoleName(roleName = role) {

    if (roleName === "admin") {
      return "ADMIN";
    }

    if (roleName === "analyzer") {
      return "ANALYZER";
    }

    return "USER";
  }


  // ===================================================
  // ROLE SWITCHING
  // HEADER ONLY
  // ===================================================

  function handleRoleChange(event) {

    const newRole = event.target.value;


    /*
      Security check on frontend:
      Only roles assigned to this user can be selected.
    */

    if (!availableRoles.includes(newRole)) {
      return;
    }


    /*
      Save currently active role.
    */

    localStorage.setItem(
      "ufdeRole",
      newRole
    );


    /*
      Close open UI.
    */

    setMenuOpen(false);

    setSettingsOpen(false);

    setSelectedTransaction(null);

    setShowUpload(false);


    /*
      Tell App.jsx about the role change.

      This avoids forcing the whole application to reload.
    */

    if (onRoleChange) {

      onRoleChange(newRole);

      return;
    }


    /*
      Fallback for the temporary demo application.
    */

    window.location.reload();
  }


  // ===================================================
  // DARK MODE
  // ===================================================

  function handleDarkModeToggle() {

    if (typeof onDarkModeChange !== "function") {
      return;
    }


    onDarkModeChange(!darkMode);

  }


  // ===================================================
  // UPLOAD ACCESS
  // ===================================================

  function canUpload() {

    return (
      role === "admin" ||
      role === "analyzer"
    );
  }


  // ===================================================
  // DOWNLOAD ACCESS
  // ===================================================

  function canDownload() {

    return role === "admin";
  }


  // ===================================================
  // FILTER TRANSACTIONS
  // ===================================================

  let filteredTransactions =
    transactions.filter((transaction) => {

      const matchesSearch =
        transaction.id
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );


      const matchesRisk =
        riskFilter === "All" ||
        transaction.band === riskFilter;


      const matchesSummary =
        summaryFilter === "All" ||

        (
          summaryFilter === "High Risk" &&
          transaction.band === "High"
        ) ||

        (
          summaryFilter === "Critical" &&
          transaction.band === "Critical"
        ) ||

        (
          summaryFilter === "Alerts" &&
          transaction.status === "Alert"
        );


      return (
        matchesSearch &&
        matchesRisk &&
        matchesSummary
      );

    });


  // ===================================================
  // SORT
  // ===================================================

  filteredTransactions.sort((a, b) => {

    if (sortOrder === "high") {
      return b.score - a.score;
    }


    if (sortOrder === "low") {
      return a.score - b.score;
    }


    if (sortOrder === "amount-high") {
      return b.amount - a.amount;
    }


    if (sortOrder === "amount-low") {
      return a.amount - b.amount;
    }


    return 0;
  });


  // ===================================================
  // SUMMARY
  // ===================================================

  const totalTransactions =
    transactions.length;


  const highRisk =
    transactions.filter(
      (transaction) =>
        transaction.band === "High"
    ).length;


  const criticalRisk =
    transactions.filter(
      (transaction) =>
        transaction.band === "Critical"
    ).length;


  const alerts =
    transactions.filter(
      (transaction) =>
        transaction.status === "Alert"
    ).length;


  // ===================================================
  // SUMMARY CARD FILTER
  // ===================================================

  function handleSummaryClick(filter) {

    if (summaryFilter === filter) {

      setSummaryFilter("All");

      return;
    }


    setSummaryFilter(filter);
  }


  // ===================================================
  // DOWNLOAD JSON
  // ADMIN ONLY
  // ===================================================

  function downloadJSON() {

    if (!canDownload()) {
      return;
    }


    const data =
      JSON.stringify(
        filteredTransactions,
        null,
        2
      );


    const blob =
      new Blob(
        [data],
        {
          type: "application/json",
        }
      );


    const url =
      URL.createObjectURL(blob);


    const link =
      document.createElement("a");


    link.href = url;

    link.download =
      "ufde-transactions.json";


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }


  // ===================================================
  // DOWNLOAD CSV
  // ADMIN ONLY
  // ===================================================

  function downloadCSV() {

    if (!canDownload()) {
      return;
    }


    const headers = [
      "Transaction ID",
      "Amount",
      "Risk Score",
      "Risk Band",
      "Status",
      "Date",
    ];


    const rows =
      filteredTransactions.map(
        (transaction) => [
          transaction.id,
          transaction.amount,
          transaction.score,
          transaction.band,
          transaction.status,
          transaction.date,
        ]
      );


    const csv =
      [headers, ...rows]
        .map((row) =>
          row.join(",")
        )
        .join("\n");


    const blob =
      new Blob(
        [csv],
        {
          type: "text/csv",
        }
      );


    const url =
      URL.createObjectURL(blob);


    const link =
      document.createElement("a");


    link.href = url;

    link.download =
      "ufde-transactions.csv";


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }


  // ===================================================
  // OPEN UPLOAD
  // ADMIN + ANALYZER ONLY
  // ===================================================

  function handleOpenUpload() {

    if (!canUpload()) {
      return;
    }


    setMenuOpen(false);

    setSettingsOpen(false);

    setSelectedTransaction(null);

    setShowUpload(true);
  }


  // ===================================================
  // CLOSE UPLOAD
  // ===================================================

  function handleBackFromUpload() {

    setShowUpload(false);
  }


  // ===================================================
  // LOGOUT
  // ===================================================

  function handleLogout() {

    if (onLogout) {

      onLogout();

      return;
    }


    localStorage.removeItem("ufdeUser");

    localStorage.removeItem("ufdeRoles");

    localStorage.removeItem("ufdeRole");

    window.location.reload();
  }


  // ===================================================
  // OPEN SETTINGS
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
        />

      </div>

    );
  }


  // ===================================================
  // DASHBOARD
  // ===================================================

  return (

    <div className="transactions-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="dashboard-header">


        {/* LEFT */}

        <div className="header-left">

          <button
            className="menu-button"
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            aria-label="Open menu"
          >
            ☰
          </button>


          <div>

            <h1>
              UFDE
            </h1>

            <p>
              Unified Fraud Detection Engine
            </p>

          </div>

        </div>


        {/* RIGHT */}

        <div className="header-actions">


          {/* =================================================
              ROLE SWITCHER
              ONLY APPEARS IF USER HAS MORE THAN ONE ROLE
          ================================================= */}

          {availableRoles.length > 1 ? (

            <select
              className="header-role-select"
              value={role}
              onChange={handleRoleChange}
              title="Switch role"
              aria-label="Switch role"
            >

              {availableRoles.includes("admin") && (

                <option value="admin">
                  ADMIN
                </option>

              )}


              {availableRoles.includes("analyzer") && (

                <option value="analyzer">
                  ANALYZER
                </option>

              )}


              {availableRoles.includes("user") && (

                <option value="user">
                  USER
                </option>

              )}

            </select>

          ) : (

            <span className="role-badge">

              {getRoleName()}

            </span>

          )}


          {/* LOGOUT */}

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* =================================================
          SIDE MENU
      ================================================= */}

      {menuOpen && (

        <>

          <div
            className="menu-overlay"
            onClick={() =>
              setMenuOpen(false)
            }
          />


          <aside className="side-menu">


            <div className="side-menu-header">

              <strong>
                UFDE Menu
              </strong>


              <button
                onClick={() =>
                  setMenuOpen(false)
                }
                aria-label="Close menu"
              >
                ×
              </button>

            </div>


            {/* =================================================
                UPLOAD
                ADMIN + ANALYZER ONLY
            ================================================= */}

            {canUpload() && (

              <button
                className="menu-item"
                onClick={handleOpenUpload}
              >

                <span>
                  ↑
                </span>

                Upload

              </button>

            )}


            {/* =================================================
                SETTINGS
            ================================================= */}

            <button
              className="menu-item"
              onClick={handleOpenSettings}
            >

              <span>
                ⚙
              </span>

              Settings

            </button>


            {/* =================================================
                DARK MODE
            ================================================= */}

            <div className="dark-mode-menu-item">

              <div className="dark-mode-menu-label">

                <span className="dark-mode-icon">
                  {darkMode ? "☀" : "☾"}
                </span>

                <span>
                  {darkMode
                    ? "Light Mode"
                    : "Dark Mode"}
                </span>

              </div>


              <button
                type="button"
                className={`dark-mode-toggle ${
                  darkMode
                    ? "dark-mode-toggle-on"
                    : ""
                }`}
                onClick={
                  handleDarkModeToggle
                }
                aria-label="Toggle dark mode"
                aria-pressed={darkMode}
              >

                <span className="dark-mode-toggle-knob" />

              </button>

            </div>


            {/* =================================================
                ADMIN DOWNLOAD
            ================================================= */}

            {canDownload() && (

              <button
                className="menu-item"
                onClick={() => {

                  setMenuOpen(false);

                  downloadCSV();

                }}
              >

                <span>
                  ↓
                </span>

                Download Data

              </button>

            )}


            <div className="menu-divider" />


            {/* =================================================
                LOGOUT
            ================================================= */}

            <button
              className="menu-item logout-menu-item"
              onClick={handleLogout}
            >

              <span>
                →
              </span>

              Logout

            </button>


          </aside>

        </>

      )}


      {/* =================================================
          SETTINGS
      ================================================= */}

      {settingsOpen && (

        <div className="modal-overlay">

          <div className="settings-modal">


            {/* HEADER */}

            <div className="settings-header">

              <h2>
                Settings
              </h2>


              <button
                onClick={() =>
                  setSettingsOpen(false)
                }
                aria-label="Close settings"
              >
                ×
              </button>

            </div>


            {/* CONTENT */}

            <div className="settings-content">


              {/* =================================================
                  ACCOUNT ROLE
                  READ ONLY
                  ROLE SWITCHING IS IN HEADER
              ================================================= */}

              <div className="setting-row">

                <div>

                  <strong>
                    Active Role
                  </strong>

                  <p>
                    Role currently active in UFDE
                  </p>

                </div>


                <span className="role-badge">

                  {getRoleName()}

                </span>

              </div>


              {/* =================================================
                  ACCOUNT
              ================================================= */}

              <div className="setting-row">

                <div>

                  <strong>
                    Account
                  </strong>

                  <p>
                    Signed-in UFDE account
                  </p>

                </div>


                <span>
                  {user?.name ||
                    user?.username ||
                    "User"}
                </span>

              </div>


              {/* =================================================
                  AVAILABLE ROLES
              ================================================= */}

              <div className="setting-row">

                <div>

                  <strong>
                    Assigned Roles
                  </strong>

                  <p>
                    Roles available to this account
                  </p>

                </div>


                <span>
                  {availableRoles
                    .map((item) =>
                      getRoleName(item)
                    )
                    .join(" • ")}
                </span>

              </div>


              {/* =================================================
                  TRANSACTION DISPLAY
              ================================================= */}

              <div className="setting-row">

                <div>

                  <strong>
                    Transaction Display
                  </strong>

                  <p>
                    Stored transaction table
                  </p>

                </div>


                <span>
                  Enabled
                </span>

              </div>


              {/* =================================================
                  NOTIFICATIONS
              ================================================= */}

              <div className="setting-row">

                <div>

                  <strong>
                    Notifications
                  </strong>

                  <p>
                    Fraud alert notifications
                  </p>

                </div>


                <button
                  className="setting-toggle enabled"
                  onClick={(event) =>
                    event.currentTarget.classList.toggle(
                      "enabled"
                    )
                  }
                >
                  ON
                </button>

              </div>


              {/* =================================================
                  DARK MODE STATUS
              ================================================= */}

              <div className="setting-row">

                <div>

                  <strong>
                    Appearance
                  </strong>

                  <p>
                    Current dashboard theme
                  </p>

                </div>


                <span>
                  {darkMode
                    ? "Dark Mode"
                    : "Light Mode"}
                </span>

              </div>


            </div>


            {/* CLOSE */}

            <button
              className="close-settings-button"
              onClick={() =>
                setSettingsOpen(false)
              }
            >
              Close
            </button>


          </div>

        </div>

      )}


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="transactions-container">


        <div className="transactions-workspace">


          {/* =================================================
              LEFT — TRANSACTIONS OVERVIEW
          ================================================= */}

          <section className="transactions-overview-panel">


            {/* TITLE */}

            <div className="transactions-title">

              <div>

                <h2>
                  Transactions Overview
                </h2>

                <p>
                  Review and investigate stored
                  transaction data.
                </p>

              </div>

            </div>


            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div className="summary-grid">


              {/* TOTAL */}

              <div
                className={`summary-card ${
                  summaryFilter === "All"
                    ? "summary-card-active"
                    : ""
                }`}
                onClick={() =>
                  handleSummaryClick("All")
                }
              >

                <span>
                  Total Transactions
                </span>

                <strong>
                  {totalTransactions}
                </strong>

              </div>


              {/* HIGH RISK */}

              <div
                className={`summary-card ${
                  summaryFilter === "High Risk"
                    ? "summary-card-active"
                    : ""
                }`}
                onClick={() =>
                  handleSummaryClick(
                    "High Risk"
                  )
                }
              >

                <span>
                  High Risk
                </span>

                <strong>
                  {highRisk}
                </strong>

              </div>


              {/* CRITICAL */}

              <div
                className={`summary-card ${
                  summaryFilter === "Critical"
                    ? "summary-card-active"
                    : ""
                }`}
                onClick={() =>
                  handleSummaryClick(
                    "Critical"
                  )
                }
              >

                <span>
                  Critical
                </span>

                <strong>
                  {criticalRisk}
                </strong>

              </div>


              {/* ALERTS */}

              <div
                className={`summary-card ${
                  summaryFilter === "Alerts"
                    ? "summary-card-active"
                    : ""
                }`}
                onClick={() =>
                  handleSummaryClick(
                    "Alerts"
                  )
                }
              >

                <span>
                  Alerts
                </span>

                <strong>
                  {alerts}
                </strong>

              </div>

            </div>


            {/* =================================================
                TOOLBAR
            ================================================= */}

            <div className="transaction-toolbar">


              {/* SEARCH */}

              <input
                type="text"
                placeholder="Search transaction ID..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />


              {/* RISK FILTER */}

              <select
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(
                    event.target.value
                  )
                }
              >

                <option value="All">
                  All Risk Levels
                </option>

                <option value="Very Low">
                  Very Low
                </option>

                <option value="Low">
                  Low
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="High">
                  High
                </option>

                <option value="Critical">
                  Critical
                </option>

              </select>


              {/* SORT */}

              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(
                    event.target.value
                  )
                }
              >

                <option value="high">
                  Risk: High to Low
                </option>

                <option value="low">
                  Risk: Low to High
                </option>

                <option value="amount-high">
                  Amount: High to Low
                </option>

                <option value="amount-low">
                  Amount: Low to High
                </option>

              </select>


              {/* ADMIN DOWNLOAD */}

              {canDownload() && (

                <button
                  className="toolbar-download-button"
                  onClick={downloadCSV}
                >
                  ↓ Download
                </button>

              )}

            </div>


            {/* =================================================
                TABLE
            ================================================= */}

            <div className="transaction-table-card">

              <div className="table-scroll">

                <table>

                  <thead>

                    <tr>

                      <th>
                        Transaction ID
                      </th>

                      <th>
                        Amount
                      </th>

                      <th>
                        Risk Score (100)
                      </th>

                      <th>
                        Risk Band
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Date
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredTransactions.map(
                      (transaction) => {

                        const isSelected =
                          selectedTransaction?.id ===
                          transaction.id;


                        return (

                          <tr
                            key={
                              transaction.id
                            }

                            className={`transaction-row ${
                              isSelected
                                ? "selected-transaction-row"
                                : ""
                            }`}

                            onClick={() =>
                              setSelectedTransaction(
                                transaction
                              )
                            }
                          >

                            <td>

                              <strong>
                                {transaction.id}
                              </strong>

                            </td>


                            <td>

                              ₹
                              {transaction.amount.toLocaleString(
                                "en-IN"
                              )}

                            </td>


                            <td>

                              <strong>

                                {transaction.score}

                                {" / 100"}

                              </strong>

                            </td>


                            <td>

                              <span
                                className={`risk-badge ${transaction.band
                                  .toLowerCase()
                                  .replace(
                                    " ",
                                    "-"
                                  )}`}
                              >

                                {transaction.band}

                              </span>

                            </td>


                            <td>

                              <span className="status-text">

                                {transaction.status}

                              </span>

                            </td>


                            <td>
                              {transaction.date}
                            </td>

                          </tr>

                        );

                      }
                    )}

                  </tbody>

                </table>


                {filteredTransactions.length === 0 && (

                  <div className="empty-transactions">

                    No transactions found.

                  </div>

                )}

              </div>

            </div>


            {/* =================================================
                RESULT COUNT
            ================================================= */}

            <div className="transaction-result-count">

              Showing{" "}

              <strong>
                {filteredTransactions.length}
              </strong>

              {" "}of{" "}

              <strong>
                {totalTransactions}
              </strong>

              {" "}transactions

            </div>


            {/* =================================================
                ADMIN EXPORT
            ================================================= */}

            {canDownload() && (

              <div className="download-section">


                <div>

                  <h3>
                    Export Transaction Data
                  </h3>

                  <p>
                    Export the transactions currently
                    shown after applying filters.
                  </p>

                </div>


                <div className="download-buttons">


                  <button
                    onClick={downloadJSON}
                  >
                    ↓ JSON
                  </button>


                  <button
                    onClick={downloadCSV}
                  >
                    ↓ CSV
                  </button>


                  <button
                    onClick={() =>
                      alert(
                        "PDF export will be connected to the backend export service."
                      )
                    }
                  >
                    ↓ PDF
                  </button>


                </div>


              </div>

            )}

          </section>


          {/* =================================================
              RIGHT — TRANSACTION DETAILS
          ================================================= */}

          <aside className="transaction-detail-side">


            {selectedTransaction ? (

              <TransactionDetail

                transaction={
                  selectedTransaction
                }

                role={role}

                onBack={() =>
                  setSelectedTransaction(
                    null
                  )
                }

              />

            ) : (

              <div className="empty-detail-panel">


                <div className="empty-detail-icon">
                  ↗
                </div>


                <h2>
                  Transaction Details
                </h2>


                <p>
                  Select a transaction from
                  the overview to investigate
                  its risk signals, alerts,
                  explanation and fund flow.
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