"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { investmentService } from "@/services/investment.service";
import { Investment } from "@/types";
import {
  Briefcase, Plus, Search, Calendar, DollarSign, Loader2, X,
  Trash2, Filter, AlertCircle, ChevronDown, CheckCircle2, ArrowRight
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CustomDropdown } from "@/components/ui/dropdown";
import { useToast } from "@/context/ToastContext";

type DateFilterType = "today" | "yesterday" | "this-week" | "last-week" | "this-month" | "last-month" | "custom" | "all";

function isDateInRange(dateStr: string, filter: DateFilterType, customStart?: string, customEnd?: string): boolean {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (filter === "all") return true;
  if (filter === "today") return date.getTime() === today.getTime();
  if (filter === "yesterday") return date.getTime() === yesterday.getTime();
  if (filter === "this-week") {
    const sunday = new Date(today); sunday.setDate(today.getDate() - today.getDay());
    return date >= sunday && date <= today;
  }
  if (filter === "last-week") {
    const lastSunday = new Date(today); lastSunday.setDate(today.getDate() - today.getDay() - 7);
    const lastSaturday = new Date(lastSunday); lastSaturday.setDate(lastSunday.getDate() + 6);
    return date >= lastSunday && date <= lastSaturday;
  }
  if (filter === "this-month") return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  if (filter === "last-month") {
    const lm = new Date(today); lm.setMonth(today.getMonth() - 1);
    return date.getMonth() === lm.getMonth() && date.getFullYear() === lm.getFullYear();
  }
  if (filter === "custom") {
    if (!customStart || !customEnd) return true;
    const start = new Date(customStart); start.setHours(0, 0, 0, 0);
    const end = new Date(customEnd); end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  }
  return true;
}

export default function InvestmentsPage() {
  const selectedBusinessId = useAppStore((state) => state.selectedBusinessId) || "";
  const toast = useToast();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  // By default, today's date in local YYYY-MM-DD
  const [date, setDate] = useState(() => {
    const local = new Date();
    const offset = local.getTimezoneOffset();
    const localDate = new Date(local.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  });
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const loadInvestments = async () => {
    if (!selectedBusinessId) return;
    setLoading(true);
    try {
      const list = await investmentService.getInvestments(selectedBusinessId);
      setInvestments(list);
    } catch (err) {
      console.error("Failed to load investments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvestments();
  }, [selectedBusinessId]);

  const handleSaveInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || !date) {
      toast.warning("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await investmentService.addInvestment(selectedBusinessId, {
        name: name.trim(),
        amount: parseFloat(amount),
        date,
      });
      // Reset form
      setName("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setShowAddModal(false);
      loadInvestments();
      toast.success("Investment recorded successfully!");
    } catch (err) {
      console.error("Failed to save investment:", err);
      toast.error("Failed to save investment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filters calculation
  const filteredInvestments = investments.filter((inv) => {
    const matchesSearch = inv.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = isDateInRange(inv.date, dateFilter, customStart, customEnd);
    return matchesSearch && matchesDate;
  });

  const totalInvestmentAmount = filteredInvestments.reduce((sum, inv) => sum + inv.amount, 0);

  const formatDateDisplay = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans relative">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">Hotel Investments</h1>
          <p className="text-slate-500 text-xs mt-1.5 font-semibold">Track capital expenditure, renovations, and asset purchases.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-blue-500/10 active:scale-[0.99] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Investment
        </button>
      </div>

      {/* Stats Summary & Filters row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Total Investment Card */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-4 lg:col-span-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Filtered Total Investment</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">₹{totalInvestmentAmount.toLocaleString()}</h2>
            <span className="text-[9.5px] text-slate-400 font-bold block mt-1 uppercase">
              {dateFilter === "all" ? "Total all-time investments" : `${dateFilter.replace("-", " ")} total`}
            </span>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm lg:col-span-2 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search investments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 focus:border-blue-500 focus:bg-white text-slate-900 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold outline-none transition-all placeholder-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {dateFilter === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl outline-none"
                />
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl outline-none"
                />
              </div>
            )}

            <CustomDropdown
              value={dateFilter}
              onChange={(val) => setDateFilter(val as DateFilterType)}
              options={[
                { value: "all", label: "All Dates" },
                { value: "today", label: "Today" },
                { value: "yesterday", label: "Yesterday" },
                { value: "this-week", label: "This Week" },
                { value: "last-week", label: "Last Week" },
                { value: "this-month", label: "This Month" },
                { value: "last-month", label: "Last Month" },
                { value: "custom", label: "Custom Date Range" }
              ]}
              className="w-[170px]"
              triggerClassName="bg-slate-50 border-slate-200"
            />
          </div>
        </div>

      </div>

      {/* Investments Table / List */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 leading-tight">Ledger of Investments</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Detailed list of recorded capital entries.</p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : filteredInvestments.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-1.5 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Briefcase className="w-8 h-8 mx-auto text-slate-305 text-slate-350" />
            <p className="text-[10px] font-bold">No investment records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[550px] text-left text-xs font-semibold">
              <thead>
                <tr className="text-slate-450 border-b border-slate-100 uppercase tracking-wide text-[9px]">
                  <th className="pb-3 font-bold">Investment Name / Description</th>
                  <th className="pb-3 font-bold text-center">Date</th>
                  <th className="pb-3 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70 text-slate-700">
                {filteredInvestments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-extrabold text-slate-900">{inv.name}</td>
                    <td className="py-4 text-center font-medium text-slate-550">{formatDateDisplay(inv.date)}</td>
                    <td className="py-4 text-right font-extrabold text-blue-600 text-sm">
                      ₹{inv.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Investment Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-slate-150 rounded-3xl shadow-2xl relative z-10 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900">Add Investment Entry</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-slate-150 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveInvestment} className="p-6 space-y-4">
                
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                    Investment Name / Description *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lobby air conditioner, painting room 102"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-4 py-2.5 rounded-xl text-xs font-semibold outline-none transition-all placeholder-slate-400"
                  />
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                    Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450 font-bold text-xs pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 pl-8 pr-4 py-2.5 rounded-xl text-xs font-extrabold outline-none transition-all placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">
                    Investment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold outline-none transition-all"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-1/2 h-10 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-1/2 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/10 active:scale-[0.99]"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Investment
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
