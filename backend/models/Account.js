const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    type: {
      type: String,
      enum: [
        "Cash",
        "Bank",
        "UPI",
        "Credit Card",
        "Debit Card",
        "Wallet",
        "Other",
      ],
      default: "Bank",
    },

    initialBalance: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    currentBalance: {
      type: Number,
      required: true,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

accountSchema.index({ user: 1, name: 1 });

module.exports = mongoose.model("Account", accountSchema);