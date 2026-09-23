import { useState, useEffect } from "react";

import Transactions from "./pages/Transactions";
import Upload from "./pages/Upload";

import "./App.css";

/*
=========================================================
TEMPORARY FRONTEND USER DATABASE
=========================================================

This is only for frontend development/demo.

Later M1/backend will replace this with:

POST /api/auth/login

Do NOT keep real passwords in frontend code.
*/

const DEMO_USERS = [
  {
    id: "USR001",
    username: "ram",
    password: "ram123",
    name: "Ram",

    roles: [
      "admin",
      "analyzer",
      "user",
    ],
  },

  {
    id: "USR002",
    username: "kumar",
    password: "kumar123",
    name: "Kumar",

    roles: [
      "analyzer",
    ],
  },

  {
    id: "USR003",
    username: "priya",
    password: "priya123",
    name: "Priya",

    roles: [
      "admin",
      "user",
    ],
  },
];


function App() {

  /*
  =======================================================
  DARK MODE
  =======================================================

  false = current/light CSS

  true = dark background + red theme

  The setting is saved in localStorage so it survives
  page refreshes.
  =======================================================
  */

  const [darkMode, setDarkMode] = useState(() => {

    return (
      localStorage.getItem("ufdeDarkMode") === "true"
    );

  });


  /*
  =======================================================
  APPLY DARK MODE
  =======================================================
  */

  useEffect(() => {

    document.body.classList.toggle(
      "ufde-dark-mode",
      darkMode
    );


    localStorage.setItem(
      "ufdeDarkMode",
      String(darkMode)
    );

  }, [darkMode]);


  /*
  =======================================================
  RESTORE USER SESSION
  =======================================================
  */

  const [user, setUser] = useState(() => {

    const savedUser =
      localStorage.getItem("ufdeUser");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("ufdeUser");
      return null;
    }

  });


  /*
  =======================================================
  RESTORE AVAILABLE ROLES
  =======================================================
  */

  const [availableRoles, setAvailableRoles] = useState(() => {

    const savedRoles =
      localStorage.getItem("ufdeRoles");

    if (!savedRoles) {
      return [];
    }

    try {
      return JSON.parse(savedRoles);
    } catch {
      localStorage.removeItem("ufdeRoles");
      return [];
    }

  });


  /*
  =======================================================
  RESTORE CURRENT ROLE
  =======================================================
  */

  const [selectedRole, setSelectedRole] = useState(() => {

    return localStorage.getItem("ufdeRole");

  });


  /*
  =======================================================
  CURRENT PAGE
  =======================================================
  */

  const [currentPage, setCurrentPage] =
    useState("dashboard");


  /*
  =======================================================
  LOGIN FORM
  =======================================================
  */

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loginError, setLoginError] =
    useState("");

  const [loginLoading, setLoginLoading] =
    useState(false);


  /*
  =======================================================
  LOGIN ROLE SELECTION
  =======================================================

  When a user has multiple roles, these states are
  used before creating the active session.
  =======================================================
  */

  const [pendingUser, setPendingUser] =
    useState(null);

  const [pendingRoles, setPendingRoles] =
    useState([]);

  const [pendingRole, setPendingRole] =
    useState("");


  /*
  =======================================================
  LOGIN
  =======================================================
  */

  function handleLogin(event) {

    event.preventDefault();

    setLoginError("");


    /*
    -------------------------------------------------------
    VALIDATE FIELDS
    -------------------------------------------------------
    */

    if (
      !username.trim() ||
      !password.trim()
    ) {

      setLoginError(
        "Please enter username and password."
      );

      return;
    }


    setLoginLoading(true);


    /*
    -------------------------------------------------------
    TEMPORARY DATABASE CHECK
    -------------------------------------------------------

    Later replace this with:

    POST /api/auth/login
    */

    setTimeout(() => {

      const foundUser =
        DEMO_USERS.find(
          (demoUser) =>
            demoUser.username.toLowerCase() ===
              username.trim().toLowerCase() &&
            demoUser.password === password
        );


      /*
      -----------------------------------------------------
      INVALID LOGIN
      -----------------------------------------------------
      */

      if (!foundUser) {

        setLoginError(
          "Invalid username or password."
        );

        setLoginLoading(false);

        return;
      }


      /*
      -----------------------------------------------------
      GET USER ROLES
      -----------------------------------------------------
      */

      const roles =
        foundUser.roles || [];


      /*
      -----------------------------------------------------
      SAFETY CHECK
      -----------------------------------------------------
      */

      if (roles.length === 0) {

        setLoginError(
          "No valid UFDE role is assigned to this account."
        );

        setLoginLoading(false);

        return;
      }


      /*
      -----------------------------------------------------
      CREATE USER DATA
      -----------------------------------------------------
      */

      const userData = {

        id: foundUser.id,

        username: foundUser.username,

        name: foundUser.name,

      };


      /*
      -----------------------------------------------------
      ONE ROLE
      -----------------------------------------------------

      If the user has only one role:

      Login
        ↓
      Dashboard

      No role dropdown is shown.
      */

      if (roles.length === 1) {

        const onlyRole =
          roles[0];


        /*
        Save user
        */

        setUser(userData);

        setAvailableRoles(roles);

        setSelectedRole(onlyRole);


        /*
        Save session
        */

        localStorage.setItem(
          "ufdeUser",
          JSON.stringify(userData)
        );

        localStorage.setItem(
          "ufdeRoles",
          JSON.stringify(roles)
        );

        localStorage.setItem(
          "ufdeRole",
          onlyRole
        );


        /*
        Go directly to dashboard
        */

        setCurrentPage("dashboard");


        /*
        Clear login form
        */

        setUsername("");

        setPassword("");

        setLoginLoading(false);

        return;
      }


      /*
      -----------------------------------------------------
      MULTIPLE ROLES
      -----------------------------------------------------

      If the user has multiple roles:

      Login
        ↓
      Select Role
        ↓
      Continue
        ↓
      Dashboard
      */

      setPendingUser(userData);

      setPendingRoles(roles);


      /*
      Default to the first available role.
      */

      setPendingRole(roles[0]);


      /*
      Clear password
      */

      setPassword("");

      setLoginLoading(false);

    }, 500);
  }


  /*
  =======================================================
  CONTINUE AFTER ROLE SELECTION
  =======================================================
  */

  function handleRoleContinue() {

    /*
    -----------------------------------------------------
    SAFETY CHECK
    -----------------------------------------------------
    */

    if (!pendingUser) {
      return;
    }


    if (
      !pendingRoles.includes(
        pendingRole
      )
    ) {

      setLoginError(
        "Please select a valid role."
      );

      return;
    }


    /*
    -----------------------------------------------------
    CREATE ACTIVE SESSION
    -----------------------------------------------------
    */

    setUser(pendingUser);

    setAvailableRoles(
      pendingRoles
    );

    setSelectedRole(
      pendingRole
    );


    /*
    -----------------------------------------------------
    SAVE SESSION
    -----------------------------------------------------
    */

    localStorage.setItem(
      "ufdeUser",
      JSON.stringify(
        pendingUser
      )
    );

    localStorage.setItem(
      "ufdeRoles",
      JSON.stringify(
        pendingRoles
      )
    );

    localStorage.setItem(
      "ufdeRole",
      pendingRole
    );


    /*
    -----------------------------------------------------
    GO TO DASHBOARD
    -----------------------------------------------------
    */

    setCurrentPage("dashboard");


    /*
    -----------------------------------------------------
    CLEAR LOGIN STATE
    -----------------------------------------------------
    */

    setUsername("");

    setPassword("");

    setLoginError("");

    setPendingUser(null);

    setPendingRoles([]);

    setPendingRole("");

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
  ROLE CHANGE
  =======================================================

  This is used by the role dropdown
  in the Transactions header.

  IMPORTANT:

  The user can ONLY switch to a role
  that exists in availableRoles.
  =======================================================
  */

  function handleRoleChange(newRole) {

    /*
    Security check
    */

    if (
      !availableRoles.includes(
        newRole
      )
    ) {
      return;
    }


    /*
    Change current role
    */

    setSelectedRole(newRole);


    /*
    Save current role
    */

    localStorage.setItem(
      "ufdeRole",
      newRole
    );


    /*
    Always return to dashboard
    after changing role.
    */

    setCurrentPage("dashboard");

  }


  /*
  =======================================================
  LOGOUT
  =======================================================
  */

  function handleLogout() {

    /*
    Clear React state
    */

    setUser(null);

    setAvailableRoles([]);

    setSelectedRole(null);

    setCurrentPage("dashboard");


    /*
    Clear login form
    */

    setUsername("");

    setPassword("");

    setLoginError("");


    /*
    Clear pending role state
    */

    setPendingUser(null);

    setPendingRoles([]);

    setPendingRole("");


    /*
    Clear local session
    */

    localStorage.removeItem(
      "ufdeUser"
    );

    localStorage.removeItem(
      "ufdeRoles"
    );

    localStorage.removeItem(
      "ufdeRole"
    );

  }


  /*
  =======================================================
  NAVIGATION
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

    /*
    =====================================================
    MULTIPLE ROLE SELECTION
    =====================================================
    */

    if (
      pendingUser &&
      pendingRoles.length > 1
    ) {

      return (

        <div className="login-page">

          <div className="login-card">

            {/* ==========================================
                LOGIN HEADER
            ========================================== */}

            <div className="login-header">

              <div className="login-logo">
                UFDE
              </div>


              <h1>
                Unified Fraud Detection Engine
              </h1>


              <p>
                Secure fraud analysis platform
              </p>

            </div>


            {/* ==========================================
                ROLE SELECTION
            ========================================== */}

            <div className="login-role-selection">

              <label
                htmlFor="login-role"
              >
                Select Role
              </label>


              <select
                id="login-role"
                value={pendingRole}
                onChange={(event) => {

                  setPendingRole(
                    event.target.value
                  );

                  setLoginError("");

                }}
                className="login-role-select"
              >

                {pendingRoles.map(
                  (role) => (

                    <option
                      key={role}
                      value={role}
                    >
                      {role
                        .charAt(0)
                        .toUpperCase() +
                        role.slice(1)}
                    </option>

                  )
                )}

              </select>


              {/* ERROR */}

              {loginError && (

                <div className="login-error">

                  {loginError}

                </div>

              )}


              {/* CONTINUE */}

              <button
                type="button"
                className="login-button"
                onClick={
                  handleRoleContinue
                }
              >
                CONTINUE
              </button>


              {/* BACK */}

              <button
                type="button"
                className="login-back-button"
                onClick={
                  handleBackToLogin
                }
              >
                Back to Login
              </button>

            </div>

          </div>

        </div>

      );
    }


    /*
    =====================================================
    NORMAL LOGIN
    =====================================================
    */

    return (

      <div className="login-page">

        <div className="login-card">


          {/* ============================================
              LOGIN HEADER
          ============================================ */}

          <div className="login-header">

            <div className="login-logo">
              UFDE
            </div>


            <h1>
              Unified Fraud Detection Engine
            </h1>


            <p>
              Secure fraud analysis platform
            </p>

          </div>


          {/* ============================================
              LOGIN FORM
          ============================================ */}

          <form
            className="login-form"
            onSubmit={handleLogin}
          >

            {/* USERNAME */}

            <div className="form-group">

              <label>
                Username
              </label>


              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                autoComplete="username"
                disabled={loginLoading}
              />

            </div>


            {/* PASSWORD */}

            <div className="form-group">

              <label>
                Password
              </label>


              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                autoComplete="current-password"
                disabled={loginLoading}
              />

            </div>


            {/* ERROR */}

            {loginError && (

              <div className="login-error">

                {loginError}

              </div>

            )}


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-button"
              disabled={loginLoading}
            >

              {loginLoading
                ? "AUTHENTICATING..."
                : "LOGIN"}

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

  This remains available only if another component
  explicitly navigates to "upload".
  =======================================================
  */

  if (currentPage === "upload") {

    return (

      <Upload
        role={selectedRole}
        user={user}
        onLogout={handleLogout}
        onBack={() =>
          setCurrentPage("dashboard")
        }
      />

    );

  }


  /*
  =======================================================
  DASHBOARD
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

      /*
      -----------------------------------------------------
      DARK MODE
      -----------------------------------------------------
      */

      darkMode={darkMode}
      onDarkModeChange={setDarkMode}
    />

  );

}


export default App;