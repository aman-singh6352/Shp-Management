import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeftRight, IndianRupee, Calendar, Clock, Filter, Search
} from "lucide-react";
import api from "../services/api";

export default function TransactionsPage() {
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", type, page],
    queryFn: () => api.get(`/transactions?${type ? `type=${type}&` : ""}page=${page}&limit=15`).then((r) => r.data),
  });

  const transactions = data?.data || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3"><ArrowLeftRight className="w-6 h-6 text-primary-400" />Transactions</h1>
          <p className="text-white/40 text-sm mt-1">Full ledger of credits and payments</p>
        </div>
        <div className="flex items-center gap-2">
          {["", "credit", "payment"].map((t) => (
            <button key={t} onClick={() => { setType(t); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${type === t ? "bg-primary-600 text-white shadow-glow-sm" : "bg-white/5 text-white/50 hover:bg-white/10"}`}>
              {t === "" ? "All" : t === "credit" ? "Credits" : "Payments"}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card">
        {/* Table Header (Desktop) */}
        <div className="hidden md:grid grid-cols-12 px-5 py-3 border-b border-white/5">
          <span className="table-header col-span-3">Customer</span>
          <span className="table-header col-span-4">Items</span>
          <span className="table-header col-span-2">Date</span>
          <span className="table-header col-span-1">Type</span>
          <span className="table-header col-span-1">Status</span>
          <span className="table-header col-span-1 text-right">Amount</span>
        </div>

        <div className="divide-y divide-white/5">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <div key={i} className="p-5"><div className="skeleton h-12 rounded-xl" /></div>)
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-white/20 text-sm">No transactions found.</div>
          ) : (
            transactions.map((tx, i) => (
              <motion.div key={tx._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 px-5 py-4 hover:bg-white/3 transition-colors">
                <Link to={`/customers/${tx.customer?._id}`} className="md:col-span-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-600/60 flex items-center justify-center text-xs font-bold shrink-0">
                    {tx.customer?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{tx.customer?.name || "Unknown"}</p>
                    <p className="text-xs text-white/30 font-mono">{tx.customer?.customerId}</p>
                  </div>
                </Link>
                <div className="md:col-span-4 text-sm text-white/60 flex items-center">
                  {tx.lineItems.map((it) => it.productName).join(", ")}
                </div>
                <div className="md:col-span-2 text-xs text-white/40 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{format(new Date(tx.transactionDate), "d MMM yyyy")}
                  {tx.isBackdated && <Clock className="w-3 h-3 text-amber-400 ml-1" />}
                </div>
                <div className="md:col-span-1 flex items-center">
                  <span className={tx.type === "credit" ? "badge-danger" : "badge-success"}>{tx.type}</span>
                </div>
                <div className="md:col-span-1 flex items-center">
                  <span className={tx.status === "settled" ? "badge-success" : "badge-warning"}>{tx.status}</span>
                </div>
                <div className="md:col-span-1 flex items-center justify-end">
                  <span className={`font-num font-semibold text-sm ${tx.type === "credit" ? "text-rose-400" : "text-emerald-400"}`}>
                    {tx.type === "credit" ? "+" : "-"}₹{tx.totalAmount.toLocaleString()}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/5">
            <p className="text-xs text-white/40">Page {pagination.page} of {pagination.pages} · {pagination.total} total</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-30">Previous</button>
              <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
