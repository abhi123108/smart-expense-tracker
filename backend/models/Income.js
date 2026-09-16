const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    source: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Salary",
        "Freelance",
        "Business",
        "Investment",
        "Other",
      ],
      default: "Other",
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Fast queries for user's income history
incomeSchema.index({ user: 1, date: -1 });

// Fast account-wise income queries
incomeSchema.index({ user: 1, account: 1, date: -1 });

module.exports = mongoose.model("Income", incomeSchema);