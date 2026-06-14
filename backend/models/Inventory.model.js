const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 100,
    },
    category: { type: String, trim: true, maxlength: 50 },
    currentStock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    reorderLevel: {
      type: Number,
      default: 5,
      min: 0,
    },
    estimatedWholesaleCost: {
      type: Number,
      min: [0, "Cost cannot be negative"],
      default: null, // Optional field
    },
    unit: {
      type: String,
      enum: ["piece", "kg", "gram", "liter", "ml", "dozen", "box", "pack", "other"],
      default: "piece",
    },
    notes: { type: String, trim: true, maxlength: 300 },
    status: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock"],
      default: "in_stock",
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

// Auto-update status based on stock
inventorySchema.pre("save", function (next) {
  if (this.currentStock === 0) {
    this.status = "out_of_stock";
  } else if (this.currentStock <= this.reorderLevel) {
    this.status = "low_stock";
  } else {
    this.status = "in_stock";
  }
  next();
});

inventorySchema.index({ owner: 1, status: 1 });
inventorySchema.index({ owner: 1, productName: 1 });

const Inventory = mongoose.model("Inventory", inventorySchema);
module.exports = Inventory;
