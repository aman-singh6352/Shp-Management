import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import {
  Package, Plus, AlertTriangle, XCircle, CheckCircle,
  X, RotateCw, Trash2, Edit2
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

const Modal = ({ open, onClose, children }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          className="relative glass-card p-6 w-full max-w-md shadow-glass z-10">
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const statusConfig = {
  in_stock: { label: "In Stock", icon: CheckCircle, className: "badge-success" },
  low_stock: { label: "Low Stock", icon: AlertTriangle, className: "badge-warning" },
  out_of_stock: { label: "Out of Stock", icon: XCircle, className: "badge-danger" },
};

const unitOptions = ["piece", "kg", "gram", "liter", "ml", "dozen", "box", "pack", "other"];

export default function InventoryPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", statusFilter],
    queryFn: () => api.get(`/inventory${statusFilter ? `?status=${statusFilter}` : ""}`).then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { unit: "piece", currentStock: 0, reorderLevel: 5 },
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post("/inventory", d),
    onSuccess: () => {
      qc.invalidateQueries(["inventory"]);
      setShowModal(false);
      reset({ unit: "piece", currentStock: 0, reorderLevel: 5 });
      toast.success("Item added to shopping list!");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to add item"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/inventory/${id}`),
    onSuccess: () => { qc.invalidateQueries(["inventory"]); toast.success("Item removed."); },
  });

  const restockMutation = useMutation({
    mutationFn: ({ id, quantity }) => api.patch(`/inventory/${id}/restock`, { quantity }),
    onSuccess: () => {
      qc.invalidateQueries(["inventory"]);
      setRestockItem(null);
      setRestockQty("");
      toast.success("Stock updated!");
    },
  });

  const items = data?.data || [];
  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3"><Package className="w-6 h-6 text-primary-400" />Inventory & Reorder List</h1>
          <p className="text-white/40 text-sm mt-1">Track shortages and plan your next shopping trip</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { key: "out_of_stock", label: "Out of Stock", icon: XCircle, color: "text-rose-400 bg-rose-500/15" },
          { key: "low_stock", label: "Low Stock", icon: AlertTriangle, color: "text-amber-400 bg-amber-500/15" },
          { key: "in_stock", label: "In Stock", icon: CheckCircle, color: "text-emerald-400 bg-emerald-500/15" },
        ].map(({ key, label, icon: Icon, color }) => (
          <button key={key} onClick={() => setStatusFilter(statusFilter === key ? "" : key)}
            className={`stat-card text-left transition-all ${statusFilter === key ? "ring-2 ring-primary-500" : ""}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
            <div>
              <p className="section-label">{label}</p>
              <p className="font-display text-2xl font-bold text-white mt-1">{summary[key] || 0}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="glass-card divide-y divide-white/5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-5"><div className="skeleton h-12 rounded-xl" /></div>)
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No items in your reorder list.</p>
          </div>
        ) : (
          items.map((item, i) => {
            const cfg = statusConfig[item.status];
            return (
              <motion.div key={item._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{item.productName}</p>
                    <span className={cfg.className}><cfg.icon className="w-3 h-3" />{cfg.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                    {item.category && <span>{item.category}</span>}
                    <span>Stock: {item.currentStock} {item.unit}</span>
                    <span>Reorder at: {item.reorderLevel} {item.unit}</span>
                    {item.estimatedWholesaleCost != null && <span className="text-cyan-400">Est. Cost: ₹{item.estimatedWholesaleCost}</span>}
                  </div>
                  {item.notes && <p className="text-xs text-white/30 mt-1">{item.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setRestockItem(item)} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Restock">
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(item._id)} className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors" title="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Item Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg">Add Inventory Item</h2>
          <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit((d) => createMutation.mutate({
          ...d,
          currentStock: parseFloat(d.currentStock),
          reorderLevel: parseFloat(d.reorderLevel),
          estimatedWholesaleCost: d.estimatedWholesaleCost ? parseFloat(d.estimatedWholesaleCost) : null,
        }))} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Product Name *</label>
            <input className={`input-field ${errors.productName ? "border-rose-500/60" : ""}`} placeholder="e.g. Sunflower Oil 1L" {...register("productName", { required: true })} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Category</label>
            <input className="input-field" placeholder="e.g. Groceries" {...register("category")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Current Stock</label>
              <input type="number" step="0.01" className="input-field" {...register("currentStock")} />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Reorder At</label>
              <input type="number" step="0.01" className="input-field" {...register("reorderLevel")} />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Unit</label>
              <select className="input-field" {...register("unit")}>
                {unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Estimated Wholesale Cost <span className="text-white/30">(optional)</span></label>
            <input type="number" step="0.01" className="input-field" placeholder="₹ amount" {...register("estimatedWholesaleCost")} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Notes</label>
            <textarea rows={2} className="input-field resize-none" placeholder="Supplier info, etc." {...register("notes")} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">{createMutation.isPending ? "Adding..." : "Add Item"}</button>
          </div>
        </form>
      </Modal>

      {/* Restock Modal */}
      <Modal open={!!restockItem} onClose={() => setRestockItem(null)}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg">Restock Item</h2>
          <button onClick={() => setRestockItem(null)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {restockItem && (
          <div className="space-y-4">
            <div className="bg-white/3 rounded-xl p-3">
              <p className="font-semibold text-white">{restockItem.productName}</p>
              <p className="text-xs text-white/40">Current stock: {restockItem.currentStock} {restockItem.unit}</p>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Quantity to Add</label>
              <input type="number" className="input-field" placeholder="e.g. 10" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setRestockItem(null)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={() => restockMutation.mutate({ id: restockItem._id, quantity: parseFloat(restockQty) })} disabled={!restockQty || restockMutation.isPending} className="btn-primary flex-1">
                {restockMutation.isPending ? "Updating..." : "Confirm Restock"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
