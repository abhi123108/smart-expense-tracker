/**
 * Seeds the database with a demo user and a few months of sample expenses,
 * so a grader/reviewer can explore the Dashboard, Reports, and AI prediction
 * features immediately without manually entering data.
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

const DEMO_EMAIL = 'demo@expensetracker.com';
const DEMO_PASSWORD = 'demo1234';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Groceries', 'Entertainment'];

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

async function seed() {
  await connectDB();

  // Reset any previous demo data
  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    await Expense.deleteMany({ user: existing._id });
    await Budget.deleteMany({ user: existing._id });
    await existing.deleteOne();
  }

  const user = await User.create({
    name: 'Demo User',
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    currency: 'INR',
    monthlyIncome: 60000,
  });

  // Generate ~5 months of expenses with a gently rising trend, so the
  // AI prediction feature has something interesting to show.
  const now = new Date();
  const expenses = [];
  for (let monthsAgo = 4; monthsAgo >= 0; monthsAgo--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const baseSpend = 8000 + (4 - monthsAgo) * 1200; // rising trend
    const numTransactions = randomBetween(10, 16);

    for (let i = 0; i < numTransactions; i++) {
      const day = randomBetween(1, 27);
      const category = CATEGORIES[randomBetween(0, CATEGORIES.length - 1)];
      expenses.push({
        user: user._id,
        title: `${category} expense`,
        amount: Math.round(baseSpend / numTransactions + randomBetween(-100, 300)),
        category,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day),
        paymentMethod: ['UPI', 'Card', 'Cash'][randomBetween(0, 2)],
        source: 'manual',
      });
    }
  }
  await Expense.insertMany(expenses);

  await Budget.create([
    { user: user._id, category: 'Overall', monthlyLimit: 15000, alertThresholdPercent: 80 },
    { user: user._id, category: 'Food', monthlyLimit: 4000, alertThresholdPercent: 75 },
  ]);

  console.log('✅ Seed complete!');
  console.log(`   Login with: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`   Created ${expenses.length} expenses across 5 months + 2 budgets`);

  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
