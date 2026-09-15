const asyncHandler = require("express-async-handler");

const Expense = require("../models/Expense");
const Budget = require("../models/Budget");

// @desc    Create a new expense (manual entry)
// @route   POST /api/expenses
// @access  Private
const createExpense = asyncHandler(async (req, res) => {
  const {
    title,
    amount,
    category,
    date,
    paymentMethod,
    notes,
  } = req.body;

  if (!title || amount === undefined || !category) {
    res.status(400);
    throw new Error("Title, amount and category are required");
  }

  const expense = await Expense.create({
    user: req.user._id,
    title,
    amount,
    category,
    date: date || Date.now(),
    paymentMethod,
    notes,
    source: "manual",
  });

  res.status(201).json(expense);
});

// @desc    Get all expenses for logged-in user
//          with filters + pagination
// @route   GET /api/expenses
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
  const {
    category,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sort = "-date",
  } = req.query;

  const filter = {
    user: req.user._id,
  };

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Date filters
  if (startDate || endDate) {
    filter.date = {};

    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }

    if (endDate) {
      filter.date.$lte = new Date(endDate);
    }
  }

  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  const skip = (pageNumber - 1) * limitNumber;

  const [expenses, total] = await Promise.all([
    Expense.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNumber),

    Expense.countDocuments(filter),
  ]);

  res.json({
    expenses,
    page: pageNumber,
    totalPages: Math.ceil(total / limitNumber),
    totalExpenses: total,
  });
});

// @desc    Get single expense by id
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!expense) {
    res.status(404);
    throw new Error("Expense not found");
  }

  res.json(expense);
});

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!expense) {
    res.status(404);
    throw new Error("Expense not found");
  }

  const fields = [
    "title",
    "amount",
    "category",
    "date",
    "paymentMethod",
    "notes",
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      expense[field] = req.body[field];
    }
  });

  const updatedExpense = await expense.save();

  res.json(updatedExpense);
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!expense) {
    res.status(404);
    throw new Error("Expense not found");
  }

  res.json({
    message: "Expense deleted",
    id: req.params.id,
  });
});

// @desc    Get quick summary:
//          today, this week, this month totals + budget status
// @route   GET /api/expenses/summary
// @access  Private
const getSummary = asyncHandler(async (req, res) => {
  const now = new Date();

  // Start of current month
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  // Start of current week
  const startOfWeek = new Date(now);

  startOfWeek.setDate(
    now.getDate() - now.getDay()
  );

  startOfWeek.setHours(0, 0, 0, 0);

  // Start of today
  const startOfToday = new Date(now);

  startOfToday.setHours(0, 0, 0, 0);

  const userId = req.user._id;

  const [
    todayAgg,
    weekAgg,
    monthAgg,
    categoryAgg,
  ] = await Promise.all([
    // Today
    Expense.aggregate([
      {
        $match: {
          user: userId,
          date: {
            $gte: startOfToday,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$amount",
          },
        },
      },
    ]),

    // This week
    Expense.aggregate([
      {
        $match: {
          user: userId,
          date: {
            $gte: startOfWeek,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$amount",
          },
        },
      },
    ]),

    // This month
    Expense.aggregate([
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
          _id: null,
          total: {
            $sum: "$amount",
          },
        },
      },
    ]),

    // Category breakdown
    Expense.aggregate([
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
      {
        $sort: {
          total: -1,
        },
      },
    ]),
  ]);

  // Get budgets
  const budgets = await Budget.find({
    user: userId,
  });

  const overallBudget = budgets.find(
    (budget) => budget.category === "Overall"
  );

  const monthTotal = monthAgg[0]?.total || 0;

  let budgetData = null;

  if (overallBudget) {
    const percentUsed =
      overallBudget.monthlyLimit > 0
        ? Math.round(
            (monthTotal / overallBudget.monthlyLimit) * 100
          )
        : 0;

    budgetData = {
      limit: overallBudget.monthlyLimit,
      spent: monthTotal,
      percentUsed,
    };
  }

  res.json({
    todayTotal: todayAgg[0]?.total || 0,

    weekTotal: weekAgg[0]?.total || 0,

    monthTotal,

    categoryBreakdown: categoryAgg.map((category) => ({
      category: category._id,
      total: category.total,
    })),

    overallBudget: budgetData,
  });
});

// @desc    Get month-wise expense history
// @route   GET /api/expenses/history/monthly?month=9&year=2026
// @access  Private
const getMonthlyHistory = asyncHandler(async (req, res) => {
  const now = new Date();

  const month = Number(
    req.query.month ?? now.getMonth() + 1
  );

  const year = Number(
    req.query.year ?? now.getFullYear()
  );

  // Validate month and year
  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100
  ) {
    res.status(400);
    throw new Error("Invalid month or year");
  }

  const userId = req.user._id;

  // Example:
  // month = 9
  // year = 2026
  //
  // startDate = 1 September 2026
  // endDate   = 1 October 2026

  const startDate = new Date(
    year,
    month - 1,
    1
  );

  const endDate = new Date(
    year,
    month,
    1
  );

  // Get all expenses of selected month
  const expenses = await Expense.find({
    user: userId,

    date: {
      $gte: startDate,
      $lt: endDate,
    },
  }).sort({
    date: -1,
  });

  // Total expense
  const totalExpense = expenses.reduce(
    (total, expense) => {
      return total + Number(expense.amount || 0);
    },
    0
  );

  // Category breakdown
  const categoryMap = {};

  expenses.forEach((expense) => {
    const category = expense.category;

    if (!categoryMap[category]) {
      categoryMap[category] = 0;
    }

    categoryMap[category] += Number(
      expense.amount || 0
    );
  });

  const categoryBreakdown = Object.entries(
    categoryMap
  )
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Income is not currently stored in Expense model.
  // Keeping it as 0 until Income model/API is implemented.
  const income = 0;

  const remaining = income - totalExpense;

  // Month names
  const monthName = new Date(
    year,
    month - 1,
    1
  ).toLocaleString("en-IN", {
    month: "long",
  });

  res.status(200).json({
    success: true,

    month,
    year,

    monthName,

    summary: {
      totalExpense,
      totalTransactions: expenses.length,
      income,
      remaining,
    },

    categoryBreakdown,

    expenses,
  });
});

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getSummary,
  getMonthlyHistory,
};