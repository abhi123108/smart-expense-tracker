const asyncHandler = require('express-async-handler');
const Tesseract = require('tesseract.js');
const path = require('path');
const Expense = require('../models/Expense');
const { parseReceiptText } = require('../utils/ocrParser');

// @desc    Scan an uploaded bill image with OCR and return parsed expense data
//          (does NOT save the expense yet - lets user review/edit first)
// @route   POST /api/ocr/scan
// @access  Private
const scanBill = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a bill/receipt image');
  }

  const imagePath = req.file.path;

  const {
    data: { text },
  } = await Tesseract.recognize(imagePath, 'eng', {
    logger: () => {}, // suppress verbose progress logs; hook this up to a websocket for a live progress bar if desired
  });

  const parsed = parseReceiptText(text);

  res.json({
    ...parsed,
    rawText: text,
    receiptImage: `/uploads/${path.basename(imagePath)}`,
  });
});

// @desc    Confirm and save an OCR-scanned bill as an actual expense
// @route   POST /api/ocr/confirm
// @access  Private
const confirmOcrExpense = asyncHandler(async (req, res) => {
  const { title, amount, category, date, receiptImage, rawText, paymentMethod, notes } = req.body;

  if (!title || amount === undefined || !category) {
    res.status(400);
    throw new Error('Title, amount and category are required to confirm the expense');
  }

  const expense = await Expense.create({
    user: req.user._id,
    title,
    amount,
    category,
    date: date || Date.now(),
    paymentMethod,
    notes,
    source: 'ocr',
    receiptImage,
    ocrRawText: rawText,
  });

  res.status(201).json(expense);
});

module.exports = { scanBill, confirmOcrExpense };
