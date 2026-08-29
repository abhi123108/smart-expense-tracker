import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';

// =====================================================
// AUTH PAGES
// =====================================================

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// =====================================================
// APPLICATION PAGES
// =====================================================

import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import ScanBill from './pages/ScanBill';
import Reports from './pages/Reports';
import Budget from './pages/Budget';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// =====================================================
// PROTECTED LAYOUT
// =====================================================

function ProtectedLayout({ children }) {
  const { isAuthenticated } = useAuth();

  // User is not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      {/* Sidebar / Navbar */}
      <Navbar />

      {/* Page Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

// =====================================================
// APP
// =====================================================

export default function App() {
  return (
    <Routes>

      {/* =================================================
          PUBLIC AUTHENTICATION ROUTES
          ================================================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password/:token"
        element={<ResetPassword />}
      />


      {/* =================================================
          PROTECTED APPLICATION ROUTES
          ================================================= */}

      {/* Dashboard */}
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />

      {/* Add Expense */}
      <Route
        path="/add"
        element={
          <ProtectedLayout>
            <AddExpense />
          </ProtectedLayout>
        }
      />

      {/* Scan Receipt */}
      <Route
        path="/scan"
        element={
          <ProtectedLayout>
            <ScanBill />
          </ProtectedLayout>
        }
      />

      {/* Reports & AI */}
      <Route
        path="/reports"
        element={
          <ProtectedLayout>
            <Reports />
          </ProtectedLayout>
        }
      />

      {/* Budgets */}
      <Route
        path="/budget"
        element={
          <ProtectedLayout>
            <Budget />
          </ProtectedLayout>
        }
      />

      {/* Profile */}
      <Route
        path="/profile"
        element={
          <ProtectedLayout>
            <Profile />
          </ProtectedLayout>
        }
      />

      {/* =================================================
          SETTINGS
          ================================================= */}

      <Route
        path="/settings"
        element={
          <ProtectedLayout>
            <Settings />
          </ProtectedLayout>
        }
      />


      {/* =================================================
          UNKNOWN ROUTE
          ================================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}