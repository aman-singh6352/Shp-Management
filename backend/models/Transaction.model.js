const mongoose = require("mongoose");

const lineItemSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 100,
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Price cannot be negative"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    subtotal: { type: Number },
  },
  { _id: true }
);

lineItemSchema.pre("save", function (next) {
  this.subtotal = parseFloat((this.unitPrice * this.quantity).toFixed(2));
  next();
});

const transactionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lineItems: {
      type: [lineItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "At least one line item is required",
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ["credit", "payment", "adjustment"],
      default: "credit",
    },
    status: {
      type: String,
      enum: ["pending", "partial", "settled"],
      default: "pending",
    },
    notes: { type: String, trim: true, maxlength: 500 },

    // Smart Timestamping - manual override support
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    isBackdated: { type: Boolean, default: false },
    originalEntryDate: { type: Date, default: Date.now, immutable: true },

    // Immutability & Audit Trail
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deleteReason: { type: String },

    // Checksum for tamper detection
    checksum: { type: String, select: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-calculate totalAmount from lineItems
transactionSchema.pre("save", function (next) {
  if (this.lineItems && this.lineItems.length > 0) {
    this.lineItems.forEach((item) => {
      item.subtotal = parseFloat((item.unitPrice * item.quantity).toFixed(2));
    });
    this.totalAmount = parseFloat(
      this.lineItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)
    );
  }

  // Detect backdating
  const now = new Date();
  const txDate = new Date(this.transactionDate);
  const diffHours = (now - txDate) / (1000 * 60 * 60);
  this.isBackdated = diffHours > 1;

  next();
});

transactionSchema.index({ customer: 1, owner: 1, transactionDate: -1 });
transactionSchema.index({ owner: 1, isDeleted: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;
