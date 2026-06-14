import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post("/auth/register", { name: data.name, email: data.email, password: data.password });
      toast.success("Registration successful! Check your email to verify your account.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-mesh">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8 shadow-glass">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600/80 shadow-glow-md mb-4">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-1">Owner Registration</h1>
            <p className="text-white/40 text-sm">Create your secure owner account</p>
          </div>

          <div className="glass-card p-3 mb-6 border-amber-500/20 bg-amber-500/5">
            <p className="text-amber-400 text-xs text-center">
              ⚠️ Access is restricted to the authorized owner email only.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { name: "name", label: "Full Name", type: "text", placeholder: "Your name" },
              { name: "email", label: "Email Address", type: "email", placeholder: "owner@yourshop.com" },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-white/70 mb-1.5">{label}</label>
                <input type={type} placeholder={placeholder} className={`input-field ${errors[name] ? "border-rose-500/60" : ""}`} {...register(name)} />
                {errors[name] && <p className="text-rose-400 text-xs mt-1">{errors[name].message}</p>}
              </div>
            ))}

            {["password", "confirmPassword"].map((name) => (
              <div key={name}>
                <label className="block text-sm font-medium text-white/70 mb-1.5">
                  {name === "password" ? "Password" : "Confirm Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={name === "password" ? "Min 8 chars, uppercase & number" : "Repeat password"}
                    className={`input-field pr-12 ${errors[name] ? "border-rose-500/60" : ""}`}
                    {...register(name)}
                  />
                  {name === "password" && (
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {errors[name] && <p className="text-rose-400 text-xs mt-1">{errors[name].message}</p>}
              </div>
            ))}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm mt-6">
            Already registered?{" "}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
