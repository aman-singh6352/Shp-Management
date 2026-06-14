import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token: searchParams.get("token"), password });
      toast.success("Password reset successfully! Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-mesh">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="glass-card p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-600/80 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">New Password</h2>
          <p className="text-white/40 text-sm mb-6">Set a strong password for your account.</p>
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <input type="password" placeholder="New password (min 8 chars)" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Reset Password"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
