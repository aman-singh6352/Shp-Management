const express = require("express");
const router = express.Router();
const {
  getCustomers, getCustomer, createCustomer,
  updateCustomer, deleteCustomer, getCustomerDueSummary,
} = require("../controllers/customer.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.route("/").get(getCustomers).post(createCustomer);
router.route("/:id").get(getCustomer).put(updateCustomer).delete(deleteCustomer);
router.get("/:id/due-summary", getCustomerDueSummary);

module.exports = router;
