import { useState, useEffect } from "react";

import Transactions from "./pages/Transactions";
import Upload from "./pages/Upload";

import "./App.css";

/*
=========================================================
BACKEND API URL
=========================================================
*/
const AUTH_URL = "/api/auth/login";


function App() {

  /*
  =======================================================
  DARK MODE
  =======================================================
  */

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("ufdeDarkMode") === "true";
  });

  useEffect(() => {
    document.body.classList.toggle("ufde-dark-mode", darkMode);
    localStorage.setItem("ufdeDarkMode", String(darkMode));
  }, [darkMode]);


  /*
  =======================================================
  RESTORE USER SESSION
  =======================================================
  */

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("ufdeUser");
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("ufdeUser");
      return null;
    }
  });

  const [availableRoles, setAvailableRoles] = useState(() => {
    const savedRoles = localStorage.getItem("ufdeRoles");
    if (!savedRoles) return [];
    try {
      return JSON.parse(savedRoles);
    } catch {
      localStorage.removeItem("ufdeRoles");
      return [];
    }
  });

  const [selectedRole, setSelectedRole] = useState(() => {
    return localStorage.getItem("ufdeRole");
  });

  /*
  =======================================================
  CURRENT PAGE
  =======================================================
  */

  const [currentPage, setCurrentPage] = useState("dashboard");


  /*
  =======================================================
  LOGIN FORM
  =======================================================
  */

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);


  /*
  =======================================================
  LOGIN ROLE SELECTION (multi-role users)
  =======================================================
  */

  const [pendingUser, setPendingUser] = useState(null);
  const [pendingRoles, setPendingRoles] = useState([]);
  const [pendingRole, setPendingRole] = useState("");


  /*
  =======================================================
  LOGIN — tries real backend first, falls back to demo
  =======================================================
  */

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError("");

    if (!username.trim() || !password.trim()) {
      setLoginError("Please enter username and password.");
      return;
    }

    setLoginLoading(true);

    try {
      /* ------------------------------------------------
         REAL BACKEND AUTH
      ------------------------------------------------ */
      const response = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {

        const backendRole = data.role || "analyst";

        /* Map backend roles to frontend roles */
        const roleMapping = {
          admin: "admin",
          analyst: "analyzer",
          analyzer: "analyzer",
          viewer: "user",
          user: "user",
        };

        const mappedRole =
          roleMapping[backendRole.toLowerCase()] || "user";

        const userData = {
          id: data.userId || "USR-DB",
          username: username.trim(),
          name: data.name || username.trim(),
        };

        /* Single role — go straight to dashboard */
        completeLogin(userData, [mappedRole], mappedRole);

      } else {
        setLoginError(data.message || "Invalid username or password.");
        setLoginLoading(false);
      }

    } catch {
      setLoginError("Unable to reach the authentication server. Start the backend and try again.");
      setLoginLoading(false);
    }
  }


  /*
  =======================================================
  COMPLETE LOGIN
  =======================================================
  */

  function completeLogin(userData, roles, role) {
    setUser(userData);
    setAvailableRoles(roles);
    setSelectedRole(role);

    localStorage.setItem("ufdeUser", JSON.stringify(userData));
    localStorage.setItem("ufdeRoles", JSON.stringify(roles));
    localStorage.setItem("ufdeRole", role);

    setCurrentPage("dashboard");
    setUsername("");
    setPassword("");
    setLoginLoading(false);
  }


  /*
  =======================================================
  CONTINUE AFTER ROLE SELECTION
  =======================================================
  */

  function handleRoleContinue() {
    if (!pendingUser) return;

    if (!pendingRoles.includes(pendingRole)) {
      setLoginError("Please select a valid role.");
      return;
    }

    completeLogin(pendingUser, pendingRoles, pendingRole);
    setPendingUser(null);
    setPendingRoles([]);
    setPendingRole("");
    setLoginError("");
  }


  /*
  =======================================================
  BACK TO LOGIN
  =======================================================
  */

  function handleBackToLogin() {
    setPendingUser(null);
    setPendingRoles([]);
    setPendingRole("");
    setLoginError("");
    setPassword("");
  }


  /*
  =======================================================
  ROLE CHANGE (in-app switcher)
  =======================================================
  */

  function handleRoleChange(newRole) {
    if (!availableRoles.includes(newRole)) return;
    setSelectedRole(newRole);
    localStorage.setItem("ufdeRole", newRole);
    setCurrentPage("dashboard");
  }


  /*
  =======================================================
  LOGOUT
  =======================================================
  */

  function handleLogout() {
    setUser(null);
    setAvailableRoles([]);
    setSelectedRole(null);
    setCurrentPage("dashboard");
    setUsername("");
    setPassword("");
    setLoginError("");
    setPendingUser(null);
    setPendingRoles([]);
    setPendingRole("");
    localStorage.removeItem("ufdeUser");
    localStorage.removeItem("ufdeRoles");
    localStorage.removeItem("ufdeRole");
  }


  /*
  =======================================================
  NAVIGATE
  =======================================================
  */

  function handleNavigate(page) {
    setCurrentPage(page);
  }


  /*
  =======================================================
  NOT LOGGED IN
  =======================================================
  */

  if (!user) {

    /* Multi-role selection screen */
    if (pendingUser && pendingRoles.length > 1) {
      return (
        <div className="login-page">
          <div className="login-card">

            <div className="login-header">
              <div className="login-logo">UFDE</div>
              <h1>Unified Fraud Detection Engine</h1>
              <p>Secure fraud analysis platform</p>
            </div>

            <div className="login-role-selection">
              <label htmlFor="login-role">Select Role</label>

              <select
                id="login-role"
                value={pendingRole}
                onChange={(event) => {
                  setPendingRole(event.target.value);
                  setLoginError("");
                }}
                className="login-role-select"
              >
                {pendingRoles.map((role) => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>

              {loginError && (
                <div className="login-error">{loginError}</div>
              )}

              <button
                type="button"
                className="login-button"
                onClick={handleRoleContinue}
              >
                CONTINUE
              </button>

              <button
                type="button"
                className="login-back-button"
                onClick={handleBackToLogin}
              >
                Back to Login
              </button>
            </div>

          </div>
        </div>
      );
    }

    /* Normal login screen */
    return (
      <div className="login-page">
        <div className="login-card">

          <div className="login-header">
            <div className="login-logo">UFDE</div>
            <h1>Unified Fraud Detection Engine</h1>
            <p>Secure fraud analysis platform</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>

            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                disabled={loginLoading}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                disabled={loginLoading}
              />
            </div>

            {loginError && (
              <div className="login-error">{loginError}</div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loginLoading}
            >
              {loginLoading ? "AUTHENTICATING..." : "LOGIN"}
            </button>

          </form>

        </div>
      </div>
    );
  }


  /*
  =======================================================
  UPLOAD PAGE
  =======================================================
  */

  if (currentPage === "upload") {
    return (
      <Upload
        role={selectedRole}
        user={user}
        onLogout={handleLogout}
        onBack={() => setCurrentPage("dashboard")}
        onAnalyzeComplete={() => setCurrentPage("dashboard")}
      />
    );
  }


  /*
  =======================================================
  DASHBOARD (Transactions)
  =======================================================
  */

  return (
    <Transactions
      role={selectedRole}
      user={user}
      availableRoles={availableRoles}
      onRoleChange={handleRoleChange}
      onLogout={handleLogout}
      onNavigate={handleNavigate}
      darkMode={darkMode}
      onDarkModeChange={setDarkMode}
    />
  );
}


export default App;