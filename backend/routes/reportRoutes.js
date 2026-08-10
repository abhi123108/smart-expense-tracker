const express = require("express");

const router =
  express.Router();

const {
  getMonthlyReport,
  getPrediction,
  getAIInsights,
} = require("../controllers/reportController");

const {
  protect,
} = require("../middleware/auth");

router.use(protect);

// Existing reports
router.get(
  "/monthly",
  getMonthlyReport
);

router.get(
  "/prediction",
  getPrediction
);

// New OpenAI-powered insights
router.get(
  "/ai-insights",
  getAIInsights
);

module.exports = router;
