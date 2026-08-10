const express = require('express');
const router = express.Router();
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getSummary,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

router.use(protect); // all expense routes require auth

router.get('/summary', getSummary);
router.route('/').post(createExpense).get(getExpenses);
router.route('/:id').get(getExpenseById).put(updateExpense).delete(deleteExpense);

module.exports = router;
