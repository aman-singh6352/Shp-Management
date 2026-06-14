const Customer = require("../models/Customer.model");
const Transaction = require("../models/Transaction.model");
const Inventory = require("../models/Inventory.model");

// --- @GET /api/dashboard/stats ---
exports.getDashboardStats = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));

    const [
      totalCustomers,
      totalDueAmount,
      todayTransactions,
      monthlyTransactions,
      lowStockItems,
      outOfStockItems,
      recentTransactions,
      topDebtors,
    ] = await Promise.all([
      Customer.countDocuments({ owner: ownerId, isActive: true }),
      Customer.aggregate([
        { $match: { owner: ownerId, isActive: true } },
        { $group: { _id: null, total: { $sum: "$totalDue" } } },
      ]),
      Transaction.countDocuments({ owner: ownerId, isDeleted: false, transactionDate: { $gte: startOfToday } }),
      Transaction.aggregate([
        { $match: { owner: ownerId, isDeleted: false, transactionDate: { $gte: startOfMonth }, type: "credit" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
      ]),
      Inventory.countDocuments({ owner: ownerId, status: "low_stock", isActive: true }),
      Inventory.countDocuments({ owner: ownerId, status: "out_of_stock", isActive: true }),
      Transaction.find({ owner: ownerId, isDeleted: false })
        .populate("customer", "name customerId")
        .sort({ transactionDate: -1 })
        .limit(5),
      Customer.find({ owner: ownerId, isActive: true, totalDue: { $gt: 0 } })
        .sort({ totalDue: -1 })
        .limit(5)
        .select("name customerId totalDue phone"),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalCustomers,
          totalDueAmount: totalDueAmount[0]?.total || 0,
          todayTransactions,
          monthlyRevenue: monthlyTransactions[0]?.total || 0,
          monthlyTransactionCount: monthlyTransactions[0]?.count || 0,
          lowStockItems,
          outOfStockItems,
        },
        recentTransactions,
        topDebtors,
      },
    });
  } catch (err) {
    next(err);
  }
};
