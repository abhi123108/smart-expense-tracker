import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // =====================================================
  // THEME
  // =====================================================

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleThemeToggle = () => {
    setDarkMode((prev) => !prev);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // =====================================================
  // PROFILE IMAGE
  // =====================================================

  const getProfileImage = () => {
    if (!user?.profilePicture) {
      return null;
    }

    if (
      user.profilePicture.startsWith('http://') ||
      user.profilePicture.startsWith('https://')
    ) {
      return user.profilePicture;
    }

    return `http://localhost:5000${user.profilePicture}`;
  };

  const profileImage = getProfileImage();

  // =====================================================
  // ACTIVE NAV STYLE
  // =====================================================

  const navClass = ({ isActive }) =>
    `nav-link ${isActive ? 'active' : ''}`;

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
          WORKSPACE
      ================================================= */}

      <div className="nav-section-label">
        Workspace
      </div>

      <nav className="nav-menu">

        {/* Dashboard */}
        <NavLink
          to="/"
          end
          className={navClass}
        >
          <span className="nav-icon">
            ▦
          </span>

          <span>
            Dashboard
          </span>
        </NavLink>

        {/* Add Expense */}
        <NavLink
          to="/add"
          className={navClass}
        >
          <span className="nav-icon">
            +
          </span>

          <span>
            Add Expense
          </span>
        </NavLink>

        {/* Scan Receipt */}
        <NavLink
          to="/scan"
          className={navClass}
        >
          <span className="nav-icon">
            □
          </span>

          <span>
            Scan Receipt
          </span>
        </NavLink>

        {/* Reports */}
        <NavLink
          to="/reports"
          className={navClass}
        >
          <span className="nav-icon">
            ◉
          </span>

          <span>
            Reports &amp; AI
          </span>
        </NavLink>

        {/* Budget */}
        <NavLink
          to="/budget"
          className={navClass}
        >
          <span className="nav-icon">
            ◇
          </span>

          <span>
            Budgets
          </span>
        </NavLink>

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
          onClick={handleThemeToggle}
          aria-label={
            darkMode
              ? 'Switch to light mode'
              : 'Switch to dark mode'
          }
        >
          <span className="theme-toggle-left">

            <span className="theme-toggle-icon">
              {darkMode ? '☀' : '☾'}
            </span>

            <span>
              {darkMode
                ? 'Dark Mode'
                : 'Light Mode'}
            </span>

          </span>

          <span className="theme-switch">
            <span className="theme-switch-dot" />
          </span>
        </button>

        {/* =================================================
            SETTINGS
        ================================================= */}

        <NavLink
          to="/settings"
          className={navClass}
        >
          <span className="nav-icon">
            ⚙
          </span>

          <span>
            Settings
          </span>
        </NavLink>

        {/* =================================================
            USER PROFILE
        ================================================= */}

        <button
          type="button"
          className="user-mini"
          onClick={() => navigate('/profile')}
          aria-label="Open profile"
        >

          {/* Avatar */}

          <div className="avatar">

            {profileImage ? (
              <img
                src={profileImage}
                alt={user?.name || 'Profile'}
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              user?.name
                ? user.name.charAt(0).toUpperCase()
                : 'U'
            )}

          </div>

          {/* User information */}

          <div className="user-copy">

            <strong>
              {user?.name || 'User'}
            </strong>

            <span>
              {user?.email || 'user@email.com'}
            </span>

          </div>

          {/* Arrow */}

          <span className="profile-arrow">
            ›
          </span>

        </button>

        {/* =================================================
            LOGOUT
        ================================================= */}

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          <span>
            ↪
          </span>

          <span>
            Sign out
          </span>
        </button>

      </div>

    </aside>
  );
}