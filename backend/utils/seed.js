/**
 * Seed Script — Optional
 * Run with: npm run seed
 * Populates sample customers, transactions, and inventory items
 * for the currently configured OWNER_EMAIL (must already be registered).
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User.model");
const Customer = require("../models/Customer.model");
const Transaction = require("../models/Transaction.model");
const Inventory = require("../models/Inventory.model");
const logger = require("./logger");

const seed = async () => {
  await connectDB();

  const owner = await User.findOne({ email: process.env.OWNER_EMAIL?.toLowerCase() });
  if (!owner) {
    logger.error("Owner account not found. Please register first via /api/auth/register.");
    process.exit(1);
  }

  // Sample Customers
  const customers = await Customer.insertMany([
    { name: "Ramesh Kumar", phone: "+91 98765 43210", address: "12 MG Road", owner: owner._id },
    { name: "Sita Devi", phone: "+91 91234 56789", address: "5 Gandhi Nagar", owner: owner._id },
  ]);

  // Sample Transactions
  for (const customer of customers) {
    const tx = await Transaction.create({
      customer: customer._id,
      owner: owner._id,
      lineItems: [
        { productName: "Rice (5kg)", unitPrice: 250, quantity: 1 },
        { productName: "Cooking Oil", unitPrice: 180, quantity: 2 },
      ],
      type: "credit",
    });
    customer.totalDue = tx.totalAmount;
    await customer.save();
  }

  // Sample Inventory
  await Inventory.insertMany([
    { productName: "Sunflower Oil 1L", category: "Groceries", currentStock: 0, reorderLevel: 5, estimatedWholesaleCost: 140, unit: "piece", owner: owner._id },
    { productName: "Basmati Rice", category: "Groceries", currentStock: 3, reorderLevel: 10, unit: "kg", owner: owner._id },
    { productName: "Sugar", category: "Groceries", currentStock: 25, reorderLevel: 10, unit: "kg", owner: owner._id },
  ]);

  logger.info("✅ Seed data inserted successfully!");
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  logger.error(`Seed error: ${err.message}`);
  process.exit(1);
});
