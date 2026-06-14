// ForgotPasswordPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("Reset link sent if that email exists!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-mesh">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="glass-card p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-600/80 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-display text-xl font-bold mb-2">Reset Password</h2>
          <p className="text-white/40 text-sm mb-6">Enter your owner email to receive a reset link.</p>
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <input type="email" placeholder="owner@yourshop.com" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <div className="badge-success mx-auto w-fit px-4 py-2 text-sm">Reset link sent!</div>
          )}
          <Link to="/login" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mt-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPasswordPage;
