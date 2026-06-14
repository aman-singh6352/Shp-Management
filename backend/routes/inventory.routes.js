const express = require("express");
const router = express.Router();
const {
  getInventory, createItem, updateItem, deleteItem, restockItem,
} = require("../controllers/inventory.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.route("/").get(getInventory).post(createItem);
router.route("/:id").put(updateItem).delete(deleteItem);
router.patch("/:id/restock", restockItem);

module.exports = router;
