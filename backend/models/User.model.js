const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [60, "Name cannot exceed 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    avatar: { type: String, default: null },
    role: { type: String, enum: ["owner"], default: "owner" },
    authProvider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },
    googleId: { type: String, sparse: true },
    facebookId: { type: String, sparse: true },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // MFA / TOTP
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, select: false },
    mfaBackupCodes: { type: [String], select: false },

    // Email OTP
    emailOtp: { type: String, select: false },
    emailOtpExpiry: { type: Date, select: false },

    // Email Verification
    verificationToken: { type: String, select: false },
    verificationExpiry: { type: Date, select: false },

    // Password Reset
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpiry: { type: Date, select: false },

    // Refresh Token
    refreshToken: { type: String, select: false },

    // Login Tracking
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Hash password before save ---
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Compare password ---
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// --- Check if account is locked ---
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// --- Increment login attempts ---
userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  return this.updateOne(updates);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
