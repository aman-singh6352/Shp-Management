const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const User = require("../models/User.model");
const { sendEmail } = require("../utils/email");
const logger = require("../utils/logger");

// --- Token Generators ---
const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "15m" });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d" });

const generateReauthToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET + "_reauth", { expiresIn: "5m" });

const sendTokenResponse = (user, statusCode, res, extraData = {}) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      mfaEnabled: user.mfaEnabled,
      authProvider: user.authProvider,
    },
    ...extraData,
  });
};

// --- @POST /api/auth/register ---
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Account already exists." });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      verificationToken: crypto.createHash("sha256").update(verificationToken).digest("hex"),
      verificationExpiry: Date.now() + 24 * 60 * 60 * 1000,
      authProvider: "local",
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: "🔐 Verify Your Store Ledger Account",
      html: `<h2>Welcome, ${user.name}!</h2><p>Click below to verify your account:</p><a href="${verifyUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Verify Email</a><p>Expires in 24 hours.</p>`,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful! Please verify your email.",
    });
  } catch (err) {
    next(err);
  }
};

// --- @POST /api/auth/verify-email ---
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification token." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpiry = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// --- @POST /api/auth/login ---
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password +loginAttempts +lockUntil +mfaEnabled +mfaSecret +emailOtp +emailOtpExpiry"
    );

    if (!user || user.authProvider !== "local") {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: "Account temporarily locked due to too many failed attempts. Try again in 2 hours.",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email first." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = Date.now();

    // Check MFA
    if (user.mfaEnabled) {
      // Generate and send email OTP as backup
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.emailOtp = crypto.createHash("sha256").update(otp).digest("hex");
      user.emailOtpExpiry = Date.now() + 10 * 60 * 1000;
      await user.save();

      await sendEmail({
        to: user.email,
        subject: "🔑 Store Ledger Login OTP",
        html: `<h2>Login OTP</h2><p>Your OTP: <strong style="font-size:24px;letter-spacing:4px;">${otp}</strong></p><p>Valid for 10 minutes.</p>`,
      });

      return res.status(200).json({
        success: true,
        requiresMFA: true,
        mfaUserId: user._id,
        message: "MFA required. Check your authenticator app or email OTP.",
      });
    }

    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// --- @POST /api/auth/mfa/verify ---
exports.verifyMFA = async (req, res, next) => {
  try {
    const { userId, totpToken, emailOtp } = req.body;
    const user = await User.findById(userId).select(
      "+mfaSecret +emailOtp +emailOtpExpiry"
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    let verified = false;

    // Verify TOTP
    if (totpToken && user.mfaSecret) {
      verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: "base32",
        token: totpToken,
        window: 2,
      });
    }

    // Fallback: Email OTP
    if (!verified && emailOtp) {
      const hashedOtp = crypto.createHash("sha256").update(emailOtp).digest("hex");
      if (user.emailOtp === hashedOtp && user.emailOtpExpiry > Date.now()) {
        verified = true;
        user.emailOtp = undefined;
        user.emailOtpExpiry = undefined;
      }
    }

    if (!verified) {
      return res.status(401).json({ success: false, message: "Invalid MFA token." });
    }

    user.lastLogin = Date.now();
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// --- @POST /api/auth/mfa/setup ---
exports.setupMFA = async (req, res, next) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `StoreLedger (${req.user.email})`,
      length: 20,
    });

    await User.findByIdAndUpdate(req.user._id, { mfaSecret: secret.base32 });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ success: true, secret: secret.base32, qrCode: qrCodeUrl });
  } catch (err) {
    next(err);
  }
};

// --- @POST /api/auth/mfa/enable ---
exports.enableMFA = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id).select("+mfaSecret");

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token,
      window: 2,
    });

    if (!verified) return res.status(400).json({ success: false, message: "Invalid TOTP token." });

    user.mfaEnabled = true;
    await user.save();

    res.json({ success: true, message: "MFA enabled successfully." });
  } catch (err) {
    next(err);
  }
};

// --- @POST /api/auth/reauth ---
exports.reauth = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Incorrect password." });

    const reauthToken = generateReauthToken(user._id);
    res.json({ success: true, reauthToken, expiresIn: "5m" });
  } catch (err) {
    next(err);
  }
};

// --- @POST /api/auth/refresh ---
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: "Refresh token required." });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: "Invalid refresh token." });

    const accessToken = generateAccessToken(user._id);
    res.json({ success: true, accessToken });
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired refresh token." });
  }
};

// --- @POST /api/auth/forgot-password ---
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ success: true, message: "If that email exists, a reset link was sent." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpiry = Date.now() + 60 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: "🔐 Reset Your Store Ledger Password",
      html: `<h2>Password Reset</h2><p>Click below to reset your password:</p><a href="${resetUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Reset Password</a><p>Expires in 1 hour.</p>`,
    });

    res.json({ success: true, message: "If that email exists, a reset link was sent." });
  } catch (err) {
    next(err);
  }
};

// --- @POST /api/auth/reset-password ---
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ success: false, message: "Invalid or expired reset token." });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successful. Please log in." });
  } catch (err) {
    next(err);
  }
};

// --- @GET /api/auth/me ---
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// --- OAuth Success Handler ---
exports.oauthSuccess = (req, res) => {
  const accessToken = generateAccessToken(req.user._id);
  const refreshToken = generateRefreshToken(req.user._id);
  res.redirect(
    `${process.env.FRONTEND_URL}/oauth-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
  );
};

// --- OAuth Failure Handler ---
exports.oauthFailure = (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
};
