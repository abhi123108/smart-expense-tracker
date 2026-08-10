const express = require('express');
const cors = require('cors');
const path = require('path');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const ocrRoutes = require('./routes/ocrRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const reportRoutes = require('./routes/reportRoutes');

function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded receipt images statically
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Health check
  app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Smart Expense Tracker API is running' }));

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/ocr', ocrRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/reports', reportRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
