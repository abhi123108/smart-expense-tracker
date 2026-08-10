const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
        'Overall', // overall monthly budget across all categories
      ],
    },
    monthlyLimit: { type: Number, required: true, min: 0 },
    alertThresholdPercent: { type: Number, default: 80 }, // warn at 80% of budget

    // Email alert state. Used to avoid sending the same alert on every dashboard refresh.
    lastAlertMonth: { type: String, default: null },
    lastAlertLevel: { type: String, default: null },
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
