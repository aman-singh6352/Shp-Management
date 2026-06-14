// VerifyEmailPage.jsx
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import api from "../services/api";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); return; }
    api.post("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-mesh">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 text-center max-w-sm w-full">
        {status === "loading" && <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />}
        {status === "success" && (
          <>
            <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">Email Verified!</h2>
            <p className="text-white/50 text-sm mb-6">Your account is now active.</p>
            <Link to="/login" className="btn-primary inline-flex">Go to Login</Link>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-14 h-14 text-rose-400 mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold mb-2">Verification Failed</h2>
            <p className="text-white/50 text-sm mb-6">Invalid or expired token.</p>
            <Link to="/login" className="btn-ghost inline-flex">Back to Login</Link>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default VerifyEmailPage;
