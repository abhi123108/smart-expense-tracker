const express = require('express');
const cors = require('cors');
const path = require('path');

const { notFound, errorHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const ocrRoutes = require('./routes/ocrRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const reportRoutes = require('./routes/reportRoutes');
const profileRoutes = require('./routes/profileRoutes');
const accountRoutes = require("./routes/accountRoutes");

function createApp() {
  const app = express();

  // =====================================================
  // CORS
  // =====================================================

  app.use(
    cors({
      origin: process.env.CLIENT_URL || '*',
      credentials: true,
    })
  );

  // =====================================================
  // BODY PARSERS
  // =====================================================

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // =====================================================
  // STATIC FILES
  // =====================================================

  app.use(
    '/uploads',
    express.static(path.join(__dirname, 'uploads'))
  );

  // =====================================================
  // HEALTH CHECK
  // =====================================================

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      message: 'Smart Expense Tracker API is running',
    });
  });

  // =====================================================
  // API ROUTES
  // =====================================================

  app.use('/api/auth', authRoutes);

  app.use('/api/expenses', expenseRoutes);

  app.use('/api/ocr', ocrRoutes);

  app.use('/api/budgets', budgetRoutes);

  app.use('/api/reports', reportRoutes);

  // IMPORTANT:
  // Profile photo upload/delete routes
  app.use('/api/profile', profileRoutes);
  app.use("/api/accounts", accountRoutes);

  // =====================================================
  // ERROR HANDLING
  // =====================================================

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;