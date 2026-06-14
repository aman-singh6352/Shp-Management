const Transaction = require("../models/Transaction.model");
const Customer = require("../models/Customer.model");
const mongoose = require("mongoose");

// --- @GET /api/transactions ---
exports.getTransactions = async (req, res, next) => {
  try {
    const { customerId, type, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = { owner: req.user._id, isDeleted: false };

    if (customerId) query.customer = customerId;
    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate("customer", "name customerId phone")
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// --- @GET /api/transactions/:id ---
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false,
    }).populate("customer", "name customerId phone");

    if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found." });
    res.json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

// --- @POST /api/transactions ---
exports.createTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerId, lineItems, notes, transactionDate, type = "credit" } = req.body;

    const customer = await Customer.findOne({ _id: customerId, owner: req.user._id }).session(session);
    if (!customer) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    const [transaction] = await Transaction.create(
      [{ customer: customerId, owner: req.user._id, lineItems, notes, transactionDate: transactionDate || Date.now(), type }],
      { session }
    );

    // Update customer totalDue
    if (type === "credit") {
      customer.totalDue = parseFloat((customer.totalDue + transaction.totalAmount).toFixed(2));
    } else if (type === "payment") {
      customer.totalDue = Math.max(0, parseFloat((customer.totalDue - transaction.totalAmount).toFixed(2)));
    }
    await customer.save({ session });

    await session.commitTransaction();
    await transaction.populate("customer", "name customerId phone");

    res.status(201).json({ success: true, data: transaction, message: "Transaction recorded successfully." });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// --- @PATCH /api/transactions/:id/soft-delete (requires re-auth) ---
exports.softDeleteTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { reason } = req.body;
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      owner: req.user._id,
      isDeleted: false,
    }).session(session);

    if (!transaction) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    // Reverse the amount on customer
    const customer = await Customer.findById(transaction.customer).session(session);
    if (customer) {
      if (transaction.type === "credit") {
        customer.totalDue = Math.max(0, parseFloat((customer.totalDue - transaction.totalAmount).toFixed(2)));
      } else if (transaction.type === "payment") {
        customer.totalDue = parseFloat((customer.totalDue + transaction.totalAmount).toFixed(2));
      }
      await customer.save({ session });
    }

    transaction.isDeleted = true;
    transaction.deletedAt = new Date();
    transaction.deletedBy = req.user._id;
    transaction.deleteReason = reason || "No reason provided";
    await transaction.save({ session });

    await session.commitTransaction();
    res.json({ success: true, message: "Transaction voided with audit trail preserved." });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// --- @GET /api/transactions/audit-log ---
exports.getAuditLog = async (req, res, next) => {
  try {
    const deletedTransactions = await Transaction.find({
      owner: req.user._id,
      isDeleted: true,
    })
      .populate("customer", "name customerId")
      .populate("deletedBy", "name email")
      .sort({ deletedAt: -1 });

    res.json({ success: true, data: deletedTransactions });
  } catch (err) {
    next(err);
  }
};
