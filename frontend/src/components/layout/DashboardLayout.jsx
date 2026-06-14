import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, ArrowLeftRight, Package,
  Settings, ClipboardList, LogOut, Menu, X,
  ShieldCheck, Bell, ChevronRight,
} from "lucide-react";
import useAuthStore from "../../context/authStore";
import api from "../../services/api";
import toast from "react-hot-toast";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { to: "/inventory", icon: Package, label: "Inventory" },
  { to: "/audit-log", icon: ClipboardList, label: "Audit Log" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-glow-sm">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-base leading-tight">Store Ledger</h1>
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Owner Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
        <p className="section-label mb-3 px-3">Navigation</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}>
            {({ isActive }) => (
              <div className={isActive ? "nav-link-active" : "nav-link"}>
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Area */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary-600/80 flex items-center justify-center text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() || "O"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
          </div>
          {user?.mfaEnabled && (
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" title="MFA Active" />
          )}
        </div>
        <button onClick={handleLogout} className="w-full nav-link text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col glass-card rounded-none border-r border-white/5 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 glass-card rounded-none border-r border-white/10 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-surface-950/80 backdrop-blur-sm shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-white/8 text-white/60 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-xl hover:bg-white/8 text-white/40 hover:text-white transition-colors relative">
              <Bell className="w-4.5 h-4.5" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-white/60">System Secure</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
