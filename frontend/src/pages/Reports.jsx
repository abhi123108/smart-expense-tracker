import { useEffect, useState } from "react";

import api from "../api/axios";

import {
  CategoryPieChart,
  DailyTrendChart,
  MonthlyTrendLine,
} from "../components/SpendingChart";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function Reports() {
  const now = new Date();

  const [year, setYear] =
    useState(now.getFullYear());

  const [month, setMonth] =
    useState(now.getMonth() + 1);

  const [report, setReport] =
    useState(null);

  const [prediction, setPrediction] =
    useState(null);

  const [aiInsights, setAIInsights] =
    useState("");

  const [aiLoading, setAILoading] =
    useState(false);

  const [aiError, setAIError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  // ===================================================
  // LOAD REPORT DATA
  // ===================================================

  const loadData = async () => {
    setLoading(true);

    try {
      const [
        reportRes,
        predictionRes,
      ] = await Promise.all([
        api.get(
          `/reports/monthly?year=${year}&month=${month}`
        ),

        api.get(
          "/reports/prediction"
        ),
      ]);

      setReport(
        reportRes.data
      );

      setPrediction(
        predictionRes.data
      );

      // Reset AI result when month changes
      setAIInsights("");
      setAIError("");
    } catch (err) {
      console.error(
        "Reports loading error:",
        err
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  // ===================================================
  // GENERATE OPENAI INSIGHTS
  // ===================================================

  const generateAIInsights = async () => {
  setAILoading(true);
  setAIError("");

  try {
    const response = await api.get(
      `/reports/ai-insights?year=${year}&month=${month}`
    );

    setAIInsights(response.data.aiInsights);
  } catch (err) {
    console.error("AI insight error:", err);

    const status = err.response?.status;

    if (status === 401 || status === 429) {
      setAIError(
        "🤖 AI Insights temporarily unavailable. Your statistical spending analysis is still available below."
      );
    } else {
      setAIError(
        "🤖 AI Insights temporarily unavailable. Your statistical spending analysis is still available below."
      );
    }
  } finally {
    setAILoading(false);
  }
};

  // ===================================================
  // LOADING
  // ===================================================

  if (
    loading &&
    !report
  ) {
    return (
      <div
        className="spinner"
        style={{
          margin: "60px auto",
        }}
      />
    );
  }

  // ===================================================
  // CHART DATA
  // ===================================================

  const trendData =
    prediction?.monthlyTotals?.map(
      (m) => ({
        month: m.month,
        total: m.total,
      })
    ) || [];

  if (
    prediction?.prediction
      ?.predictedAmount
  ) {
    trendData.push({
      month:
        "Next (predicted)",

      total:
        prediction.prediction
          .predictedAmount,
    });
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <div>

      {/* ==========================================
          PAGE HEADER
      =========================================== */}

      <div className="page-header">

        <div>

          <h1>
            Reports & AI Insights
          </h1>

          <p>
            Understand your spending
            and get personalized
            recommendations.
          </p>

        </div>


        {/* MONTH SELECTOR */}

        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >

          <select
            value={month}
            onChange={(e) =>
              setMonth(
                Number(e.target.value)
              )
            }
          >

            {MONTH_NAMES.map(
              (m, index) => (
                <option
                  key={m}
                  value={index + 1}
                >
                  {m}
                </option>
              )
            )}

          </select>


          <select
            value={year}
            onChange={(e) =>
              setYear(
                Number(e.target.value)
              )
            }
          >

            {[
              year - 1,
              year,
              year + 1,
            ].map((y) => (
              <option
                key={y}
                value={y}
              >
                {y}
              </option>
            ))}

          </select>

        </div>

      </div>


      {/* ==========================================
          AI INSIGHT CARD
      =========================================== */}

      <div
        className="card"
        style={{
          marginBottom: 20,
          background:
            "linear-gradient(135deg, #171b31, #30346f)",
          color: "#fff",
          border: "none",
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent:
              "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >

          <div
            style={{
              flex: 1,
              minWidth: 260,
            }}
          >

            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1,
                opacity: 0.7,
                marginBottom: 8,
              }}
            >
              EXPENSEAI
            </div>


            <h2
              style={{
                margin:
                  "0 0 8px",
                color: "#fff",
              }}
            >
              🤖 AI Financial Advisor
            </h2>


            <p
              style={{
                margin: 0,
                color:
                  "rgba(255,255,255,.72)",
                lineHeight: 1.6,
              }}
            >
              Get a personalized
              analysis of your spending,
              budget risks and practical
              saving opportunities.
            </p>

          </div>


          <button
            type="button"
            className="btn btn-primary"
            onClick={
              generateAIInsights
            }
            disabled={aiLoading}
            style={{
              background: "#fff",
              color: "#4f46e5",
              border: "none",
              minWidth: 190,
            }}
          >
            {aiLoading
              ? "🤖 Analyzing..."
              : "✨ Generate AI Insights"}
          </button>

        </div>


        {/* AI ERROR */}

        {aiError && (
  <div
    style={{
      marginTop: 20,
      padding: "16px 18px",
      borderRadius: 12,
      background: "rgba(255,255,255,.08)",
      border: "1px solid rgba(255,255,255,.12)",
      color: "rgba(255,255,255,.82)",
      fontSize: 14,
      lineHeight: 1.6,
    }}
  >
    {aiError}
  </div>
)}


        {/* AI RESULT */}

        {aiInsights && (
          <div
            style={{
              marginTop: 24,
              padding: 24,
              borderRadius: 16,
              background:
                "rgba(255,255,255,.08)",
              lineHeight: 1.7,
              whiteSpace:
                "pre-wrap",
            }}
          >
            {aiInsights}
          </div>
        )}

      </div>


      {/* ==========================================
          SUMMARY CARDS
      =========================================== */}

      <div
        className="grid grid-3"
        style={{
          marginBottom: 20,
        }}
      >

        <div className="card">

          <div className="stat-label">
            Total Spent (
            {MONTH_NAMES[month - 1]}
            )
          </div>

          <div className="stat-value">
            ₹
            {report?.totalSpent
              ?.toLocaleString(
                "en-IN"
              ) || 0}
          </div>

        </div>


        <div className="card">

          <div className="stat-label">
            Transactions
          </div>

          <div className="stat-value">
            {report?.transactionCount ||
              0}
          </div>

        </div>


        <div className="card">

          <div className="stat-label">
            🤖 AI Predicted Next Month
          </div>

          <div className="stat-value">
            ₹
            {prediction?.prediction
              ?.predictedAmount
              ?.toLocaleString(
                "en-IN"
              ) || 0}
          </div>

          <div
            style={{
              fontSize: 12,
              color:
                "var(--text-muted)",
              marginTop: 4,
            }}
          >
            Trend:{" "}

            {prediction?.prediction
              ?.trend === "up"
              ? "📈 Rising"
              : prediction?.prediction
                  ?.trend === "down"
              ? "📉 Falling"
              : "➡️ Stable"}

            {" · "}

            Confidence:{" "}
            {prediction?.prediction
              ?.confidence ||
              "N/A"}

          </div>

        </div>

      </div>


      {/* ==========================================
          ANOMALIES
      =========================================== */}

      {prediction?.anomalies
        ?.length > 0 && (

        <div
          style={{
            marginBottom: 20,
          }}
        >

          {prediction.anomalies.map(
            (a, idx) => (

              <div
                key={idx}
                className="alert alert-info"
              >
                🤖 {a.message}
              </div>

            )
          )}

        </div>

      )}


      {/* ==========================================
          CHARTS
      =========================================== */}

      <div
        className="grid grid-2"
        style={{
          marginBottom: 20,
        }}
      >

        <div className="card">

          <h3
            style={{
              marginTop: 0,
            }}
          >
            Category Breakdown
          </h3>

          <CategoryPieChart
            data={
              report?.categoryBreakdown
            }
          />

        </div>


        <div className="card">

          <h3
            style={{
              marginTop: 0,
            }}
          >
            Daily Spending Trend
          </h3>

          <DailyTrendChart
            data={
              report?.dailyTrend
            }
          />

        </div>

      </div>


      {/* ==========================================
          SIX MONTH TREND
      =========================================== */}

      <div className="card">

        <h3
          style={{
            marginTop: 0,
          }}
        >
          6-Month Spending History
          + AI Prediction
        </h3>

        <MonthlyTrendLine
          data={trendData}
        />

      </div>

    </div>
  );
}