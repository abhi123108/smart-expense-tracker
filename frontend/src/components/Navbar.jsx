import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  {
    path: "/",
    label: "Dashboard",
    icon: "▦",
  },
  {
    path: "/add",
    label: "Add Expense",
    icon: "＋",
  },
  {
    path: "/scan",
    label: "Scan Receipt",
    icon: "▣",
  },
  {
    path: "/reports",
    label: "Reports & AI",
    icon: "◔",
  },
  {
    path: "/budget",
    label: "Budgets",
    icon: "◈",
  },
];

export default function Navbar() {
  const navigate = useNavigate();

  // Get logged-in user directly from AuthContext
  const { user, logout } = useAuth();

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("expenseai-theme") === "dark";
  });

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);

    localStorage.setItem(
      "expenseai-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((previous) => !previous);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // User information
  const userName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    "User";

  const userEmail =
    user?.email ||
    "ExpenseAI User";

  // Avatar initials
  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "U";

  return (
    <aside className="navbar">

      {/* =========================
          BRAND
      ========================= */}

      <div className="brand-lockup">

        <div className="brand-mark">
          ₹
        </div>

        <div>
          <div className="navbar-brand">
            Expense<span>AI</span>
          </div>

          <div className="brand-caption">
            SMART FINANCE
          </div>
        </div>

      </div>

      {/* =========================
          NAVIGATION
      ========================= */}

      <div className="nav-section-label">
        Workspace
      </div>

      <nav className="nav-menu">

        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">
              {item.icon}
            </span>

            <span>
              {item.label}
            </span>
          </NavLink>
        ))}

      </nav>

      {/* =========================
          BOTTOM AREA
      ========================= */}

      <div className="nav-bottom">

        {/* DARK MODE */}

        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
        >
          <span className="theme-toggle-left">

            <span className="theme-toggle-icon">
              {darkMode ? "☀" : "☾"}
            </span>

            <span>
              {darkMode
                ? "Light Mode"
                : "Dark Mode"}
            </span>

          </span>

          <span className="theme-switch">
            <span className="theme-switch-dot" />
          </span>

        </button>

        {/* =========================
            LOGGED-IN USER
        ========================= */}

        <div className="user-mini">

          <div className="avatar">
            {initials}
          </div>

          <div className="user-copy">

            <strong>
              {userName}
            </strong>

            <span>
              {userEmail}
            </span>

          </div>

        </div>

        {/* =========================
            LOGOUT
        ========================= */}

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          ↪ &nbsp; Sign out
        </button>

      </div>

    </aside>
  );
}