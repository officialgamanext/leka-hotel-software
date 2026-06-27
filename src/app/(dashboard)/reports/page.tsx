"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { reportService } from "@/services/report.service";
import { bookingService } from "@/services/booking.service";
import { Invoice, Booking } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { 
  FileSpreadsheet, Receipt, Plus, Loader2, DollarSign, 
  Percent, FileText, CheckCircle2, AlertCircle, X, ChevronDown
} from "lucide-react";

export default function ReportsPage() {
  const selectedBusinessId = useAppStore((state) => state.selectedBusinessId) || "";

  // Component States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Invoice creator form
  const [showAddModal, setShowAddModal] = useState(false);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemAmount, setItemAmount] = useState(0);
  const [itemQty, setItemQty] = useState(1);
  const [invoiceItems, setInvoiceItems] = useState<{ description: string; amount: number; quantity: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Invoices and bookings (for mapping new invoices)
  useEffect(() => {
    if (!selectedBusinessId) return;
    loadInvoices();
  }, [selectedBusinessId]);

  useEffect(() => {
    if (!selectedBusinessId || !showAddModal) return;
    async function loadBookings() {
      // Load active checked-in or checked-out bookings that need billing
      const result = await bookingService.getBookingsPaginated(selectedBusinessId, 50);
      setBookingsList(result.bookings);
    }
    loadBookings();
  }, [selectedBusinessId, showAddModal]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const list = await reportService.getRecentInvoices(selectedBusinessId, 20);
      setInvoices(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!itemName || itemAmount <= 0) return;
    setInvoiceItems((prev) => [
      ...prev,
      { description: itemName, amount: Number(itemAmount), quantity: Number(itemQty) }
    ]);
    setItemName("");
    setItemAmount(0);
    setItemQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId || invoiceItems.length === 0) return;

    setSubmitting(true);
    try {
      const booking = bookingsList.find((b) => b.id === selectedBookingId);
      if (!booking) throw new Error("Selected booking is invalid.");

      await reportService.createInvoice(selectedBusinessId, {
        bookingId: booking.id,
        guestId: booking.guestId,
        guestName: booking.guestName,
        invoiceDate: new Date().toISOString().split("T")[0],
        items: invoiceItems,
        status: "paid",
      });

      // Clear
      setSelectedBookingId("");
      setInvoiceItems([]);
      setShowAddModal(false);
      
      // Reload
      loadInvoices();
    } catch (err) {
      console.error(err);
      alert("Failed to generate invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  // Compute aggregate totals
  const totalSubtotal = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const totalTax = invoices.reduce((sum, inv) => sum + inv.taxAmount, 0);
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

  // Group invoices by date for charting
  const dailyDistribution = invoices.reduce((acc: any[], inv) => {
    const existing = acc.find((item) => item.date === inv.invoiceDate);
    if (existing) {
      existing.revenue += inv.total;
    } else {
      acc.push({ date: inv.invoiceDate, revenue: inv.total });
    }
    return acc;
  }, []).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Billing & Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Review revenue summaries, aggregate logs, and compile invoices</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-10 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/15 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4.5 h-4.5" /> Compile Invoice
        </button>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shadow-inner">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Aggregate Subtotal</span>
            <h2 className="text-xl font-bold text-white mt-1">${totalSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-inner">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Aggregate Taxes Collected</span>
            <h2 className="text-xl font-bold text-white mt-1">${totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-inner animate-pulse">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Invoiced Revenue</span>
            <h2 className="text-xl font-bold text-emerald-450 mt-1">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl shadow-lg">
        <h2 className="text-base font-bold text-white tracking-tight">Invoice Billings</h2>
        <p className="text-slate-400 text-xs mt-0.5">Distribution of invoiced totals aggregated by date</p>
        <div className="h-[220px] w-full mt-6">
          {dailyDistribution.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">No chart data compiled.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyDistribution} margin={{ left: -25, right: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px" }}
                  labelStyle={{ fontSize: "11px", fontWeight: "bold" }}
                  itemStyle={{ fontSize: "12px", color: "#f8fafc" }}
                />
                <Bar dataKey="revenue" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Invoice list */}
      <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl shadow-lg">
        <h2 className="text-base font-bold text-white tracking-tight mb-5">Invoice Register</h2>
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">No invoices generated yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-850 pb-2">
                  <th className="py-2.5 font-semibold">Invoice ID</th>
                  <th className="py-2.5 font-semibold">Guest</th>
                  <th className="py-2.5 font-semibold">Date</th>
                  <th className="py-2.5 font-semibold text-right">Subtotal</th>
                  <th className="py-2.5 font-semibold text-right">Tax (12%)</th>
                  <th className="py-2.5 font-semibold text-right">Total</th>
                  <th className="py-2.5 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="text-slate-350 hover:text-white transition-colors">
                    <td className="py-3.5 font-mono text-slate-400">{inv.id}</td>
                    <td className="py-3.5 font-semibold">{inv.guestName}</td>
                    <td className="py-3.5">{inv.invoiceDate}</td>
                    <td className="py-3.5 text-right">${inv.subtotal.toFixed(2)}</td>
                    <td className="py-3.5 text-right">${inv.taxAmount.toFixed(2)}</td>
                    <td className="py-3.5 text-right font-bold text-white">${inv.total.toFixed(2)}</td>
                    <td className="py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        inv.status === "paid" 
                          ? "bg-emerald-500/10 text-emerald-400" 
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Compile Invoice Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative z-10 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-white">Generate Guest Invoice</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Aggregate room charges and additional services</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-350 uppercase">Select Stay/Booking</label>
                  <select
                    required
                    value={selectedBookingId}
                    onChange={(e) => {
                      const bId = e.target.value;
                      setSelectedBookingId(bId);
                      const booking = bookingsList.find((b) => b.id === bId);
                      if (booking) {
                        // Prepopulate stay cost as first item
                        setInvoiceItems([
                          {
                            description: `${booking.roomType} Charge (Stay)`,
                            amount: booking.totalPrice,
                            quantity: 1,
                          }
                        ]);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white px-3.5 py-2 rounded-lg text-sm transition-all outline-none cursor-pointer"
                  >
                    <option value="">-- Choose active or departures --</option>
                    {bookingsList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.guestName} - Room {b.roomNumber} ({b.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Additional Items Adder */}
                <div className="space-y-3.5 border-t border-slate-850 pt-4">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Charges / Room Service
                  </h3>
                  
                  <div className="grid grid-cols-5 gap-2">
                    <input
                      type="text"
                      placeholder="Item, e.g. Dinner"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      className="col-span-2 bg-slate-950 border border-slate-800 text-white px-2.5 py-1.5 rounded text-xs outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Amount ($)"
                      value={itemAmount || ""}
                      onChange={(e) => setItemAmount(Number(e.target.value))}
                      className="col-span-1 bg-slate-950 border border-slate-800 text-white px-2.5 py-1.5 rounded text-xs outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={itemQty}
                      onChange={(e) => setItemQty(Number(e.target.value))}
                      className="col-span-1 bg-slate-950 border border-slate-800 text-white px-2.5 py-1.5 rounded text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={!itemName || itemAmount <= 0}
                      className="col-span-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-bold rounded py-1 px-2 transition-colors disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-2 border-t border-slate-850 pt-4">
                  <span className="text-[10px] font-bold text-slate-350 uppercase">Invoice Items</span>
                  {invoiceItems.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No billable items added.</p>
                  ) : (
                    <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-1">
                      {invoiceItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg text-xs">
                          <div>
                            <span className="font-medium text-slate-200">{item.description}</span>
                            <span className="text-[10px] text-slate-500 block">
                              ${item.amount} × {item.quantity}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white">${(item.amount * item.quantity).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invoice total prediction */}
                {invoiceItems.length > 0 && (
                  <div className="bg-slate-950/80 p-3.5 border border-slate-850 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span>${invoiceItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Taxes (12%):</span>
                      <span>${(invoiceItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0) * 0.12).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-sm border-t border-slate-850 pt-2">
                      <span>Total:</span>
                      <span>${(invoiceItems.reduce((sum, item) => sum + (item.amount * item.quantity), 0) * 1.12).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-3 pt-4 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-1/2 h-10 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || invoiceItems.length === 0}
                    className="w-1/2 h-10 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save & Print Invoice"}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
