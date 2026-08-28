const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const ocrRoutes = require('./routes/ocrRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const reportRoutes = require('./routes/reportRoutes');

function createApp() {
  const app = express();

  // =====================================================
  // CORS
  // =====================================================

  app.use(
    cors({
      origin: process.env.CLIENT_URL || '*',
    })
  );

  // =====================================================
  // BODY PARSING
  // =====================================================

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // =====================================================
  // STATIC UPLOADS
  // =====================================================

  app.use(
    '/uploads',
    express.static(path.join(__dirname, 'uploads'))
  );

  // =====================================================
  // HEALTH CHECK
  // =====================================================

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Smart Expense Tracker API is running',
    });
  });

  // =====================================================
  // GOOGLE PROFILE PHOTO PROXY
  // =====================================================

  app.get('/api/auth/google-photo', (req, res) => {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        message: 'Image URL is required',
      });
    }

    // Only allow Google's profile image host.
    if (
      !url.startsWith(
        'https://lh3.googleusercontent.com/'
      )
    ) {
      return res.status(400).json({
        message: 'Invalid Google image URL',
      });
    }

    https
      .get(url, (imageResponse) => {
        if (imageResponse.statusCode !== 200) {
          imageResponse.resume();

          return res.status(502).json({
            message:
              'Unable to fetch Google profile image',
          });
        }

        const contentType =
          imageResponse.headers['content-type'];

        res.setHeader(
          'Content-Type',
          contentType || 'image/jpeg'
        );

        res.setHeader(
          'Cache-Control',
          'public, max-age=3600'
        );

        imageResponse.pipe(res);
      })
      .on('error', (error) => {
        console.error(
          'Google profile image proxy error:',
          error
        );

        if (!res.headersSent) {
          res.status(502).json({
            message:
              'Unable to fetch Google profile image',
          });
        }
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

  // =====================================================
  // ERROR HANDLERS
  // =====================================================

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;