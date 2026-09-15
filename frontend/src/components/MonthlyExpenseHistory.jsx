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

export default function MonthlyExpenseHistory() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMonthlyHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/expenses/history/monthly?month=${month}&year=${year}`
        );

        setData(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load monthly expenses"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyHistory();
  }, [month, year]);

  const categoryBreakdown = data?.categoryBreakdown || [];

  const totalExpense = data?.summary?.totalExpense || 0;

  const maxCategoryAmount = useMemo(() => {
    if (!categoryBreakdown.length) return 0;

    return Math.max(
      ...categoryBreakdown.map((item) => item.amount)
    );
  }, [categoryBreakdown]);

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Expense History
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Monthly spending overview
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">

          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MONTHS.map((monthName, index) => (
              <option
                key={monthName}
                value={index + 1}
              >
                {monthName}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from(
              { length: 5 },
              (_, index) =>
                today.getFullYear() - 2 + index
            ).map((yearOption) => (
              <option
                key={yearOption}
                value={yearOption}
              >
                {yearOption}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-12 text-center text-gray-500">
          Loading monthly expenses...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-6 p-4 rounded-lg bg-red-50 text-red-600">
          {error}
        </div>
      )}

      {/* Data */}
      {!loading && !error && data && (
        <>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">

            <div className="rounded-xl bg-red-50 p-5">
              <p className="text-sm text-gray-500">
                Total Expense
              </p>

              <p className="text-3xl font-bold text-red-600 mt-2">
                {formatCurrency(totalExpense)}
              </p>

              <p className="text-sm text-gray-500 mt-2">
                {data.summary.totalTransactions} transactions
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-5">
              <p className="text-sm text-gray-500">
                Selected Month
              </p>

              <p className="text-2xl font-bold text-blue-600 mt-2">
                {MONTHS[month - 1]} {year}
              </p>

              <p className="text-sm text-gray-500 mt-2">
                Monthly spending
              </p>
            </div>

          </div>

          {/* Category Breakdown */}
          <div className="mt-8">

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Category Breakdown
              </h3>

              <span className="text-sm text-gray-500">
                {categoryBreakdown.length} categories
              </span>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                No expenses found for this month.
              </div>
            ) : (
              <div className="space-y-5">

                {categoryBreakdown.map((item) => {

                  const percentage =
                    totalExpense > 0
                      ? (item.amount / totalExpense) * 100
                      : 0;

                  const width =
                    maxCategoryAmount > 0
                      ? (item.amount / maxCategoryAmount) * 100
                      : 0;

                  return (
                    <div key={item.category}>

                      <div className="flex items-center justify-between mb-2">

                        <span className="font-medium text-gray-700">
                          {item.category}
                        </span>

                        <div className="text-right">
                          <span className="font-semibold text-gray-800">
                            {formatCurrency(item.amount)}
                          </span>

                          <span className="text-xs text-gray-500 ml-2">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>

                      </div>

                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">

                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${width}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </div>

          {/* Expense List */}
          {data.expenses?.length > 0 && (
            <div className="mt-8">

              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Transactions
              </h3>

              <div className="space-y-3">

                {data.expenses.map((expense) => (
                  <div
                    key={expense._id}
                    className="flex items-center justify-between border-b border-gray-100 pb-3"
                  >

                    <div>
                      <p className="font-medium text-gray-800">
                        {expense.title}
                      </p>

                      <p className="text-sm text-gray-500">
                        {expense.category}
                      </p>
                    </div>

                    <p className="font-semibold text-red-600">
                      {formatCurrency(expense.amount)}
                    </p>

                  </div>
                ))}

              </div>

            </div>
          )}

        </>
      )}

    </div>
  );
}