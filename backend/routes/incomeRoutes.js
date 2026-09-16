const express = require("express");

const router = express.Router();

const {
  createIncome,
  getIncome,
  getIncomeById,
  updateIncome,
  deleteIncome,
} = require("../controllers/incomeController");

const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/")
  .post(createIncome)
  .get(getIncome);

router.route("/:id")
  .get(getIncomeById)
  .put(updateIncome)
  .delete(deleteIncome);

module.exports = router;