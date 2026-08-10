import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

import { CategoryPieChart } from "../components/SpendingChart";
import ExpenseList from "../components/ExpenseList";
import BudgetAlert from "../components/BudgetAlert";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function Dashboard() {

  /* =========================
     AUTH USER
  ========================= */

  const { user } = useAuth();

  const userName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    "User";

  /* =========================
     STATE
  ========================= */

  const [summary, setSummary] = useState(null);

  const [recentExpenses, setRecentExpenses] =
    useState([]);

  const [alerts, setAlerts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  /* =========================
     LOAD DASHBOARD DATA
  ========================= */

  const loadData = async () => {

    setLoading(true);

    try {

      const [
        summaryRes,
        expensesRes,
        alertsRes,
      ] = await Promise.all([

        api.get("/expenses/summary"),

        api.get(
          "/expenses?limit=5&sort=-date"
        ),

        api.get("/budgets/alerts"),

      ]);

      setSummary(summaryRes.data);

      setRecentExpenses(
        expensesRes.data.expenses || []
      );

      setAlerts(
        alertsRes.data || []
      );

    } catch (err) {

      console.error(
        "Dashboard loading error:",
        err
      );

    } finally {

      setLoading(false);

    }
  };

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    loadData();
  }, []);

  /* =========================
     DELETE EXPENSE
  ========================= */

  const handleDelete = async (id) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) {
      return;
    }

    try {

      await api.delete(
        `/expenses/${id}`
      );

      await loadData();

    } catch (err) {

      console.error(
        "Delete expense error:",
        err
      );

      alert(
        "Unable to delete this expense."
      );

    }
  };

  /* =========================
     LOADING
  ========================= */

  if (loading) {

    return (
      <div
        style={{
          minHeight: "60vh",
          display: "grid",
          placeItems: "center",
        }}
      >
        <div className="spinner" />
      </div>
    );

  }

  /* =========================
     DASHBOARD
  ========================= */

  return (
    <div>

      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="page-header">

        <div>

          <h1>
            Dashboard
          </h1>

          <p>
            A clear view of where your money is going.
          </p>

        </div>

        <div className="header-actions">

          <Link
            to="/add"
            className="btn btn-primary"
          >
            + Add expense
          </Link>

        </div>

      </div>

      {/* =========================
          WELCOME HERO
      ========================= */}

      <div className="hero-bar">

        <div>

          <h2>
            Welcome, {userName} 👋
          </h2>

          <p>
            Stay on top of your spending and keep
            your monthly goals on track.
          </p>

        </div>

        <div className="hero-chip">
          Live financial overview
        </div>

      </div>

      {/* =========================
          BUDGET ALERTS
      ========================= */}

      <BudgetAlert
        alerts={alerts}
      />

      {/* =========================
          STAT CARDS
      ========================= */}

      <div
        className="grid grid-3"
        style={{
          marginBottom: 20,
        }}
      >

        {/* TODAY */}

        <div className="card stat-card">

          <div className="stat-top">

            <div className="stat-label">
              Today
            </div>

            <div className="stat-icon">
              ◷
            </div>

          </div>

          <div className="stat-value">
            {money(
              summary?.todayTotal
            )}
          </div>

          <div className="stat-foot">
            Your spending for today
          </div>

        </div>

        {/* WEEK */}

        <div className="card stat-card">

          <div className="stat-top">

            <div className="stat-label">
              This week
            </div>

            <div className="stat-icon">
              ◫
            </div>

          </div>

          <div className="stat-value">
            {money(
              summary?.weekTotal
            )}
          </div>

          <div className="stat-foot">
            Rolling weekly total
          </div>

        </div>

        {/* MONTH */}

        <div className="card stat-card">

          <div className="stat-top">

            <div className="stat-label">
              This month
            </div>

            <div className="stat-icon">
              ₹
            </div>

          </div>

          <div className="stat-value">
            {money(
              summary?.monthTotal
            )}
          </div>

          {summary?.overallBudget ? (

            <div className="stat-foot">

              {summary.overallBudget.percentUsed}
              % of{" "}
              {money(
                summary.overallBudget.limit
              )}
              {" "}budget

            </div>

          ) : (

            <div className="stat-foot">
              No monthly budget set
            </div>

          )}

        </div>

      </div>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <div className="grid grid-2">

        {/* =========================
            CATEGORY CHART
        ========================= */}

        <div className="card">

          <div className="panel-heading">

            <div>

              <h3>
                Spending by category
              </h3>

              <div className="muted">
                Where your money is going
              </div>

            </div>

          </div>

          <CategoryPieChart
            data={
              summary?.categoryBreakdown
            }
          />

        </div>

        {/* =========================
            RECENT TRANSACTIONS
        ========================= */}

        <div className="card">

          <div className="panel-heading">

            <div>

              <h3>
                Recent transactions
              </h3>

              <div className="muted">
                Your latest activity
              </div>

            </div>

            <Link
              to="/add"
              className="muted"
              style={{
                color:
                  "var(--primary)",
                fontWeight: 800,
              }}
            >
              + Add
            </Link>

          </div>

          <ExpenseList
            expenses={
              recentExpenses
            }
            onDelete={
              handleDelete
            }
          />

        </div>

      </div>

    </div>
  );
}