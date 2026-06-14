const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const customerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      default: () => `CUST-${uuidv4().slice(0, 8).toUpperCase()}`,
      unique: true,
      immutable: true,
    },
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[\d\s\-()]{7,15}$/, "Please provide a valid phone number"],
    },
    address: { type: String, trim: true, maxlength: 200 },
    notes: { type: String, trim: true, maxlength: 500 },
    totalDue: {
      type: Number,
      default: 0,
      min: [0, "Total due cannot be negative"],
    },
    isActive: { type: Boolean, default: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

customerSchema.index({ owner: 1, name: 1 });
customerSchema.index({ customerId: 1 });

const Customer = mongoose.model("Customer", customerSchema);
module.exports = Customer;
