const express = require("express");
const router = express.Router();
const {
  getTransactions, getTransaction, createTransaction,
  softDeleteTransaction, getAuditLog,
} = require("../controllers/transaction.controller");
const { protect, requireReauth } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/audit-log", getAuditLog);
router.route("/").get(getTransactions).post(createTransaction);
router.get("/:id", getTransaction);
router.patch("/:id/void", requireReauth, softDeleteTransaction);

module.exports = router;
