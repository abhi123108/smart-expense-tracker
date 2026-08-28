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

// =====================================================
// BACKEND BASE URL
// =====================================================

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "";

export default function Navbar() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  // =====================================================
  // DARK MODE
  // =====================================================

  const [darkMode, setDarkMode] = useState(() => {
    return (
      localStorage.getItem("expenseai-theme") === "dark"
    );
  });

  useEffect(() => {
    document.body.classList.toggle(
      "dark-mode",
      darkMode
    );

    localStorage.setItem(
      "expenseai-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((previous) => !previous);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // =====================================================
  // USER INFORMATION
  // =====================================================

  const userName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    "User";

  const userEmail =
    user?.email ||
    "ExpenseAI User";

  // =====================================================
  // AVATAR INITIALS
  // =====================================================

  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0)
      )
      .join("")
      .toUpperCase() || "U";

  // =====================================================
  // PROFILE IMAGE
  // =====================================================

  let profileImageUrl = null;

  if (user?.profilePicture) {
    const picture = user.profilePicture;

    // Google profile photo
    if (
      picture.startsWith(
        "https://lh3.googleusercontent.com/"
      )
    ) {
      profileImageUrl =
        `${API_BASE_URL}/api/auth/google-photo?url=${encodeURIComponent(
          picture
        )}`;
    }

    // Other external image URL
    else if (picture.startsWith("http")) {
      profileImageUrl = picture;
    }

    // Local uploaded image
    else {
      profileImageUrl =
        `${API_BASE_URL}${picture}`;
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <aside className="navbar">

      {/* =================================================
          BRAND
      ================================================= */}

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

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <div className="nav-section-label">
        Workspace
      </div>

      <nav className="nav-menu">

        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-link ${
                isActive ? "active" : ""
              }`
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

      {/* =================================================
          BOTTOM AREA
      ================================================= */}

      <div className="nav-bottom">

        {/* =================================================
            DARK MODE
        ================================================= */}

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

        {/* =================================================
            LOGGED-IN USER
        ================================================= */}

        <div className="user-mini">

          {/* PROFILE AVATAR */}

          <div
            className="avatar"
            style={{
              width: "42px",
              height: "42px",
              minWidth: "42px",
              minHeight: "42px",
              borderRadius: "50%",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >

            {profileImageUrl ? (

              <img
                src={profileImageUrl}
                alt={`${userName} profile`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                  display: "block",
                }}
                onError={(event) => {
                  console.error(
                    "Profile image failed to load:",
                    profileImageUrl
                  );

                  event.currentTarget.style.display =
                    "none";
                }}
              />

            ) : (

              <span>
                {initials}
              </span>

            )}

          </div>

          {/* USER DETAILS */}

          <div className="user-copy">

            <strong>
              {userName}
            </strong>

            <span>
              {userEmail}
            </span>

          </div>

        </div>

        {/* =================================================
            LOGOUT
        ================================================= */}

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