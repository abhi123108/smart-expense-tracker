const asyncHandler = require("express-async-handler");

const Income = require("../models/Income");
const Account = require("../models/Account");

// @desc    Create income
// @route   POST /api/income
// @access  Private
const createIncome = asyncHandler(async (req, res) => {
  const {
    source,
    amount,
    category,
    date,
    account,
    note,
  } = req.body;

  if (!source || !source.trim()) {
    res.status(400);
    throw new Error("Income source is required");
  }

  const incomeAmount = Number(amount);

  if (
    !Number.isFinite(incomeAmount) ||
    incomeAmount <= 0
  ) {
    res.status(400);
    throw new Error("Amount must be a valid positive number");
  }

  if (!account) {
    res.status(400);
    throw new Error("Account is required");
  }

  // Make sure account belongs to logged-in user
  const selectedAccount = await Account.findOne({
    _id: account,
    user: req.user._id,
    isActive: true,
  });

  if (!selectedAccount) {
    res.status(404);
    throw new Error("Account not found or inactive");
  }

  const income = await Income.create({
    user: req.user._id,
    source: source.trim(),
    amount: incomeAmount,
    category: category || "Other",
    date: date || Date.now(),
    account: selectedAccount._id,
    note,
  });

  // Income increases account balance
  selectedAccount.currentBalance += incomeAmount;
  await selectedAccount.save();

  const populatedIncome = await Income.findById(income._id).populate(
    "account",
    "name type currentBalance currency"
  );

  res.status(201).json(populatedIncome);
});

// @desc    Get all income
// @route   GET /api/income
// @access  Private
const getIncome = asyncHandler(async (req, res) => {
  const {
    category,
    account,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sort = "-date",
  } = req.query;

  const filter = {
    user: req.user._id,
  };

  if (category) {
    filter.category = category;
  }

  if (account) {
    filter.account = account;
  }

  if (startDate || endDate) {
    filter.date = {};

    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }

    if (endDate) {
      filter.date.$lte = new Date(endDate);
    }
  }

  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  const skip = (pageNumber - 1) * limitNumber;

  const [income, total] = await Promise.all([
    Income.find(filter)
      .populate(
        "account",
        "name type currentBalance currency"
      )
      .sort(sort)
      .skip(skip)
      .limit(limitNumber),

    Income.countDocuments(filter),
  ]);

  res.json({
    income,
    page: pageNumber,
    totalPages: Math.ceil(total / limitNumber),
    totalIncomeRecords: total,
  });
});

// @desc    Get single income
// @route   GET /api/income/:id
// @access  Private
const getIncomeById = asyncHandler(async (req, res) => {
  const income = await Income.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).populate(
    "account",
    "name type currentBalance currency"
  );

  if (!income) {
    res.status(404);
    throw new Error("Income not found");
  }

  res.json(income);
});

// @desc    Update income
// @route   PUT /api/income/:id
// @access  Private
const updateIncome = asyncHandler(async (req, res) => {
  const income = await Income.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!income) {
    res.status(404);
    throw new Error("Income not found");
  }

  const oldAmount = Number(income.amount);
  const oldAccountId = income.account.toString();

  const {
    source,
    amount,
    category,
    date,
    account,
    note,
  } = req.body;

  if (source !== undefined) {
    if (!source.trim()) {
      res.status(400);
      throw new Error("Income source cannot be empty");
    }

    income.source = source.trim();
  }

  if (amount !== undefined) {
    const newAmount = Number(amount);

    if (
      !Number.isFinite(newAmount) ||
      newAmount <= 0
    ) {
      res.status(400);
      throw new Error("Amount must be a valid positive number");
    }

    income.amount = newAmount;
  }

  if (category !== undefined) {
    income.category = category;
  }

  if (date !== undefined) {
    income.date = date;
  }

  if (note !== undefined) {
    income.note = note;
  }

  // Handle account change
  if (
    account !== undefined &&
    account.toString() !== oldAccountId
  ) {
    const newAccount = await Account.findOne({
      _id: account,
      user: req.user._id,
      isActive: true,
    });

    if (!newAccount) {
      res.status(404);
      throw new Error("New account not found or inactive");
    }

    const oldAccount = await Account.findOne({
      _id: income.account,
      user: req.user._id,
    });

    if (!oldAccount) {
      res.status(404);
      throw new Error("Original account not found");
    }

    // Reverse old income from old account
    oldAccount.currentBalance -= oldAmount;
    await oldAccount.save();

    // Apply new income to new account
    newAccount.currentBalance += Number(income.amount);
    await newAccount.save();

    income.account = newAccount._id;
  } else if (amount !== undefined) {
    // Same account, only amount changed
    const accountDoc = await Account.findOne({
      _id: income.account,
      user: req.user._id,
    });

    if (!accountDoc) {
      res.status(404);
      throw new Error("Account not found");
    }

    // Remove old amount
    accountDoc.currentBalance -= oldAmount;

    // Add new amount
    accountDoc.currentBalance += Number(income.amount);

    await accountDoc.save();
  }

  const updatedIncome = await income.save();

  const populatedIncome = await Income.findById(
    updatedIncome._id
  ).populate(
    "account",
    "name type currentBalance currency"
  );

  res.json(populatedIncome);
});

// @desc    Delete income
// @route   DELETE /api/income/:id
// @access  Private
const deleteIncome = asyncHandler(async (req, res) => {
  const income = await Income.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!income) {
    res.status(404);
    throw new Error("Income not found");
  }

  const account = await Account.findOne({
    _id: income.account,
    user: req.user._id,
  });

  if (!account) {
    res.status(404);
    throw new Error("Account not found");
  }

  // Reverse income from account balance
  account.currentBalance -= Number(income.amount);
  await account.save();

  await income.deleteOne();

  res.json({
    message: "Income deleted successfully",
    id: req.params.id,
  });
});

module.exports = {
  createIncome,
  getIncome,
  getIncomeById,
  updateIncome,
  deleteIncome,
};