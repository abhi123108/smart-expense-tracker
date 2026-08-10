const asyncHandler = require("express-async-handler");

const Expense = require("../models/Expense");
const Budget = require("../models/Budget");
const User = require("../models/User");

const {
  predictNextMonthSpending,
  detectAnomalies,
} = require("../utils/predictSpending");

const {
  generateFinancialInsights,
} = require("../utils/ai-insights");

// =====================================================
// MONTHLY REPORT
// =====================================================

// @desc    Get a detailed report for a specific month
// @route   GET /api/reports/monthly
// @access  Private

const getMonthlyReport = asyncHandler(
  async (req, res) => {
    const userId = req.user._id;

    const now = new Date();

    const year =
      Number(req.query.year) ||
      now.getFullYear();

    const month =
      Number(req.query.month) ||
      now.getMonth() + 1;

    const start = new Date(
      year,
      month - 1,
      1
    );

    const end = new Date(
      year,
      month,
      1
    );

    const [
      categoryBreakdown,
      dailyTrend,
      totalAgg,
      paymentMethodBreakdown,
    ] = await Promise.all([
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: {
              $gte: start,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: "$category",
            total: {
              $sum: "$amount",
            },
            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            total: -1,
          },
        },
      ]),

      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: {
              $gte: start,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: {
              $dayOfMonth: "$date",
            },

            total: {
              $sum: "$amount",
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]),

      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: {
              $gte: start,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: "$amount",
            },

            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: {
              $gte: start,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: "$paymentMethod",

            total: {
              $sum: "$amount",
            },
          },
        },
      ]),
    ]);

    res.json({
      year,
      month,

      totalSpent:
        totalAgg[0]?.total || 0,

      transactionCount:
        totalAgg[0]?.count || 0,

      categoryBreakdown:
        categoryBreakdown.map((c) => ({
          category: c._id,
          total: c.total,
          count: c.count,
        })),

      dailyTrend:
        dailyTrend.map((d) => ({
          day: d._id,
          total: d.total,
        })),

      paymentMethodBreakdown:
        paymentMethodBreakdown.map((p) => ({
          method: p._id,
          total: p.total,
        })),
    });
  }
);

// =====================================================
// EXISTING PREDICTION
// =====================================================

// @desc    Get next month prediction
// @route   GET /api/reports/prediction
// @access  Private

const getPrediction = asyncHandler(
  async (req, res) => {
    const userId = req.user._id;

    const now = new Date();

    const sixMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1
    );

    const monthlyAgg =
      await Expense.aggregate([
        {
          $match: {
            user: userId,

            date: {
              $gte: sixMonthsAgo,
            },
          },
        },

        {
          $group: {
            _id: {
              year: {
                $year: "$date",
              },

              month: {
                $month: "$date",
              },
            },

            total: {
              $sum: "$amount",
            },
          },
        },

        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]);

    const monthlyTotals =
      monthlyAgg.map((m) => ({
        month: `${m._id.year}-${String(
          m._id.month
        ).padStart(2, "0")}`,

        total: m.total,
      }));

    const prediction =
      predictNextMonthSpending(
        monthlyTotals
      );

    // =================================================
    // CATEGORY ANOMALIES
    // =================================================

    const categoryAgg =
      await Expense.aggregate([
        {
          $match: {
            user: userId,

            date: {
              $gte: sixMonthsAgo,
            },
          },
        },

        {
          $group: {
            _id: {
              category: "$category",

              year: {
                $year: "$date",
              },

              month: {
                $month: "$date",
              },
            },

            total: {
              $sum: "$amount",
            },
          },
        },

        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]);

    const categoryMap = {};

    categoryAgg.forEach((c) => {
      const category =
        c._id.category;

      if (!categoryMap[category]) {
        categoryMap[category] = [];
      }

      categoryMap[category].push(
        c.total
      );
    });

    const categoryHistory =
      Object.entries(
        categoryMap
      ).map(
        ([category, amounts]) => ({
          category,
          amounts,
        })
      );

    const anomalies =
      detectAnomalies(
        categoryHistory
      );

    res.json({
      monthlyTotals,
      prediction,
      anomalies,
    });
  }
);

