const Inventory = require("../models/Inventory.model");

// --- @GET /api/inventory ---
exports.getInventory = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = { owner: req.user._id, isActive: true };

    if (status) query.status = status;
    if (search) query.productName = { $regex: search, $options: "i" };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Inventory.find(query).sort({ status: 1, productName: 1 }).skip(skip).limit(parseInt(limit)),
      Inventory.countDocuments(query),
    ]);

    const summary = await Inventory.aggregate([
      { $match: { owner: req.user._id, isActive: true } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: items,
      summary: summary.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// --- @POST /api/inventory ---
exports.createItem = async (req, res, next) => {
  try {
    const { productName, category, currentStock, reorderLevel, estimatedWholesaleCost, unit, notes } = req.body;
    const item = await Inventory.create({
      productName, category, currentStock, reorderLevel,
      estimatedWholesaleCost, unit, notes, owner: req.user._id,
    });
    res.status(201).json({ success: true, data: item, message: "Item added to inventory." });
  } catch (err) {
    next(err);
  }
};

// --- @PUT /api/inventory/:id ---
exports.updateItem = async (req, res, next) => {
  try {
    const item = await Inventory.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ success: false, message: "Item not found." });
    res.json({ success: true, data: item, message: "Item updated." });
  } catch (err) {
    next(err);
  }
};

// --- @DELETE /api/inventory/:id ---
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await Inventory.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, message: "Item not found." });
    res.json({ success: true, message: "Item removed from inventory." });
  } catch (err) {
    next(err);
  }
};

// --- @PATCH /api/inventory/:id/restock ---
exports.restockItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const item = await Inventory.findOne({ _id: req.params.id, owner: req.user._id });
    if (!item) return res.status(404).json({ success: false, message: "Item not found." });
    item.currentStock += parseInt(quantity);
    await item.save();
    res.json({ success: true, data: item, message: `Restocked by ${quantity} units.` });
  } catch (err) {
    next(err);
  }
};
