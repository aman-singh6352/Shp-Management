const express = require("express");
const passport = require("passport");
const router = express.Router();
const {
  register, login, verifyEmail, verifyMFA,
  setupMFA, enableMFA, reauth, refreshToken,
  forgotPassword, resetPassword, getMe, oauthSuccess, oauthFailure,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

// --- Local Auth ---
router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/mfa/verify", verifyMFA);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refreshToken);

// --- Protected ---
router.get("/me", protect, getMe);
router.post("/reauth", protect, reauth);
router.post("/mfa/setup", protect, setupMFA);
router.post("/mfa/enable", protect, enableMFA);

// --- Google OAuth ---
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/api/auth/oauth/failure" }),
  oauthSuccess
);

// --- Facebook OAuth ---
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"], session: false }));
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false, failureRedirect: "/api/auth/oauth/failure" }),
  oauthSuccess
);

// --- OAuth Failure ---
router.get("/oauth/failure", oauthFailure);

module.exports = router;
