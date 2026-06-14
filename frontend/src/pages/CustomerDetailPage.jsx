import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import {
  ArrowLeft, Phone, MapPin, IndianRupee, Plus, Trash2,
  Calendar, X, Clock, FileText, ShieldAlert
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../services/api";

const Modal = ({ open, onClose, children, wide }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          className={`relative glass-card p-6 w-full ${wide ? "max-w-2xl" : "max-w-md"} shadow-glass z-10 max-h-[90vh] overflow-y-auto`}>
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const formatDateTimeLocal = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [showTxModal, setShowTxModal] = useState(false);
  const [voidTarget, setVoidTarget] = useState(null);
  const [reauthPassword, setReauthPassword] = useState("");
  const [voidReason, setVoidReason] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["customer-due", id],
    queryFn: () => api.get(`/customers/${id}/due-summary`).then((r) => r.data.data),
  });

  const { register, control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      lineItems: [{ productName: "", unitPrice: "", quantity: 1 }],
      transactionDate: formatDateTimeLocal(new Date()),
      type: "credit",
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });
  const lineItems = watch("lineItems");
  const txType = watch("type");

  const total = (lineItems || []).reduce((sum, item) => {
    const price = parseFloat(item.unitPrice) || 0;
    const qty = parseFloat(item.quantity) || 0;
    return sum + price * qty;
  }, 0);

  const createTxMutation = useMutation({
    mutationFn: (payload) => api.post("/transactions", payload),
    onSuccess: () => {
      qc.invalidateQueries(["customer-due", id]);
      qc.invalidateQueries(["dashboard"]);
      setShowTxModal(false);
      reset({ lineItems: [{ productName: "", unitPrice: "", quantity: 1 }], transactionDate: formatDateTimeLocal(new Date()), type: "credit", notes: "" });
      toast.success("Transaction recorded!");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to record transaction"),
  });

  const reauthMutation = useMutation({
    mutationFn: (password) => api.post("/auth/reauth", { password }),
  });

  const voidMutation = useMutation({
    mutationFn: ({ txId, reauthToken, reason }) =>
      api.patch(`/transactions/${txId}/void`, { reason }, { headers: { reauthtoken: reauthToken } }),
    onSuccess: () => {
      qc.invalidateQueries(["customer-due", id]);
      qc.invalidateQueries(["dashboard"]);
      setVoidTarget(null);
      setReauthPassword("");
      setVoidReason("");
      toast.success("Transaction voided.");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to void transaction"),
  });

  const onSubmit = (data) => {
    const payload = {
      customerId: id,
      lineItems: data.lineItems.map((it) => ({
        productName: it.productName,
        unitPrice: parseFloat(it.unitPrice),
        quantity: parseFloat(it.quantity),
      })),
      transactionDate: new Date(data.transactionDate).toISOString(),
      type: data.type,
      notes: data.notes,
    };
    createTxMutation.mutate(payload);
  };

  const handleVoidConfirm = async () => {
    try {
      const reauthRes = await reauthMutation.mutateAsync(reauthPassword);
      voidMutation.mutate({ txId: voidTarget._id, reauthToken: reauthRes.data.reauthToken, reason: voidReason });
    } catch (err) {
      toast.error(err.response?.data?.message || "Incorrect password");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  const customer = data?.customer;
  const transactions = data?.transactions || [];

  return (
    <div className="space-y-6">
      <Link to="/customers" className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </Link>

      {/* Header Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-600/60 flex items-center justify-center text-xl font-bold shrink-0">
              {customer?.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white">{customer?.name}</h1>
              <p className="text-xs text-white/40 font-mono">{customer?.customerId}</p>
              <div className="flex items-center gap-4 mt-1.5">
                {customer?.phone && <span className="text-xs text-white/40 flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone}</span>}
                {customer?.address && <span className="text-xs text-white/40 flex items-center gap-1"><MapPin className="w-3 h-3" />{customer.address}</span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="section-label">Total Outstanding</p>
            <p className="font-display text-3xl font-bold text-rose-400 font-num flex items-center gap-1 justify-end">
              <IndianRupee className="w-6 h-6" />{customer?.totalDue.toLocaleString()}
            </p>
          </div>
        </div>
        <button onClick={() => setShowTxModal(true)} className="btn-primary flex items-center gap-2 mt-5">
          <Plus className="w-4 h-4" /> New Transaction
        </button>
      </motion.div>

      {/* Transaction History */}
      <div className="glass-card">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-semibold text-white">Transaction History</h3>
          <p className="text-xs text-white/40 mt-0.5">{transactions.length} total entries</p>
        </div>
        <div className="divide-y divide-white/5">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-white/20 text-sm">No transactions recorded yet.</div>
          ) : (
            transactions.map((tx, i) => (
              <motion.div key={tx._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={tx.type === "credit" ? "badge-danger" : "badge-success"}>{tx.type}</span>
                      <span className={tx.status === "settled" ? "badge-success" : "badge-warning"}>{tx.status}</span>
                      {tx.isBackdated && <span className="badge-warning"><Clock className="w-3 h-3" />backdated</span>}
                    </div>
                    <p className="text-xs text-white/40 mt-1.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(tx.transactionDate), "EEEE, d MMMM yyyy 'at' h:mm a")}
                    </p>
                    {tx.notes && <p className="text-xs text-white/30 mt-1 flex items-center gap-1"><FileText className="w-3 h-3" />{tx.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-num text-lg font-bold ${tx.type === "credit" ? "text-rose-400" : "text-emerald-400"}`}>
                      {tx.type === "credit" ? "+" : "-"}₹{tx.totalAmount.toLocaleString()}
                    </p>
                    <button onClick={() => setVoidTarget(tx)} className="text-xs text-white/30 hover:text-rose-400 transition-colors mt-1 flex items-center gap-1 ml-auto">
                      <ShieldAlert className="w-3 h-3" />Void
                    </button>
                  </div>
                </div>
                {/* Line Items */}
                <div className="bg-white/3 rounded-xl p-3 space-y-1.5">
                  {tx.lineItems.map((item) => (
                    <div key={item._id} className="flex items-center justify-between text-sm">
                      <span className="text-white/60">{item.productName} <span className="text-white/30">× {item.quantity}</span></span>
                      <span className="font-num text-white/70">₹{item.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* New Transaction Modal */}
      <Modal open={showTxModal} onClose={() => setShowTxModal(false)} wide>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg">New Transaction</h2>
          <button onClick={() => setShowTxModal(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Transaction Type</label>
              <select className="input-field" {...register("type")}>
                <option value="credit">Credit (Customer owes)</option>
                <option value="payment">Payment (Customer pays)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5 flex items-center gap-1.5">
                Date & Time <span className="text-white/30 text-xs">(editable / backdate)</span>
              </label>
              <input type="datetime-local" className="input-field" {...register("transactionDate")} />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-white/60">Line Items</label>
              <button type="button" onClick={() => append({ productName: "", unitPrice: "", quantity: 1 })} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-5">
                    <input placeholder="Product name" className="input-field text-sm" {...register(`lineItems.${index}.productName`, { required: true })} />
                  </div>
                  <div className="col-span-3">
                    <input type="number" step="0.01" placeholder="Unit price" className="input-field text-sm" {...register(`lineItems.${index}.unitPrice`, { required: true, min: 0 })} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" step="1" placeholder="Qty" className="input-field text-sm" {...register(`lineItems.${index}.quantity`, { required: true, min: 1 })} />
                  </div>
                  <div className="col-span-2 flex items-center justify-end h-full pt-3">
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(index)} className="text-white/30 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="glass-card p-4 flex items-center justify-between bg-primary-500/5 border-primary-500/20">
            <span className="text-sm text-white/60">Total {txType === "credit" ? "Amount Due" : "Payment"}</span>
            <span className="font-num text-2xl font-bold text-white">₹{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1.5">Notes (optional)</label>
            <textarea rows={2} placeholder="Any additional details..." className="input-field resize-none" {...register("notes")} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowTxModal(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={createTxMutation.isPending} className="btn-primary flex-1">
              {createTxMutation.isPending ? "Saving..." : "Save Transaction"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Void Transaction Modal (Re-auth) */}
      <Modal open={!!voidTarget} onClose={() => { setVoidTarget(null); setReauthPassword(""); setVoidReason(""); }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg flex items-center gap-2 text-rose-400">
            <ShieldAlert className="w-5 h-5" /> Void Transaction
          </h2>
          <button onClick={() => setVoidTarget(null)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="glass-card p-3 mb-4 border-amber-500/20 bg-amber-500/5">
          <p className="text-amber-400 text-xs">⚠️ This is a tamper-proof system. Voiding requires re-authentication and is permanently logged in the audit trail.</p>
        </div>
        {voidTarget && (
          <div className="bg-white/3 rounded-xl p-3 mb-4 text-sm">
            <p className="text-white/60">{voidTarget.lineItems.length} item(s) · <span className="font-num font-semibold text-white">₹{voidTarget.totalAmount.toLocaleString()}</span></p>
            <p className="text-white/30 text-xs mt-1">{format(new Date(voidTarget.transactionDate), "d MMM yyyy, h:mm a")}</p>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Confirm Your Password</label>
            <input type="password" className="input-field" placeholder="Enter your password" value={reauthPassword} onChange={(e) => setReauthPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Reason for Voiding</label>
            <input className="input-field" placeholder="e.g. Entered by mistake" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setVoidTarget(null)} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handleVoidConfirm} disabled={!reauthPassword || voidMutation.isPending} className="btn-danger flex-1">
              {voidMutation.isPending ? "Voiding..." : "Confirm Void"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
