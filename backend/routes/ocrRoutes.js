const express = require('express');
const router = express.Router();
const { scanBill, confirmOcrExpense } = require('../controllers/ocrController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/scan', protect, upload.single('bill'), scanBill);
router.post('/confirm', protect, confirmOcrExpense);

module.exports = router;
