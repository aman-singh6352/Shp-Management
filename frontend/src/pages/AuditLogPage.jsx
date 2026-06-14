import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ClipboardList, ShieldAlert, IndianRupee, User } from "lucide-react";
import api from "../services/api";

export default function AuditLogPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["audit-log"],
    queryFn: () => api.get("/transactions/audit-log").then((r) => r.data.data),
  });

  const logs = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-primary-400" />Audit Log
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Permanent record of voided transactions — nothing is ever truly deleted.
        </p>
      </div>

      <div className="glass-card p-3 border-amber-500/20 bg-amber-500/5">
        <p className="text-amber-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          Voided transactions remain in the database permanently for tamper-proof auditing. They are excluded from balances but visible here.
        </p>
      </div>

      <div className="glass-card divide-y divide-white/5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-5"><div className="skeleton h-12 rounded-xl" /></div>)
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No voided transactions. Your ledger is clean!</p>
          </div>
        ) : (
          logs.map((tx, i) => (
            <motion.div key={tx._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="badge-danger"><ShieldAlert className="w-3 h-3" />Voided</span>
                    <span className={tx.type === "credit" ? "badge-danger" : "badge-success"}>{tx.type}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{tx.customer?.name || "Unknown"} <span className="text-white/30 font-mono text-xs">({tx.customer?.customerId})</span></p>
                  <p className="text-xs text-white/40 mt-1">
                    Original: {format(new Date(tx.transactionDate), "d MMM yyyy, h:mm a")}
                  </p>
                  <p className="text-xs text-white/40">
                    Voided: {format(new Date(tx.deletedAt), "d MMM yyyy, h:mm a")} by {tx.deletedBy?.name}
                  </p>
                  <p className="text-xs text-rose-300/70 mt-1.5 flex items-center gap-1">
                    <User className="w-3 h-3" />Reason: {tx.deleteReason}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-num text-lg font-bold text-white/40 line-through flex items-center gap-1 justify-end">
                    <IndianRupee className="w-4 h-4" />{tx.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="bg-white/3 rounded-xl p-3 mt-3 space-y-1.5">
                {tx.lineItems.map((item) => (
                  <div key={item._id} className="flex items-center justify-between text-sm text-white/40">
                    <span>{item.productName} × {item.quantity}</span>
                    <span className="font-num">₹{item.subtotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
