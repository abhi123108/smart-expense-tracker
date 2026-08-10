const asyncHandler = require("express-async-handler");
const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const User = require("../models/User");
const {
  sendBudgetAlertEmail,
} = require("../utils/emailService");

// =====================================================
// SET / UPDATE BUDGET
// =====================================================

// @desc    Set or update a budget for a category
// @route   POST /api/budgets
// @access  Private
const setBudget = asyncHandler(async (req, res) => {
  const {
    category,
    monthlyLimit,
    alertThresholdPercent,
  } = req.body;

  if (!category || monthlyLimit === undefined) {
    res.status(400);
    throw new Error(
      "Category and monthlyLimit are required"
    );
  }

  const budget = await Budget.findOneAndUpdate(
    {
      user: req.user._id,
      category,
    },
    {
      monthlyLimit,
      alertThresholdPercent:
        alertThresholdPercent ?? 80,
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );

  res.status(201).json(budget);
});

// =====================================================
// GET ALL BUDGETS
// =====================================================

// @desc    Get all budgets for logged-in user
// @route   GET /api/budgets
// @access  Private
const getBudgets = asyncHandler(async (req, res) => {
  const budgets = await Budget.find({
    user: req.user._id,
  });

  res.json(budgets);
});

// =====================================================
// DELETE BUDGET
// =====================================================

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = asyncHandler(async (req, res) => {
  const budget =
    await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

  if (!budget) {
    res.status(404);
    throw new Error("Budget not found");
  }

  res.json({
    message: "Budget deleted",
    id: req.params.id,
  });
});

// =====================================================
// MONTH KEY
// =====================================================

function currentMonthKey(date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

// =====================================================
// CHECK WHETHER EMAIL SHOULD BE SENT
// =====================================================

function shouldSendEmail(
  budget,
  level,
  monthKey
) {
  // New month = new alert cycle
  if (budget.lastAlertMonth !== monthKey) {
    return true;
  }

  // Same alert level already sent
  if (budget.lastAlertLevel === level) {
    return false;
  }

  // Warning was already sent and now budget is exceeded
  if (
    budget.lastAlertLevel === "warning" &&
    level === "exceeded"
  ) {
    return true;
  }

  return false;
}

// =====================================================
// BUDGET ALERTS
// =====================================================

// @desc    Check current spending against budgets
// @route   GET /api/budgets/alerts
// @access  Private
const getBudgetAlerts = asyncHandler(
  async (req, res) => {
    const userId = req.user._id;

    const now = new Date();

    // First day of current month
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const monthKey =
      currentMonthKey(now);

    // Get all budgets
    const budgets = await Budget.find({
      user: userId,
    });

    if (!budgets.length) {
      return res.json([]);
    }

    // =================================================
    // CALCULATE MONTHLY SPENDING
    // =================================================

    const spendAgg =
      await Expense.aggregate([
        {
          $match: {
            user: userId,
            date: {
              $gte: startOfMonth,
            },
          },
        },

        {
          $group: {
            _id: "$category",
            total: {
              $sum: "$amount",
            },
          },
        },
      ]);

    // Total monthly spending
    const monthTotal =
      spendAgg.reduce(
        (sum, category) =>
          sum + category.total,
        0
      );

    // Convert category spending to object
    const spendMap =
      Object.fromEntries(
        spendAgg.map((category) => [
          category._id,
          category.total,
        ])
      );

    const alerts = [];

    // =================================================
    // GET USER EMAIL
    // =================================================

    const user =
      await User.findById(userId)
        .select("name email");

    // =================================================
    // CHECK EVERY BUDGET
    // =================================================

    for (const budget of budgets) {
      const spent =
        budget.category === "Overall"
          ? monthTotal
          : spendMap[
              budget.category
            ] || 0;

      const percentUsed =
        budget.monthlyLimit > 0
          ? (spent /
              budget.monthlyLimit) *
            100
          : 0;

      let level = null;

      // ===============================================
      // BUDGET EXCEEDED
      // ===============================================

      if (percentUsed >= 100) {
        level = "exceeded";
      }

      // ===============================================
      // WARNING
      // ===============================================

      else if (
        percentUsed >=
        budget.alertThresholdPercent
      ) {
        level = "warning";
      }

      // No alert
      if (!level) {
        continue;
      }

      const roundedPercent =
        Math.round(percentUsed);

      // ===============================================
      // DASHBOARD ALERT
      // ===============================================

      const alert = {
        category:
          budget.category,

        level,

        percentUsed:
          roundedPercent,

        spent,

        limit:
          budget.monthlyLimit,

        message:
          level === "exceeded"
            ? `🚨 You've exceeded your ${budget.category} budget (${roundedPercent}% used)`
            : `⚠️ You've used ${roundedPercent}% of your ${budget.category} budget`,
      };

      alerts.push(alert);

      // ===============================================
      // EMAIL ALERT
      // ===============================================

      if (
        user?.email &&
        shouldSendEmail(
          budget,
          level,
          monthKey
        )
      ) {
        try {
          const sent =
            await sendBudgetAlertEmail({
              to: user.email,
              name: user.name,
              category:
                budget.category,
              level,
              percentUsed:
                roundedPercent,
              spent,
              limit:
                budget.monthlyLimit,
            });

          // Only mark alert as sent
          // if email was successfully sent
          if (sent) {
            budget.lastAlertMonth =
              monthKey;

            budget.lastAlertLevel =
              level;

            await budget.save();

            console.log(
              `📧 Budget alert email sent to ${user.email}`
            );
          }
        } catch (emailError) {
          // Email failure should NOT
          // break dashboard API
          console.error(
            "📧 Budget alert email failed:",
            emailError.message
          );
        }
      }
    }

    // =================================================
    // RESPONSE
    // =================================================

    res.json(alerts);
  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  setBudget,
  getBudgets,
  deleteBudget,
  getBudgetAlerts,
};