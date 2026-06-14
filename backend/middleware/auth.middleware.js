const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

// --- Protect routes with JWT ---
const protect = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || "Unauthorized. Please log in.",
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};

// --- Verify MFA is completed for sensitive operations ---
const requireMFA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+mfaEnabled");
    if (user.mfaEnabled && !req.headers["x-mfa-verified"]) {
      return res.status(403).json({
        success: false,
        message: "MFA verification required for this operation.",
        requiresMFA: true,
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

// --- Re-authentication for immutable operations (delete/edit transactions) ---
const requireReauth = async (req, res, next) => {
  const { reauthToken } = req.headers;
  if (!reauthToken) {
    return res.status(403).json({
      success: false,
      message: "Re-authentication required for this sensitive operation.",
      requiresReauth: true,
    });
  }
  try {
    const decoded = jwt.verify(reauthToken, process.env.JWT_SECRET + "_reauth");
    if (decoded.id !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Invalid re-auth token." });
    }
    if (Date.now() - decoded.iat * 1000 > 5 * 60 * 1000) {
      return res.status(403).json({ success: false, message: "Re-auth token expired. Please re-authenticate." });
    }
    next();
  } catch {
    return res.status(403).json({ success: false, message: "Invalid or expired re-auth token." });
  }
};

module.exports = { protect, requireMFA, requireReauth };
