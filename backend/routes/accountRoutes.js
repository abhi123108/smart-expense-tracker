const express = require("express");

const router = express.Router();

const {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
} = require("../controllers/accountController");

const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/")
  .post(createAccount)
  .get(getAccounts);

router.route("/:id")
  .get(getAccountById)
  .put(updateAccount)
  .delete(deleteAccount);

module.exports = router;