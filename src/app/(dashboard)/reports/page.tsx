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
import { CustomDatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";

type DateFilterType = "today" | "yesterday" | "this-week" | "last-week" | "this-month" | "last-month" | "custom" | "all";

function numberToWords(num: number): string {
  const a = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
  ];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (num === 0) return 'zero';

  // Convert to paise representation to handle decimal rounding safely
  const parts = Math.round(num * 100).toString().padStart(3, '0');
  const whole = parseInt(parts.slice(0, -2));
  const paise = parseInt(parts.slice(-2));
  
  let word = translate(whole) + ' Rupees';
  
  if (paise > 0) {
    word += ' and ' + translate(paise) + ' Paise';
  }
  
  return word;

  function translate(n: number): string {
    if (n === 0) return '';
    let str = '';
    
    if (n >= 10000000) {
      str += translate(Math.floor(n / 10000000)) + ' crore ';
      n %= 10000000;
    }
    
    if (n >= 100000) {
      str += translate(Math.floor(n / 100000)) + ' lakh ';
      n %= 100000;
    }
    
    if (n >= 1000) {
      str += translate(Math.floor(n / 1000)) + ' thousand ';
      n %= 1000;
    }
    
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' hundred ';
      n %= 100;
    }
    
    if (n > 0) {
      if (str !== '') str += 'and ';
      if (n < 20) {
        str += a[n];
      } else {
        str += b[Math.floor(n / 10)];
        if (n % 10 > 0) {
          str += '-' + a[n % 10];
        }
      }
    }
    
    return str.trim();
  }
}

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
              <CustomDatePicker value={customStart} onChange={setCustomStart} triggerClassName="bg-white border-slate-200 py-2" />
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <CustomDatePicker value={customEnd} onChange={setCustomEnd} triggerClassName="bg-white border-slate-200 py-2" />
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
        {selectedInvoice && (() => {
          const displayGstRate = selectedInvoice.gstRate || (selectedInvoice.subtotal > 0 ? Math.round((selectedInvoice.taxAmount / selectedInvoice.subtotal) * 100) : 0);
          return (
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
                    className="w-full bg-white text-slate-800 p-8 sm:p-12 border border-slate-350 font-sans space-y-6 rounded-2xl mx-auto max-w-[720px] shadow-sm relative overflow-hidden">
                    
                    {/* Header Title */}
                    <div className="text-center border-b-2 border-slate-900 pb-4">
                      <h1 className="text-2xl font-black tracking-widest text-slate-900 uppercase">TAX INVOICE</h1>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Computer Generated Original Receipt</p>
                    </div>

                    {/* From, To, & Invoice Metadata Grid */}
                    <div className="grid grid-cols-2 border border-slate-300 divide-x divide-slate-300 text-xs">
                      {/* Left Column: Bill From & Bill To */}
                      <div className="p-4 space-y-4">
                        <div>
                          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">BILL FROM (Hotel Details)</h3>
                          <div className="mt-1.5 space-y-1">
                            <p className="text-sm font-extrabold text-slate-900">{business?.name || "Hotel"}</p>
                            {business?.location && <p className="text-slate-500 font-semibold text-[10px] leading-normal">{business.location}</p>}
                            {business?.mobileNumber && <p className="text-slate-550 text-[10px]">Ph: {business.mobileNumber}</p>}
                            {business?.settings?.gstNumber && (
                              <p className="text-[10.5px] text-indigo-700 font-extrabold uppercase mt-1">
                                GSTIN: <span className="text-slate-900 font-mono font-extrabold">{business.settings.gstNumber}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-3">
                          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">BILL TO (Guest Details)</h3>
                          <div className="mt-1.5 space-y-1">
                            <p className="text-sm font-extrabold text-slate-900">{selectedInvoice.guestName}</p>
                            <p className="text-slate-500 font-semibold text-[10px]">Status: CHECKED OUT</p>
                            {selectedInvoice.gstNumber && (
                              <p className="text-[10.5px] text-indigo-700 font-extrabold uppercase mt-1">
                                GSTIN: <span className="text-slate-900 font-mono font-extrabold">{selectedInvoice.gstNumber}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Invoice Details & Stay Info */}
                      <div className="p-4 space-y-4">
                        <div>
                          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">INVOICE DETAILS</h3>
                          <table className="w-full text-[10.5px] mt-1.5 font-semibold text-slate-650 leading-relaxed">
                            <tbody>
                              <tr>
                                <td className="py-0.5 font-bold text-slate-800 uppercase">Invoice No:</td>
                                <td className="py-0.5 font-mono text-slate-900">{selectedInvoice.id.substring(0, 16).toUpperCase()}</td>
                              </tr>
                              <tr>
                                <td className="py-0.5 font-bold text-slate-800 uppercase">Billing Date:</td>
                                <td className="py-0.5 text-slate-900">{selectedInvoice.invoiceDate}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="border-t border-slate-200 pt-3">
                          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">STAY & TRANSACTION INFO</h3>
                          <table className="w-full text-[10.5px] mt-1.5 font-semibold text-slate-650 leading-relaxed">
                            <tbody>
                              <tr>
                                <td className="py-0.5 font-bold text-slate-800 uppercase">Room No:</td>
                                <td className="py-0.5 text-slate-900 font-bold">{selectedInvoice.roomNumber || "N/A"}</td>
                              </tr>
                              <tr>
                                <td className="py-0.5 font-bold text-slate-800 uppercase">Payment Mode:</td>
                                <td className="py-0.5 text-slate-900 font-bold">{selectedInvoice.paymentMethod || "UPI"}</td>
                              </tr>
                              <tr>
                                <td className="py-0.5 font-bold text-slate-800 uppercase">Billing Status:</td>
                                <td className="py-0.5 text-emerald-700 font-black uppercase tracking-wide">PAID</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Stay Data Table */}
                    <div className="space-y-1">
                      <table className="w-full border border-slate-300 border-collapse text-xs font-semibold">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 border-b border-slate-300 text-[9px] uppercase font-black tracking-wider">
                            <th className="px-3 py-2 border-r border-slate-300 text-center w-8">#</th>
                            <th className="px-3 py-2 border-r border-slate-300 text-left">Description</th>
                            <th className="px-3 py-2 border-r border-slate-300 text-right w-24">Rate / Day</th>
                            <th className="px-3 py-2 border-r border-slate-300 text-center w-20">Days</th>
                            <th className="px-3 py-2 text-right w-28">Taxable Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-250 text-slate-700">
                          {selectedInvoice.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2.5 border-r border-slate-200 text-center">{index + 1}</td>
                              <td className="px-3 py-2.5 border-r border-slate-200 text-slate-900 font-extrabold">{item.description}</td>
                              <td className="px-3 py-2.5 border-r border-slate-200 text-right">₹{item.amount.toLocaleString()}</td>
                              <td className="px-3 py-2.5 border-r border-slate-200 text-center">{item.quantity}</td>
                              <td className="px-3 py-2.5 text-right font-extrabold text-slate-900">₹{(item.amount * item.quantity).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* GST Tax Summary Table */}
                    {selectedInvoice.taxAmount > 0 && (
                      <div className="space-y-1">
                        <h4 className="text-[9px] font-black text-slate-450 uppercase tracking-wider">GST Tax Summary Breakdown</h4>
                        <table className="w-full border border-slate-300 border-collapse text-[10.5px] font-semibold text-slate-700">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-300 text-[9px] uppercase font-bold text-slate-500">
                              <th className="px-3 py-1.5 border-r border-slate-300 text-left">Tax Description</th>
                              <th className="px-3 py-1.5 border-r border-slate-300 text-right w-28">Taxable Value</th>
                              <th className="px-3 py-1.5 border-r border-slate-300 text-center w-20">Tax Rate (%)</th>
                              <th className="px-3 py-1.5 text-right w-28">Tax Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 leading-normal">
                            <tr>
                              <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-slate-650">CGST (Central GST)</td>
                              <td className="px-3 py-1.5 border-r border-slate-200 text-right">₹{selectedInvoice.subtotal.toLocaleString()}</td>
                              <td className="px-3 py-1.5 border-r border-slate-200 text-center">{(displayGstRate / 2).toFixed(1)}%</td>
                              <td className="px-3 py-1.5 text-right">₹{(selectedInvoice.taxAmount / 2).toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1.5 border-r border-slate-200 font-bold text-slate-650">SGST (State GST)</td>
                              <td className="px-3 py-1.5 border-r border-slate-200 text-right">₹{selectedInvoice.subtotal.toLocaleString()}</td>
                              <td className="px-3 py-1.5 border-r border-slate-200 text-center">{(displayGstRate / 2).toFixed(1)}%</td>
                              <td className="px-3 py-1.5 text-right">₹{(selectedInvoice.taxAmount / 2).toLocaleString()}</td>
                            </tr>
                            <tr className="bg-slate-50/50 font-extrabold text-slate-900 border-t border-slate-300">
                              <td className="px-3 py-1.5 border-r border-slate-200 uppercase font-black">Total GST Tax:</td>
                              <td className="px-3 py-1.5 border-r border-slate-200 text-right">—</td>
                              <td className="px-3 py-1.5 border-r border-slate-200 text-center">{displayGstRate}%</td>
                              <td className="px-3 py-1.5 text-right text-emerald-700">₹{selectedInvoice.taxAmount.toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Totals Summary */}
                    <div className="flex justify-between items-start pt-1.5">
                      {/* Amount in words */}
                      <div className="text-[10.5px] font-semibold text-slate-500 max-w-[340px] leading-relaxed">
                        <span className="font-bold text-slate-800 uppercase block text-[8.5px] tracking-wide mb-0.5">Amount in Words:</span>
                        <span className="capitalize text-slate-700 italic font-bold">{numberToWords(selectedInvoice.total)} Only</span>
                      </div>

                      {/* Bill Summary totals */}
                      <div className="w-[260px] border border-slate-300 divide-y divide-slate-200 text-xs font-semibold text-slate-650 rounded-xl overflow-hidden bg-slate-50/40 shrink-0">
                        <div className="flex justify-between px-3 py-2">
                          <span>Subtotal (Taxable):</span>
                          <span className="text-slate-900 font-bold">₹{selectedInvoice.subtotal.toLocaleString()}</span>
                        </div>
                        {selectedInvoice.taxAmount > 0 ? (
                          <>
                            <div className="flex justify-between px-3 py-1.5">
                              <span>CGST ({(displayGstRate / 2).toFixed(1)}%):</span>
                              <span className="text-slate-900 font-bold">₹{(selectedInvoice.taxAmount / 2).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between px-3 py-1.5">
                              <span>SGST ({(displayGstRate / 2).toFixed(1)}%):</span>
                              <span className="text-slate-900 font-bold">₹{(selectedInvoice.taxAmount / 2).toLocaleString()}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between px-3 py-2">
                            <span>GST Tax (0%):</span>
                            <span className="text-slate-900 font-bold">₹0</span>
                          </div>
                        )}
                        <div className="flex justify-between px-3 py-2.5 bg-slate-100/80 text-slate-900 font-black border-t border-slate-300 text-sm">
                          <span>Grand Total:</span>
                          <span className="text-blue-600 text-base font-black">₹{selectedInvoice.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Signatory & Terms Section */}
                    <div className="grid grid-cols-2 gap-6 pt-6 text-[10px] font-semibold text-slate-500">
                      {/* Left: Terms and Conditions */}
                      <div className="space-y-1.5 border border-slate-200 p-3.5 rounded-xl bg-slate-50/50">
                        <span className="font-bold text-slate-800 uppercase block tracking-wider text-[8.5px]">Terms & Conditions</span>
                        <ul className="list-decimal pl-4.5 space-y-0.5 leading-relaxed text-slate-500">
                          <li>All disputes are subject to local jurisdiction only.</li>
                          <li>Guests are requested to verify their billing details before leaving.</li>
                          <li>This is a computer-generated tax invoice, no signature is required.</li>
                        </ul>
                      </div>

                      {/* Right: Signatory Stamp Area */}
                      <div className="flex flex-col items-end justify-end pb-1 pr-4">
                        <div className="text-center space-y-1">
                          <div className="h-12 w-32 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[9px] text-slate-400 bg-slate-50/20">
                            Stamp & Sign
                          </div>
                          <p className="font-bold text-slate-700 uppercase tracking-wider pt-1 text-[9px]">Authorized Signatory</p>
                          <p className="text-[9px] text-slate-400 font-medium">For {business?.name || "Hotel"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom disclaimer */}
                    <div className="border-t border-slate-200 pt-4 text-center">
                      <p className="text-[9px] text-slate-400 font-medium tracking-wide">
                        Thank you for your stay! Powered by GamaNext Software Solutions.
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
