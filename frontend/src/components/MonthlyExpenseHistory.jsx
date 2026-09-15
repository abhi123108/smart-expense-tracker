import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const categoryIcons = {
  Food: "🍔",
  Transport: "🚗",
  Shopping: "🛍️",
  Entertainment: "🎬",
  Health: "💊",
  Bills: "🧾",
  Education: "🎓",
  Travel: "✈️",
  Other: "📦",
};

export default function MonthlyExpenseHistory() {
  const currentDate = new Date();

  const [month, setMonth] = useState(
    currentDate.getMonth() + 1
  );

  const [year, setYear] = useState(
    currentDate.getFullYear()
  );

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================
     LOAD MONTHLY HISTORY
  ========================= */

  useEffect(() => {
    const loadMonthlyHistory = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          `/expenses/history/monthly?month=${month}&year=${year}`
        );

        setData(response.data);
      } catch (err) {
        console.error(
          "Monthly history error:",
          err
        );

        setError(
          "Unable to load monthly expense history."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMonthlyHistory();
  }, [month, year]);

  /* =========================
     DATA
  ========================= */

  const expenses = data?.expenses || [];

  const categoryBreakdown =
    data?.categoryBreakdown || [];

  const totalExpense =
    Number(data?.summary?.totalExpense || 0);

  const totalTransactions =
    Number(
      data?.summary?.totalTransactions || 0
    );

  /* =========================
     CATEGORY DATA
  ========================= */

  const categories = useMemo(() => {
    return categoryBreakdown.map((item) => {
      const amount = Number(item.amount || 0);

      const percentage =
        totalExpense > 0
          ? (amount / totalExpense) * 100
          : 0;

      return {
        ...item,
        amount,
        percentage,
      };
    });
  }, [categoryBreakdown, totalExpense]);

  /* =========================
     YEAR OPTIONS
  ========================= */

  const years = [];

  for (
    let y = currentDate.getFullYear();
    y >= currentDate.getFullYear() - 5;
    y--
  ) {
    years.push(y);
  }

  /* =========================
     COMMON STYLES
  ========================= */

  const styles = {
    wrapper: {
      background:
        "var(--card, var(--surface, #ffffff))",
      border:
        "1px solid var(--border, #e5e7eb)",
      borderRadius: 18,
      overflow: "hidden",
      boxShadow:
        "0 8px 30px rgba(15, 23, 42, 0.06)",
    },

    header: {
      padding: "24px 26px",
      borderBottom:
        "1px solid var(--border, #e5e7eb)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 20,
      flexWrap: "wrap",
    },

    eyebrow: {
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color:
        "var(--primary, #4f46e5)",
      marginBottom: 6,
    },

    title: {
      margin: 0,
      fontSize: 24,
      fontWeight: 800,
      color:
        "var(--text, #0f172a)",
    },

    subtitle: {
      margin: "6px 0 0",
      fontSize: 13,
      color:
        "var(--muted, #64748b)",
    },

    select: {
      minWidth: 145,
      height: 44,
      padding: "0 14px",
      borderRadius: 10,
      border:
        "1px solid var(--border, #dbe1ea)",
      background:
        "var(--input-bg, var(--surface, #ffffff))",
      color:
        "var(--text, #0f172a)",
      fontWeight: 700,
      outline: "none",
      cursor: "pointer",
    },

    monthInfo: {
      padding: "18px 26px 0",
      color:
        "var(--muted, #64748b)",
      fontSize: 14,
      fontWeight: 600,
    },

    summaryGrid: {
      padding: "18px 26px 26px",
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 16,
    },

    summaryCard: {
      padding: 20,
      borderRadius: 14,
      background:
        "var(--surface, #f8fafc)",
      border:
        "1px solid var(--border, #e5e7eb)",
    },

    summaryIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      display: "grid",
      placeItems: "center",
      background:
        "var(--primary-soft, #eef2ff)",
      color:
        "var(--primary, #4f46e5)",
      fontWeight: 900,
      fontSize: 17,
    },

    summaryLabel: {
      fontSize: 13,
      fontWeight: 700,
      color:
        "var(--muted, #64748b)",
    },

    summaryValue: {
      fontSize: 30,
      fontWeight: 850,
      color:
        "var(--text, #0f172a)",
      lineHeight: 1,
    },

    summaryFoot: {
      marginTop: 9,
      fontSize: 13,
      color:
        "var(--muted, #64748b)",
    },

    contentGrid: {
      padding: "0 26px 28px",
      display: "grid",
      gridTemplateColumns:
        "minmax(0, 1fr) minmax(0, 1.25fr)",
      gap: 20,
    },

    innerCard: {
      border:
        "1px solid var(--border, #e5e7eb)",
      borderRadius: 14,
      padding: 20,
      minWidth: 0,
      background:
        "var(--card, var(--surface, #ffffff))",
    },

    innerTitle: {
      margin: 0,
      fontSize: 17,
      fontWeight: 800,
      color:
        "var(--text, #0f172a)",
    },

    badge: {
      padding: "6px 10px",
      borderRadius: 999,
      background:
        "var(--surface-2, #f1f5f9)",
      color:
        "var(--muted, #64748b)",
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: "nowrap",
    },

    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      display: "grid",
      placeItems: "center",
      background:
        "var(--surface-2, #f8fafc)",
      border:
        "1px solid var(--border, #e5e7eb)",
      flexShrink: 0,
    },

    progressTrack: {
      height: 7,
      background:
        "var(--surface-2, #eef2f7)",
      borderRadius: 999,
      overflow: "hidden",
    },

    progressBar: {
      height: "100%",
      background:
        "var(--primary, #4f46e5)",
      borderRadius: 999,
      transition:
        "width 0.3s ease",
    },

    transactionBorder: {
      borderBottom:
        "1px solid var(--border, #eef2f7)",
    },

    primaryText: {
      color:
        "var(--text, #0f172a)",
    },

    mutedText: {
      color:
        "var(--muted, #64748b)",
    },
  };

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <section
        className="card"
        style={styles.wrapper}
      >
        <div
          style={{
            minHeight: 300,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div>
            <div
              className="spinner"
              style={{
                margin: "0 auto 12px",
              }}
            />

            <div
              style={{
                textAlign: "center",
                ...styles.mutedText,
                fontSize: 13,
              }}
            >
              Loading expense history...
            </div>
          </div>
        </div>
      </section>
    );
  }

  /* =========================
     ERROR
  ========================= */

  if (error) {
    return (
      <section
        className="card"
        style={styles.wrapper}
      >
        <div
          style={{
            padding: 40,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 34,
              marginBottom: 10,
            }}
          >
            ⚠️
          </div>

          <h3
            style={{
              margin: "0 0 6px",
              ...styles.primaryText,
            }}
          >
            Something went wrong
          </h3>

          <p
            style={{
              margin: 0,
              ...styles.mutedText,
            }}
          >
            {error}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="monthly-expense-history"
      style={styles.wrapper}
    >

      {/* =========================
          HEADER
      ========================= */}

      <div style={styles.header}>

        <div>
          <div style={styles.eyebrow}>
            Expense History
          </div>

          <h2 style={styles.title}>
            Monthly spending overview
          </h2>

          <p style={styles.subtitle}>
            Track your expenses and spending patterns.
          </p>
        </div>

        {/* MONTH / YEAR */}

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >

          <select
            value={month}
            onChange={(e) =>
              setMonth(
                Number(e.target.value)
              )
            }
            style={styles.select}
            aria-label="Select month"
          >
            {MONTHS.map(
              (monthName, index) => (
                <option
                  key={monthName}
                  value={index + 1}
                >
                  {monthName}
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
            style={{
              ...styles.select,
              minWidth: 110,
            }}
            aria-label="Select year"
          >
            {years.map((y) => (
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

      {/* =========================
          MONTH INFO
      ========================= */}

      <div style={styles.monthInfo}>
        Showing expenses for{" "}
        <strong
          style={styles.primaryText}
        >
          {MONTHS[month - 1]} {year}
        </strong>
      </div>

      {/* =========================
          SUMMARY
      ========================= */}

      <div style={styles.summaryGrid}>

        {/* TOTAL EXPENSE */}

        <div style={styles.summaryCard}>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >

            <span
              style={styles.summaryLabel}
            >
              Total Expense
            </span>

            <span
              style={styles.summaryIcon}
            >
              ₹
            </span>

          </div>

          <div style={styles.summaryValue}>
            {money(totalExpense)}
          </div>

          <div style={styles.summaryFoot}>
            Total spending this month
          </div>

        </div>

        {/* TRANSACTIONS */}

        <div style={styles.summaryCard}>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >

            <span
              style={styles.summaryLabel}
            >
              Transactions
            </span>

            <span
              style={{
                ...styles.summaryIcon,
                background:
                  "var(--surface-2, #f1f5f9)",
              }}
            >
              ↗
            </span>

          </div>

          <div style={styles.summaryValue}>
            {totalTransactions}
          </div>

          <div style={styles.summaryFoot}>
            Expenses recorded
          </div>

        </div>

      </div>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <div
        className="monthly-history-grid"
        style={styles.contentGrid}
      >

        {/* =========================
            CATEGORY BREAKDOWN
        ========================= */}

        <div style={styles.innerCard}>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >

            <div>

              <h3
                style={styles.innerTitle}
              >
                Category Breakdown
              </h3>

              <div
                style={{
                  ...styles.mutedText,
                  marginTop: 4,
                  fontSize: 13,
                }}
              >
                Where your money went
              </div>

            </div>

            <div style={styles.badge}>
              {categories.length}{" "}
              {categories.length === 1
                ? "category"
                : "categories"}
            </div>

          </div>

          {categories.length === 0 ? (

            <div
              style={{
                padding: "35px 10px",
                textAlign: "center",
              }}
            >

              <div
                style={{
                  fontSize: 32,
                  marginBottom: 8,
                }}
              >
                📊
              </div>

              <div
                style={{
                  ...styles.primaryText,
                  fontWeight: 750,
                  marginBottom: 4,
                }}
              >
                No expenses
              </div>

              <div
                style={{
                  ...styles.mutedText,
                  fontSize: 13,
                }}
              >
                No spending recorded for
                this month.
              </div>

            </div>

          ) : (

            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
                gap: 18,
              }}
            >

              {categories.map(
                (item, index) => {

                  const icon =
                    categoryIcons[
                      item.category
                    ] || "📦";

                  return (
                    <div
                      key={`${item.category}-${index}`}
                    >

                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "space-between",
                          gap: 12,
                          marginBottom: 8,
                        }}
                      >

                        {/* LEFT */}

                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "center",
                            gap: 9,
                            minWidth: 0,
                          }}
                        >

                          <span
                            style={
                              styles.iconBox
                            }
                          >
                            {icon}
                          </span>

                          <span
                            style={{
                              ...styles.primaryText,
                              fontWeight: 750,
                              fontSize: 14,
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {item.category}
                          </span>

                        </div>

                        {/* RIGHT */}

                        <div
                          style={{
                            textAlign:
                              "right",
                            flexShrink: 0,
                          }}
                        >

                          <div
                            style={{
                              ...styles.primaryText,
                              fontWeight: 800,
                              fontSize: 14,
                            }}
                          >
                            {money(
                              item.amount
                            )}
                          </div>

                          <div
                            style={{
                              ...styles.mutedText,
                              fontSize: 12,
                              marginTop: 2,
                            }}
                          >
                            {item.percentage.toFixed(
                              1
                            )}
                            %
                          </div>

                        </div>

                      </div>

                      {/* PROGRESS */}

                      <div
                        style={
                          styles.progressTrack
                        }
                      >

                        <div
                          style={{
                            ...styles.progressBar,
                            width: `${Math.min(
                              item.percentage,
                              100
                            )}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </div>

        {/* =========================
            TRANSACTIONS
        ========================= */}

        <div style={styles.innerCard}>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
            }}
          >

            <div>

              <h3
                style={styles.innerTitle}
              >
                Transactions
              </h3>

              <div
                style={{
                  ...styles.mutedText,
                  marginTop: 4,
                  fontSize: 13,
                }}
              >
                Activity for this month
              </div>

            </div>

            <div style={styles.badge}>
              {expenses.length}
            </div>

          </div>

          {expenses.length === 0 ? (

            <div
              style={{
                padding: "35px 10px",
                textAlign: "center",
              }}
            >

              <div
                style={{
                  fontSize: 32,
                  marginBottom: 8,
                }}
              >
                🧾
              </div>

              <div
                style={{
                  ...styles.primaryText,
                  fontWeight: 750,
                  marginBottom: 4,
                }}
              >
                No transactions
              </div>

              <div
                style={{
                  ...styles.mutedText,
                  fontSize: 13,
                }}
              >
                No expenses were recorded
                this month.
              </div>

            </div>

          ) : (

            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",
              }}
            >

              {expenses.map(
                (expense, index) => {

                  const icon =
                    categoryIcons[
                      expense.category
                    ] || "📦";

                  const isLast =
                    index ===
                    expenses.length - 1;

                  return (
                    <div
                      key={
                        expense._id ||
                        expense.id ||
                        index
                      }
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        gap: 14,
                        padding:
                          "13px 4px",
                        ...(isLast
                          ? {}
                          : styles.transactionBorder),
                      }}
                    >

                      {/* TRANSACTION INFO */}

                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "center",
                          gap: 11,
                          minWidth: 0,
                        }}
                      >

                        <div
                          style={
                            styles.iconBox
                          }
                        >
                          {icon}
                        </div>

                        <div
                          style={{
                            minWidth: 0,
                          }}
                        >

                          <div
                            style={{
                              ...styles.primaryText,
                              fontWeight: 750,
                              fontSize: 14,
                              overflow:
                                "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {expense.title ||
                              "Untitled expense"}
                          </div>

                          <div
                            style={{
                              display:
                                "flex",
                              gap: 7,
                              alignItems:
                                "center",
                              marginTop: 3,
                              fontSize: 12,
                              ...styles.mutedText,
                            }}
                          >

                            <span>
                              {
                                expense.category
                              }
                            </span>

                            <span>•</span>

                            <span>
                              {formatDate(
                                expense.date
                              )}
                            </span>

                          </div>

                        </div>

                      </div>

                      {/* AMOUNT */}

                      <div
                        style={{
                          textAlign:
                            "right",
                          flexShrink: 0,
                        }}
                      >

                        <div
                          style={{
                            ...styles.primaryText,
                            fontWeight: 850,
                            fontSize: 14,
                          }}
                        >
                          {money(
                            expense.amount
                          )}
                        </div>

                        {expense.paymentMethod && (
                          <div
                            style={{
                              ...styles.mutedText,
                              fontSize: 11,
                              marginTop: 3,
                            }}
                          >
                            {
                              expense.paymentMethod
                            }
                          </div>
                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </div>

      </div>

      {/* =========================
          RESPONSIVE STYLE
      ========================= */}

      <style>
        {`
          @media (max-width: 900px) {
            .monthly-history-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 600px) {
            .monthly-expense-history {
              border-radius: 14px !important;
            }

            .monthly-expense-history
              select {
              width: 100%;
              min-width: 0 !important;
            }
          }
        `}
      </style>

    </section>
  );
}