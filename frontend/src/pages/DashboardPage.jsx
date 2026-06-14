import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users, TrendingUp, IndianRupee, AlertTriangle,
  Package, ArrowUpRight, Clock
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";
import { format } from "date-fns";
import api from "../services/api";
import useAuthStore from "../context/authStore";

const StatCard = ({ icon: Icon, label, value, subValue, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="stat-card"
  >
    <div className="flex items-start justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <ArrowUpRight className="w-4 h-4 text-white/20" />
    </div>
    <div>
      <p className="section-label">{label}</p>
      <p className="font-display text-2xl font-bold text-white mt-1">{value}</p>
      {subValue && <p className="text-xs text-white/40 mt-0.5">{subValue}</p>}
    </div>
  </motion.div>
);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs">
        <p className="text-white/60">{payload[0]?.payload?.date}</p>
        <p className="text-primary-400 font-semibold">₹{payload[0]?.value?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/dashboard/stats").then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const stats = data?.stats || {};
  const recentTransactions = data?.recentTransactions || [];
  const topDebtors = data?.topDebtors || [];

  const chartData = recentTransactions
    .slice(0, 7)
    .reverse()
    .map((t) => ({
      date: format(new Date(t.transactionDate), "dd MMM"),
      amount: t.totalAmount,
    }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">
          Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"},{" "}
          <span className="text-gradient">{user?.name?.split(" ")[0]}</span> 👋
        </h1>
        <p className="text-white/40 text-sm mt-1">
          {format(new Date(), "EEEE, d MMMM yyyy")} · Your store at a glance
        </p>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Customers" value={isLoading ? "—" : stats.totalCustomers || 0}
          subValue="Active accounts" color="bg-primary-500/20 text-primary-400" delay={0.05} />
        <StatCard icon={IndianRupee} label="Total Outstanding" value={isLoading ? "—" : `₹${(stats.totalDueAmount || 0).toLocaleString()}`}
          subValue="Across all customers" color="bg-rose-500/20 text-rose-400" delay={0.1} />
        <StatCard icon={TrendingUp} label="Monthly Credits" value={isLoading ? "—" : `₹${(stats.monthlyRevenue || 0).toLocaleString()}`}
          subValue={`${stats.monthlyTransactionCount || 0} transactions`} color="bg-emerald-500/20 text-emerald-400" delay={0.15} />
        <StatCard icon={Package} label="Stock Alerts" value={isLoading ? "—" : (stats.lowStockItems || 0) + (stats.outOfStockItems || 0)}
          subValue={`${stats.outOfStockItems || 0} out · ${stats.lowStockItems || 0} low`} color="bg-amber-500/20 text-amber-400" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-white">Recent Transactions</h3>
              <p className="text-xs text-white/40">Credit amounts over last 7 entries</p>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#areaGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-white/20 text-sm">No transactions yet</div>
          )}
        </motion.div>

        {/* Top Debtors */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4">Top Debtors</h3>
          <div className="space-y-3">
            {topDebtors.length === 0 ? (
              <p className="text-white/20 text-sm text-center py-6">No outstanding dues</p>
            ) : (
              topDebtors.map((c, i) => (
                <Link to={`/customers/${c._id}`} key={c._id} className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary-600/60 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{c.name}</p>
                    <p className="text-xs text-white/40">{c.customerId}</p>
                  </div>
                  <span className="text-rose-400 font-num text-sm font-semibold">₹{c.totalDue.toLocaleString()}</span>
                </Link>
              ))
            )}
          </div>
          {topDebtors.length > 0 && (
            <Link to="/customers" className="mt-4 text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-white">Recent Activity</h3>
          <Link to="/transactions" className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-white/5">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-white/20 text-sm">No transactions recorded yet</div>
          ) : (
            recentTransactions.map((tx) => (
              <div key={tx._id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === "credit" ? "bg-rose-500/15" : "bg-emerald-500/15"}`}>
                  <IndianRupee className={`w-4 h-4 ${tx.type === "credit" ? "text-rose-400" : "text-emerald-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{tx.customer?.name || "Unknown"}</p>
                  <p className="text-xs text-white/40 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(tx.transactionDate), "d MMM, h:mm a")}
                    {tx.isBackdated && <span className="badge-warning py-0 px-1.5 ml-1">backdated</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-num font-semibold text-sm ${tx.type === "credit" ? "text-rose-400" : "text-emerald-400"}`}>
                    {tx.type === "credit" ? "+" : "-"}₹{tx.totalAmount.toLocaleString()}
                  </p>
                  <span className={`text-xs ${tx.type === "credit" ? "badge-danger" : "badge-success"}`}>
                    {tx.type}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
