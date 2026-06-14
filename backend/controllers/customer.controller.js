const Customer = require("../models/Customer.model");
const Transaction = require("../models/Transaction.model");

// --- @GET /api/customers ---
exports.getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20, sortBy = "name", order = "asc" } = req.query;
    const query = { owner: req.user._id, isActive: true };
    if (search) query.name = { $regex: search, $options: "i" };

    const sortOrder = order === "desc" ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ [sortBy]: sortOrder }).skip(skip).limit(parseInt(limit)),
      Customer.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: customers,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// --- @GET /api/customers/:id ---
exports.getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, owner: req.user._id });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

// --- @POST /api/customers ---
exports.createCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, notes } = req.body;
    const customer = await Customer.create({ name, phone, address, notes, owner: req.user._id });
    res.status(201).json({ success: true, data: customer, message: "Customer created successfully." });
  } catch (err) {
    next(err);
  }
};

// --- @PUT /api/customers/:id ---
exports.updateCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, notes } = req.body;
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { name, phone, address, notes },
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
    res.json({ success: true, data: customer, message: "Customer updated." });
  } catch (err) {
    next(err);
  }
};

// --- @DELETE /api/customers/:id (soft delete) ---
exports.deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
    res.json({ success: true, message: "Customer deactivated." });
  } catch (err) {
    next(err);
  }
};

// --- @GET /api/customers/:id/due-summary ---
exports.getCustomerDueSummary = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, owner: req.user._id });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });

    const transactions = await Transaction.find({
      customer: customer._id,
      owner: req.user._id,
      isDeleted: false,
    }).sort({ transactionDate: -1 });

    res.json({ success: true, data: { customer, transactions, totalDue: customer.totalDue } });
  } catch (err) {
    next(err);
  }
};