// =====================================================
// GENERATIVE AI INSIGHTS
// =====================================================

// @desc    Generate natural-language AI financial insights
// @route   GET /api/reports/ai-insights
// @access  Private

const getAIInsights = asyncHandler(
  async (req, res) => {
    const userId = req.user._id;

    const now = new Date();

    const year =
      Number(req.query.year) ||
      now.getFullYear();

    const month =
      Number(req.query.month) ||
      now.getMonth() + 1;

    const start = new Date(
      year,
      month - 1,
      1
    );

    const end = new Date(
      year,
      month,
      1
    );

    const sixMonthsAgo =
      new Date(
        year,
        month - 7,
        1
      );

    // =================================================
    // USER
    // =================================================

    const user =
      await User.findById(
        userId
      ).select("name email");

    // =================================================
    // MONTH REPORT DATA
    // =================================================

    const [
      totalAgg,
      categoryBreakdown,
      monthlyAgg,
      budgets,
    ] = await Promise.all([
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: {
              $gte: start,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: "$amount",
            },

            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: {
              $gte: start,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: "$category",

            total: {
              $sum: "$amount",
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            total: -1,
          },
        },
      ]),

      Expense.aggregate([
        {
          $match: {
            user: userId,

            date: {
              $gte: sixMonthsAgo,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: {
              year: {
                $year: "$date",
              },

              month: {
                $month: "$date",
              },
            },

            total: {
              $sum: "$amount",
            },
          },
        },

        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),

      Budget.find({
        user: userId,
      }).select(
        "category monthlyLimit alertThresholdPercent"
      ),
    ]);

    // =================================================
    // MONTHLY TOTALS
    // =================================================

    const monthlyTotals =
      monthlyAgg.map((m) => ({
        month: `${m._id.year}-${String(
          m._id.month
        ).padStart(2, "0")}`,

        total: m.total,
      }));

    // =================================================
    // PREDICTION
    // =================================================

    const prediction =
      predictNextMonthSpending(
        monthlyTotals
      );

    // =================================================
    // CATEGORY ANOMALIES
    // =================================================

    const categoryAgg =
      await Expense.aggregate([
        {
          $match: {
            user: userId,

            date: {
              $gte: sixMonthsAgo,
              $lt: end,
            },
          },
        },

        {
          $group: {
            _id: {
              category: "$category",

              year: {
                $year: "$date",
              },

              month: {
                $month: "$date",
              },
            },

            total: {
              $sum: "$amount",
            },
          },
        },

        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]);

    const categoryMap = {};

    categoryAgg.forEach((c) => {
      const category =
        c._id.category;

      if (!categoryMap[category]) {
        categoryMap[category] = [];
      }

      categoryMap[category].push(
        c.total
      );
    });

    const categoryHistory =
      Object.entries(
        categoryMap
      ).map(
        ([category, amounts]) => ({
          category,
          amounts,
        })
      );

    const anomalies =
      detectAnomalies(
        categoryHistory
      );

    // =================================================
    // AI GENERATION
    // =================================================

    const totalSpent =
      totalAgg[0]?.total || 0;

    const transactionCount =
      totalAgg[0]?.count || 0;

    const aiInsights =
      await generateFinancialInsights({
        userName:
          user?.name || "User",

        month,

        year,

        totalSpent,

        transactionCount,

        categoryBreakdown:
          categoryBreakdown.map(
            (item) => ({
              category:
                item._id,

              total:
                item.total,

              count:
                item.count,
            })
          ),

        monthlyTotals,

        prediction,

        anomalies,

        budgets:
          budgets.map((budget) => ({
            category:
              budget.category,

            monthlyLimit:
              budget.monthlyLimit,

            alertThresholdPercent:
              budget.alertThresholdPercent,
          })),
      });

    res.json({
      success: true,

      year,

      month,

      aiInsights,

      data: {
        totalSpent,

        transactionCount,

        categoryBreakdown,

        monthlyTotals,

        prediction,

        anomalies,

        budgets,
      },
    });
  }
);

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  getMonthlyReport,
  getPrediction,
  getAIInsights,
};