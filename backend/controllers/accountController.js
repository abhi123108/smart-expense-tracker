const asyncHandler = require("express-async-handler");

const Account = require("../models/Account");

// @desc    Create a new account
// @route   POST /api/accounts
// @access  Private
const createAccount = asyncHandler(async (req, res) => {
  const {
    name,
    type,
    initialBalance,
    currency,
  } = req.body;

  if (!name || !name.trim()) {
    res.status(400);
    throw new Error("Account name is required");
  }

  const balance = Number(initialBalance ?? 0);

  if (!Number.isFinite(balance) || balance < 0) {
    res.status(400);
    throw new Error("Initial balance must be a valid non-negative number");
  }

  const existingAccount = await Account.findOne({
    user: req.user._id,
    name: name.trim(),
  });

  if (existingAccount) {
    res.status(409);
    throw new Error("An account with this name already exists");
  }

  const account = await Account.create({
    user: req.user._id,
    name: name.trim(),
    type: type || "Bank",
    initialBalance: balance,
    currentBalance: balance,
    currency: currency || "INR",
  });

  res.status(201).json(account);
});

// @desc    Get all accounts
// @route   GET /api/accounts
// @access  Private
const getAccounts = asyncHandler(async (req, res) => {
  const accounts = await Account.find({
    user: req.user._id,
  }).sort({
    isActive: -1,
    createdAt: -1,
  });

  res.json(accounts);
});

// @desc    Get single account
// @route   GET /api/accounts/:id
// @access  Private
const getAccountById = asyncHandler(async (req, res) => {
  const account = await Account.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!account) {
    res.status(404);
    throw new Error("Account not found");
  }

  res.json(account);
});

// @desc    Update account
// @route   PUT /api/accounts/:id
// @access  Private
const updateAccount = asyncHandler(async (req, res) => {
  const account = await Account.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!account) {
    res.status(404);
    throw new Error("Account not found");
  }

  const {
    name,
    type,
    currency,
    isActive,
  } = req.body;

  if (name !== undefined) {
    if (!name.trim()) {
      res.status(400);
      throw new Error("Account name cannot be empty");
    }

    const duplicate = await Account.findOne({
      user: req.user._id,
      name: name.trim(),
      _id: { $ne: account._id },
    });

    if (duplicate) {
      res.status(409);
      throw new Error("An account with this name already exists");
    }

    account.name = name.trim();
  }

  if (type !== undefined) {
    account.type = type;
  }

  if (currency !== undefined) {
    account.currency = currency;
  }

  if (isActive !== undefined) {
    account.isActive = Boolean(isActive);
  }

  const updatedAccount = await account.save();

  res.json(updatedAccount);
});

// @desc    Delete account
// @route   DELETE /api/accounts/:id
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  const account = await Account.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!account) {
    res.status(404);
    throw new Error("Account not found");
  }

  if (account.currentBalance !== account.initialBalance) {
    res.status(400);
    throw new Error(
      "Account with transactions cannot be deleted. Deactivate it instead."
    );
  }

  await account.deleteOne();

  res.json({
    message: "Account deleted successfully",
    id: req.params.id,
  });
});

module.exports = {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
};