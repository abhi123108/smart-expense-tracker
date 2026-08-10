const asyncHandler = require('express-async-handler');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

// @desc    Create a new expense (manual entry)
// @route   POST /api/expenses
// @access  Private
const createExpense = asyncHandler(async (req, res) => {
  const { title, amount, category, date, paymentMethod, notes } = req.body;

  if (!title || amount === undefined || !category) {
    res.status(400);
    throw new Error('Title, amount and category are required');
  }

  const expense = await Expense.create({
    user: req.user._id,
    title,
    amount,
    category,
    date: date || Date.now(),
    paymentMethod,
    notes,
    source: 'manual',
  });

  res.status(201).json(expense);
});

// @desc    Get all expenses for logged-in user (with filters + pagination)
// @route   GET /api/expenses
// @access  Private
const getExpenses = asyncHandler(async (req, res) => {
  const { category, startDate, endDate, page = 1, limit = 20, sort = '-date' } = req.query;

  const filter = { user: req.user._id };
  if (category) filter.category = category;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [expenses, total] = await Promise.all([
    Expense.find(filter).sort(sort).skip(skip).limit(Number(limit)),
    Expense.countDocuments(filter),
  ]);

  res.json({
    expenses,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
    totalExpenses: total,
  });
});

// @desc    Get single expense by id
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }
  res.json(expense);
});

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }

  const fields = ['title', 'amount', 'category', 'date', 'paymentMethod', 'notes'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) expense[f] = req.body[f];
  });

  const updated = await expense.save();
  res.json(updated);
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!expense) {
    res.status(404);
    throw new Error('Expense not found');
  }
  res.json({ message: 'Expense deleted', id: req.params.id });
});

// @desc    Get quick summary: today, this week, this month totals + budget status
// @route   GET /api/expenses/summary
// @access  Private
const getSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const userId = req.user._id;

  const [todayAgg, weekAgg, monthAgg, categoryAgg] = await Promise.all([
    Expense.aggregate([
      { $match: { user: userId, date: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: { user: userId, date: { $gte: startOfWeek } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: { user: userId, date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: { user: userId, date: { $gte: startOfMonth } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
  ]);

  const budgets = await Budget.find({ user: userId });
  const overallBudget = budgets.find((b) => b.category === 'Overall');
  const monthTotal = monthAgg[0]?.total || 0;

  res.json({
    todayTotal: todayAgg[0]?.total || 0,
    weekTotal: weekAgg[0]?.total || 0,
    monthTotal,
    categoryBreakdown: categoryAgg.map((c) => ({ category: c._id, total: c.total })),
    overallBudget: overallBudget
      ? {
          limit: overallBudget.monthlyLimit,
          spent: monthTotal,
          percentUsed: Math.round((monthTotal / overallBudget.monthlyLimit) * 100),
        }
      : null,
  });
});

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getSummary,
};
