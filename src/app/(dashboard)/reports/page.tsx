"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { reportService } from "@/services/report.service";
import { roomService } from "@/services/room.service";
import { businessService } from "@/services/business.service";
import { Invoice, Business } from "@/types";
import { AnimatePresence } from "framer-motion";
import {
  DollarSign, Receipt, Clock, Printer, X, Eye,
  Loader2, ArrowRight, CheckCircle2, ChevronDown
} from "lucide-react";
import { CustomDropdown } from "@/components/ui/dropdown";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";

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

export default function ReportsPage() {
  const selectedBusinessId = useAppStore((state) => state.selectedBusinessId) || "";
  const toast = useToast();
  const confirm = useConfirm();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const loadPaymentsData = async () => {
    setLoading(true);
    try {
      const [list, biz, roomsList] = await Promise.all([
        reportService.getRecentInvoices(selectedBusinessId, 100),
        businessService.getBusiness(selectedBusinessId),
        roomService.getRooms(selectedBusinessId),
      ]);
      setInvoices(list);
      setBusiness(biz);
      const activeOccupied = roomsList.filter((r) => r.status === "occupied" || r.status === "near-checkout");
      let pending = 0;
      activeOccupied.forEach((room) => {
        if (room.checkInTime) {
          const diffTime = Math.abs(new Date().getTime() - new Date(room.checkInTime).getTime());
          const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          pending += days * room.pricePerNight;
        }
      });
      setPendingAmount(pending);
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (selectedBusinessId) loadPaymentsData(); }, [selectedBusinessId]);

  const filteredInvoices = invoices.filter((inv) => isDateInRange(inv.invoiceDate, dateFilter, customStart, customEnd));
  const collectedAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);

  // GST settings from business
  const gstEnabled = business?.settings?.gstEnabled ?? false;
  const gstRate = business?.settings?.gstRate ?? 0;

  const getGstAmount = (subtotal: number) => gstEnabled ? Math.round(subtotal * (gstRate / 100) * 100) / 100 : 0;
  const getTotalWithGst = (inv: Invoice) => {
    const gst = getGstAmount(inv.subtotal);
    return inv.subtotal + gst;
  };

  const handlePrintBill = () => {
    if (typeof window === "undefined") return;
    const printContent = document.getElementById("printable-invoice-sheet");
    if (!printContent) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    // Collect all stylesheet elements from parent window
    let stylesHtml = "";
    document.querySelectorAll("link[rel='stylesheet'], style").forEach((styleEl) => {
      stylesHtml += styleEl.outerHTML;
    });

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Print Invoice</title>
          ${stylesHtml}
          <style>
            body {
              background: white !important;
              color: black !important;
              padding: 20px !important;
              margin: 0 !important;
            }
            #printable-invoice-sheet {
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 auto !important;
              max-width: 100% !important;
            }
            @page {
              size: A4;
              margin: 15mm;
            }
          </style>
        </head>
        <body>
          <div style="width: 100%; max-width: 800px; margin: 0 auto;">
            ${printContent.outerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.parent.document.body.removeChild(window.frameElement);
                }, 500);
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans relative">



      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">Payments & Billings</h1>
          <p className="text-slate-500 text-xs mt-1.5 font-semibold">Review collected revenue, pending balances, and generate guest invoices.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {dateFilter === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl outline-none" />
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl outline-none" />
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
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Pending Amount (Active Stays)</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">₹{pendingAmount.toLocaleString()}</h2>
            <span className="text-[9.5px] text-slate-400 font-bold block mt-1">Stays in progress inside occupied rooms</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Collected Amount</span>
            <h2 className="text-2xl font-black text-emerald-600 mt-1">₹{collectedAmount.toLocaleString()}</h2>
            <span className="text-[9.5px] text-slate-400 font-bold block mt-1 uppercase">
              {dateFilter === "all" ? "Total all-time payments" : `${dateFilter.replace("-", " ")} filter total`}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 leading-tight">Payment Ledger</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Register log of completed checkout guest invoices.</p>
        </div>
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-1.5 border border-dashed border-slate-200 rounded-2xl">
            <Receipt className="w-8 h-8 mx-auto text-slate-350" />
            <p className="text-[10px] font-bold">No payments found for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[750px] text-left text-xs font-semibold">
              <thead>
                <tr className="text-slate-450 border-b border-slate-100 uppercase tracking-wide text-[9px]">
                  <th className="pb-3 font-bold">Invoice ID</th>
                  <th className="pb-3 font-bold">Guest Name</th>
                  <th className="pb-3 font-bold">Checkout Date</th>
                  <th className="pb-3 font-bold text-center">Room</th>
                  <th className="pb-3 font-bold text-center">Mode</th>
                  <th className="pb-3 font-bold text-right">Amount</th>
                  <th className="pb-3 font-bold text-center">Bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70 text-slate-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-mono text-[10px] text-slate-450">{inv.id.substring(0, 12)}...</td>
                    <td className="py-4 font-extrabold text-slate-900">{inv.guestName}</td>
                    <td className="py-4 font-medium text-slate-550">{inv.invoiceDate}</td>
                    <td className="py-4 text-center font-extrabold text-slate-800">{inv.roomNumber || "—"}</td>
                    <td className="py-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-650 font-bold border border-slate-200/80 text-[10px]">
                        {inv.paymentMethod || "UPI"}
                      </span>
                    </td>
                    <td className="py-4 text-right font-extrabold text-slate-900 text-sm">
                      ₹{(gstEnabled ? getTotalWithGst(inv) : inv.total).toLocaleString()}
                    </td>
                    <td className="py-4 text-center">
                      <button onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 text-[10px] font-bold text-slate-700 rounded-xl transition-all">
                        <Eye className="w-3.5 h-3.5" /> View Bill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* A4 Bill Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm px-4 overflow-y-auto pt-10 pb-10">
            <div className="absolute inset-0" onClick={() => setSelectedInvoice(null)} />
            <div className="w-full max-w-[800px] bg-slate-50 p-4 border border-slate-200 rounded-3xl shadow-2xl relative z-10 space-y-4 max-h-[92vh] flex flex-col">

              {/* Controls */}
              <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-200 text-slate-700 shrink-0 shadow-sm">
                <span className="text-xs font-bold flex items-center gap-1.5 text-slate-800">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" /> Guest Invoice Preview
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrintBill}
                    className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-[0.99] cursor-pointer">
                    <Printer className="w-3.5 h-3.5" /> Print Bill (A4)
                  </button>
                  <button onClick={() => setSelectedInvoice(null)}
                    className="p-1.5 hover:bg-slate-100 text-slate-450 hover:text-slate-800 rounded-xl transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* A4 Sheet Container */}
              <div className="overflow-y-auto flex-1 p-2 bg-white/40 border border-slate-200/50 rounded-2xl">
                <div id="printable-invoice-sheet"
                  className="w-full bg-white text-slate-800 p-8 sm:p-12 border border-slate-200/80 font-sans space-y-8 rounded-2xl mx-auto max-w-[700px] shadow-sm">

                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                    <div className="space-y-1">
                      <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide leading-none">
                        {business?.name || "Hotel"}
                      </h2>
                      <span className="text-xs font-bold text-slate-450 uppercase tracking-widest block pt-1">
                        Tax Invoice
                      </span>
                      {business?.location && (
                        <p className="text-[10px] text-slate-400 leading-relaxed max-w-[240px] pt-1.5 font-medium">
                          {business.location}
                        </p>
                      )}
                      {business?.mobileNumber && (
                        <p className="text-[10px] text-slate-400 font-medium">Ph: {business.mobileNumber}</p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <span className="text-2xl font-black text-blue-600 uppercase tracking-widest leading-none block">INVOICE</span>
                      <div className="text-[10px] text-slate-500 font-medium pt-2">
                        <span className="font-bold text-slate-700 uppercase block">Invoice ID:</span>
                        <span className="font-mono">{selectedInvoice.id}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        <span className="font-bold text-slate-700 uppercase block mt-1.5">Date:</span>
                        <span>{selectedInvoice.invoiceDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bill To */}
                  <div className="grid grid-cols-2 gap-6 text-xs leading-relaxed font-semibold">
                    <div>
                      <h4 className="text-[10px] text-slate-450 uppercase font-black tracking-wide border-b border-slate-100 pb-1.5">Customer Details</h4>
                      <div className="mt-2.5 space-y-1">
                        <p className="text-sm font-extrabold text-slate-900">{selectedInvoice.guestName}</p>
                        <p className="text-slate-500 font-medium">Status: CHECKED OUT</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] text-slate-450 uppercase font-black tracking-wide border-b border-slate-100 pb-1.5">Stay Details</h4>
                      <div className="mt-2.5 space-y-1 text-slate-650">
                        <p><span className="font-bold text-slate-800">Room:</span> {selectedInvoice.roomNumber || "N/A"}</p>
                        <p><span className="font-bold text-slate-800">Payment:</span> {selectedInvoice.paymentMethod || "UPI"}</p>
                        {gstEnabled && <p><span className="font-bold text-slate-800">GST:</span> {gstRate}% Applied</p>}
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="space-y-3">
                    <table className="w-full text-left text-xs font-semibold">
                      <thead>
                        <tr className="text-slate-450 border-b border-slate-200/80 text-[10px] uppercase font-bold tracking-wide">
                          <th className="pb-2">Description</th>
                          <th className="pb-2 text-right">Rate / Day</th>
                          <th className="pb-2 text-center">Days</th>
                          <th className="pb-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {selectedInvoice.items.map((item, index) => (
                          <tr key={index}>
                            <td className="py-3 text-slate-900 font-extrabold">{item.description}</td>
                            <td className="py-3 text-right">₹{item.amount.toLocaleString()}</td>
                            <td className="py-3 text-center">{item.quantity}</td>
                            <td className="py-3 text-right font-extrabold text-slate-900">₹{(item.amount * item.quantity).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="border-t border-slate-200 pt-5 flex justify-end">
                    <div className="w-full max-w-[280px] space-y-2 text-xs font-semibold text-slate-650">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="text-slate-900 font-bold">₹{selectedInvoice.subtotal.toLocaleString()}</span>
                      </div>
                      {gstEnabled ? (
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span>GST ({gstRate}%):</span>
                          <span className="text-slate-900 font-bold">₹{getGstAmount(selectedInvoice.subtotal).toLocaleString()}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                          <span>Tax:</span>
                          <span className="text-slate-900 font-bold">₹0</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-slate-900 font-black pt-1">
                        <span>Total Due:</span>
                        <span className="text-blue-600 text-base">
                          ₹{(gstEnabled ? getTotalWithGst(selectedInvoice) : selectedInvoice.total).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-slate-200 pt-8 text-center space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wide">
                      Thank you for your stay at {business?.name || "our hotel"}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium">
                      This is a computer-generated invoice. Powered by GamaNext Software Solutions.
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
