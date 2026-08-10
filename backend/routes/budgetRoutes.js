const express = require('express');
const router = express.Router();
const { setBudget, getBudgets, deleteBudget, getBudgetAlerts } = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/alerts', getBudgetAlerts);
router.route('/').post(setBudget).get(getBudgets);
router.delete('/:id', deleteBudget);

module.exports = router;
