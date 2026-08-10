const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: [
        'Food',
        'Transport',
        'Shopping',
        'Bills',
        'Entertainment',
        'Health',
        'Groceries',
        'Rent',
        'Education',
        'Other',
      ],
      default: 'Other',
    },
    date: { type: Date, required: true, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'NetBanking', 'Other'],
      default: 'Other',
    },
    notes: { type: String, trim: true },
    source: { type: String, enum: ['manual', 'ocr'], default: 'manual' },
    receiptImage: { type: String }, // path/url to uploaded bill image
    ocrRawText: { type: String }, // raw text extracted from OCR, for audit
  },
  { timestamps: true }
);

// Index for fast monthly aggregation queries
expenseSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
