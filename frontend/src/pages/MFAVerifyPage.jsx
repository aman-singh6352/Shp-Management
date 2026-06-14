// MFAVerifyPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import useAuthStore from "../context/authStore";

export function MFAVerifyPage() {
  const [totpToken, setTotpToken] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { mfaUserId, setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/mfa/verify", { userId: mfaUserId, totpToken: totpToken || undefined, emailOtp: emailOtp || undefined });
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      navigate("/dashboard");
      toast.success("Authenticated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "MFA verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-mesh">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="glass-card p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-600/80 flex items-center justify-center mx-auto mb-4 shadow-glow-md">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">Two-Factor Auth</h2>
          <p className="text-white/40 text-sm mb-6">Enter your 6-digit code from your authenticator app, or the OTP sent to your email.</p>
          <form onSubmit={handleVerify} className="space-y-4 text-left">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Authenticator App Code</label>
              <input className="input-field text-center font-mono text-lg tracking-widest" placeholder="000000" maxLength={6} value={totpToken} onChange={(e) => setTotpToken(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" /><span className="text-white/30 text-xs">or</span><div className="flex-1 h-px bg-white/10" />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Email OTP</label>
              <input className="input-field text-center font-mono text-lg tracking-widest" placeholder="000000" maxLength={6} value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} />
            </div>
            <button type="submit" disabled={loading || (!totpToken && !emailOtp)} className="btn-primary w-full py-3">
              {loading ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Verify Identity"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default MFAVerifyPage;
