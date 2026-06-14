import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Plus, Search, Phone, IndianRupee, ArrowUpRight, X, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

const customerSchema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

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

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => api.get(`/customers?search=${search}&limit=50`).then((r) => r.data.data),
    debounce: 300,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(customerSchema) });

  const createMutation = useMutation({
    mutationFn: (d) => api.post("/customers", d),
    onSuccess: () => {
      qc.invalidateQueries(["customers"]);
      setShowModal(false);
      reset();
      toast.success("Customer added!");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to add customer"),
  });

  const customers = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3"><Users className="w-6 h-6 text-primary-400" />Customers</h1>
          <p className="text-white/40 text-sm mt-1">{customers.length} active customers</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input type="text" placeholder="Search customers by name..." className="input-field pl-11 py-3"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Customer List */}
      <div className="glass-card divide-y divide-white/5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-5 flex items-center gap-4">
              <div className="skeleton w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2"><div className="skeleton h-4 w-40 rounded" /><div className="skeleton h-3 w-24 rounded" /></div>
            </div>
          ))
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">{search ? "No customers found" : "No customers yet. Add your first!"}</p>
          </div>
        ) : (
          customers.map((c, i) => (
            <motion.div key={c._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <Link to={`/customers/${c._id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-primary-600/60 flex items-center justify-center text-sm font-bold shrink-0">
                  {c.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{c.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-white/40 font-mono">{c.customerId}</span>
                    {c.phone && <span className="text-xs text-white/30 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-rose-400 font-num font-semibold">
                    <IndianRupee className="w-3.5 h-3.5" />{c.totalDue.toLocaleString()}
                  </div>
                  <p className="text-xs text-white/30">outstanding</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
              </Link>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Customer Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg">New Customer</h2>
          <button onClick={() => setShowModal(false)} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          {[
            { name: "name", label: "Full Name *", placeholder: "Customer name" },
            { name: "phone", label: "Phone Number", placeholder: "+91 98765 43210" },
            { name: "address", label: "Address", placeholder: "Shop/house address" },
            { name: "notes", label: "Notes", placeholder: "Any notes about this customer" },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-sm text-white/60 mb-1.5">{label}</label>
              <input placeholder={placeholder} className={`input-field ${errors[name] ? "border-rose-500/60" : ""}`} {...register(name)} />
              {errors[name] && <p className="text-rose-400 text-xs mt-1">{errors[name].message}</p>}
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
              {createMutation.isPending ? "Adding..." : "Add Customer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
