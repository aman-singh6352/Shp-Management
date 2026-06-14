import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import {
  Settings,
  ShieldCheck,
  Smartphone,
  Mail,
  Key,
  CheckCircle,
  Copy,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import useAuthStore from "../context/authStore";

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [totpToken, setTotpToken] = useState("");

  const setupMutation = useMutation({
    mutationFn: () => api.post("/auth/mfa/setup"),
    onSuccess: (res) => {
      setQrCode(res.data.qrCode);
      setSecret(res.data.secret);
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to setup MFA"),
  });

  const enableMutation = useMutation({
    mutationFn: (token) => api.post("/auth/mfa/enable", { token }),
    onSuccess: () => {
      updateUser({ mfaEnabled: true });
      setQrCode(null);
      setSecret(null);
      setTotpToken("");
      toast.success("MFA enabled! Your account is now extra secure.");
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Invalid code"),
  });

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copied to clipboard");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title flex items-center gap-3">
          <Settings className="w-6 h-6 text-primary-400" />
          Settings
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Manage your account security
        </p>
      </div>

      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Key className="w-4 h-4 text-primary-400" />
          Profile
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm text-white/40">Name</span>
            <span className="text-sm text-white font-medium">{user?.name}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm text-white/40">Email</span>
            <span className="text-sm text-white font-medium">
              {user?.email}
            </span>
          </div>
        </div>
      </motion.div>

      {/* MFA Setup */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary-400" />
            Multi-Factor Authentication
          </h3>
          {user?.mfaEnabled ? (
            <span className="badge-success">
              <CheckCircle className="w-3 h-3" />
              Active
            </span>
          ) : (
            <span className="badge-warning">Inactive</span>
          )}
        </div>

        {user?.mfaEnabled ? (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-sm text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Your account is protected with TOTP authenticator + email OTP
              fallback.
            </p>
          </div>
        ) : !qrCode ? (
          <div>
            <p className="text-sm text-white/50 mb-4">
              Add an extra layer of security using an authenticator app (Google
              Authenticator, Authy, etc.) plus email OTP backup.
            </p>
            <button
              onClick={() => setupMutation.mutate()}
              disabled={setupMutation.isPending}
              className="btn-primary"
            >
              {setupMutation.isPending ? "Generating..." : "Set Up MFA"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-white/50">
              1. Scan this QR code with your authenticator app:
            </p>
            <div className="bg-white p-4 rounded-xl w-fit mx-auto">
              <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
            </div>
            <div className="bg-white/3 rounded-xl p-3 flex items-center justify-between">
              <code className="text-xs text-white/60 font-mono break-all">
                {secret}
              </code>
              <button
                onClick={copySecret}
                className="shrink-0 ml-2 text-primary-400 hover:text-primary-300"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-white/50">
              2. Enter the 6-digit code to confirm:
            </p>
            <div className="flex gap-3">
              <input
                className="input-field text-center font-mono text-lg tracking-widest flex-1"
                placeholder="000000"
                maxLength={6}
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value)}
              />
              <button
                onClick={() => enableMutation.mutate(totpToken)}
                disabled={totpToken.length !== 6 || enableMutation.isPending}
                className="btn-primary"
              >
                {enableMutation.isPending ? "Verifying..." : "Enable MFA"}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Email OTP Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-6"
      >
        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary-400" />
          Email OTP
        </h3>
        <p className="text-sm text-white/50">
          Email OTP is automatically sent as a fallback during login whenever
          MFA is enabled, giving you a backup access method if you lose your
          authenticator device.
        </p>
      </motion.div>

      {/* Data Integrity Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary-400" />
          Data Integrity
        </h3>
        <ul className="text-sm text-white/50 space-y-2 list-disc list-inside">
          <li>
            Voiding a transaction requires password re-authentication and is
            permanently logged in the Audit Log.
          </li>
          <li>
            This system is restricted to a single owner account — no other users
            can register or access your data.
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
