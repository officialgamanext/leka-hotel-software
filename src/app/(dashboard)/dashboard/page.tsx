"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { roomService } from "@/services/room.service";
import { reportService } from "@/services/report.service";
import { investmentService } from "@/services/investment.service";
import { requestService } from "@/services/request.service";
import { businessService } from "@/services/business.service";
import { Room, Invoice, Investment, Business } from "@/types";
import { ServiceRequest } from "@/services/demoDb";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, BedDouble, CheckCircle2, AlertCircle, DollarSign,
  TrendingUp, TrendingDown, Percent, ArrowUpRight, ArrowDownRight,
  Loader2, Bell, Users, Eye, HelpCircle, Wrench, Coins, Briefcase, ChevronDown, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { CustomDatePicker } from "@/components/ui/date-picker";

type DateFilterType = "today" | "tomorrow" | "this-week" | "last-week" | "this-month" | "last-month" | "this-year" | "last-year" | "custom" | "all";

function getDateRange(filter: DateFilterType, customStart?: string, customEnd?: string) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  switch (filter) {
    case "today":
      return { start, end };
    case "tomorrow":
      start.setDate(now.getDate() + 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() + 1);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    case "this-week": {
      const day = now.getDay();
      start.setDate(now.getDate() - day);
      end.setDate(now.getDate() + (6 - day));
      return { start, end };
    }
    case "last-week": {
      const lastSunday = now.getDate() - now.getDay() - 7;
      start.setDate(lastSunday);
      end.setDate(lastSunday + 6);
      return { start, end };
    }
    case "this-month":
      start.setDate(1);
      end.setMonth(now.getMonth() + 1);
      end.setDate(0);
      return { start, end };
    case "last-month":
      start.setMonth(now.getMonth() - 1);
      start.setDate(1);
      end.setMonth(now.getMonth());
      end.setDate(0);
      return { start, end };
    case "this-year":
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      return { start, end };
    case "last-year":
      start.setFullYear(now.getFullYear() - 1, 0, 1);
      end.setFullYear(now.getFullYear() - 1, 11, 31);
      return { start, end };
    case "custom":
      if (customStart && customEnd) {
        const s = new Date(customStart);
        s.setHours(0, 0, 0, 0);
        const e = new Date(customEnd);
        e.setHours(23, 59, 59, 999);
        return { start: s, end: e };
      }
      return { start, end };
    default:
      // "all"
      start.setFullYear(2020, 0, 1);
      end.setFullYear(2035, 11, 31);
      return { start, end };
  }
}

function getOverlapDays(cin: string | null | undefined, cout: string | null | undefined, start: Date, end: Date): number {
  if (!cin) return 0;
  const checkIn = new Date(cin);
  const checkOut = cout ? new Date(cout) : new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // tomorrow fallback

  const overlapStart = new Date(Math.max(checkIn.getTime(), start.getTime()));
  const overlapEnd = new Date(Math.min(checkOut.getTime(), end.getTime()));

  if (overlapStart >= overlapEnd) return 0;

  const diffTime = overlapEnd.getTime() - overlapStart.getTime();
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

export default function DashboardPage() {
  const selectedBusinessId = useAppStore((state) => state.selectedBusinessId) || "";

  // Data State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const loadDashboardData = async () => {
    if (!selectedBusinessId) return;
    setLoading(true);
    try {
      const [roomsList, invoicesList, investmentsList, requestsList, biz] = await Promise.all([
        roomService.getRooms(selectedBusinessId),
        reportService.getRecentInvoices(selectedBusinessId, 500),
        investmentService.getInvestments(selectedBusinessId),
        requestService.getRequests(selectedBusinessId),
        businessService.getBusiness(selectedBusinessId)
      ]);
      setRooms(roomsList);
      setInvoices(invoicesList);
      setInvestments(investmentsList);
      setRequests(requestsList);
      setBusiness(biz);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedBusinessId]);

  // Compute stats based on Date Filter
  const { start: rangeStart, end: rangeEnd } = getDateRange(dateFilter, customStart, customEnd);

  // 1. Room Status Overview (Overlap with Date Filter)
  let totalRooms = rooms.length;
  let occupiedRooms = 0;
  let readyToCheckoutRooms = 0;
  let availableRooms = 0;

  rooms.forEach((room) => {
    // If filter is all, count real-time values
    if (dateFilter === "all") {
      if (room.status === "occupied") occupiedRooms++;
      else if (room.status === "near-checkout") readyToCheckoutRooms++;
      else if (room.status === "available" || room.status === "cleaning") availableRooms++;
      return;
    }

    // Otherwise calculate overlaps
    const checkIn = room.checkInTime ? new Date(room.checkInTime) : null;
    const checkOut = room.checkOutTime ? new Date(room.checkOutTime) : null;

    if (checkIn && checkIn <= rangeEnd && (!checkOut || checkOut >= rangeStart)) {
      // Overlaps with the range
      if (checkOut && checkOut >= rangeStart && checkOut <= rangeEnd) {
        readyToCheckoutRooms++;
      } else {
        occupiedRooms++;
      }
    } else {
      availableRooms++;
    }
  });

  // 2. Financial Metrics
  // Received amount = completed invoices (paid) in range
  const filteredInvoices = invoices.filter((inv) => {
    const invDate = new Date(inv.invoiceDate);
    return invDate >= rangeStart && invDate <= rangeEnd;
  });

  const gstEnabled = business?.settings?.gstEnabled ?? false;
  const gstRate = business?.settings?.gstRate ?? 0;

  let receivedAmount = 0;
  let gstCollected = 0;

  filteredInvoices.forEach((inv) => {
    if (gstEnabled) {
      const gst = Math.round(inv.subtotal * (gstRate / 100) * 100) / 100;
      receivedAmount += inv.subtotal + gst;
      gstCollected += gst;
    } else {
      receivedAmount += inv.total;
    }
  });

  // Pending Amount = active checkins overlapping days * rate/day
  let pendingAmount = 0;
  rooms.forEach((room) => {
    if ((room.status === "occupied" || room.status === "near-checkout") && room.checkInTime) {
      const days = getOverlapDays(room.checkInTime, room.checkOutTime, rangeStart, rangeEnd);
      pendingAmount += days * room.pricePerNight;
    }
  });

  // Total Revenue = Received Amount + Pending Amount
  const totalRevenue = receivedAmount + pendingAmount;

  // Investments in date range
  const filteredInvestments = investments.filter((inv) => {
    const invDate = new Date(inv.date);
    return invDate >= rangeStart && invDate <= rangeEnd;
  });
  const totalInvestments = filteredInvestments.reduce((sum, inv) => sum + inv.amount, 0);

  // Profit or Loss = Received - Investments
  const netProfit = receivedAmount - totalInvestments;

  // 3. Open requests (pending / in-progress)
  const openRequests = requests.filter((r) => r.status !== "completed");

  // 4. Recent checkout guests (completed invoices)
  const recentCheckoutGuests = filteredInvoices.slice(0, 5);

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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans relative">

      {/* Header and Filter Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
            {business?.name || "Hotel"} Dashboard
          </h1>
          <p className="text-slate-500 text-xs mt-1.5 font-semibold">Real-time overview of occupancy, finances, and service operations.</p>
        </div>

        {/* Global Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200/80 p-2 rounded-2xl">
          {dateFilter === "custom" && (
            <div className="flex items-center gap-2 px-2">
              <CustomDatePicker
                value={customStart}
                onChange={setCustomStart}
                triggerClassName="bg-white border-slate-200 py-1.5 h-[34px]"
              />
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <CustomDatePicker
                value={customEnd}
                onChange={setCustomEnd}
                triggerClassName="bg-white border-slate-200 py-1.5 h-[34px]"
              />
            </div>
          )}

          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
              className="appearance-none bg-white border border-slate-250 text-xs font-black text-slate-800 pl-4 pr-9 py-2.5 rounded-xl outline-none cursor-pointer hover:border-slate-350 transition-colors"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="this-week">This Week</option>
              <option value="last-week">Last Week</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-year">This Year</option>
              <option value="last-year">Last Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-555 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ─── Row 1: Rooms Overview Snapshot ─── */}
      <div>
        <h2 className="text-[10px] text-slate-450 font-black uppercase tracking-widest block mb-4">Rooms Occupancy Snapshot</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {/* Total Rooms */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-650 flex items-center justify-center shrink-0">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Total Rooms</span>
              <h3 className="text-xl font-black text-slate-800 mt-0.5">{totalRooms}</h3>
            </div>
          </div>

          {/* Occupied Rooms */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-650 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Occupied</span>
              <h3 className="text-xl font-black text-blue-650 mt-0.5">{occupiedRooms}</h3>
            </div>
          </div>

          {/* Ready to Checkout */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Checkouts</span>
              <h3 className="text-xl font-black text-amber-600 mt-0.5">{readyToCheckoutRooms}</h3>
            </div>
          </div>

          {/* Available Rooms */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Available</span>
              <h3 className="text-xl font-black text-emerald-600 mt-0.5">{availableRooms}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Row 2: Financial KPI Overview Grid ─── */}
      <div>
        <h2 className="text-[10px] text-slate-450 font-black uppercase tracking-widest block mb-4">Financial Ledger & Profitability</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-5">
          {/* Total Revenue */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">₹{totalRevenue.toLocaleString()}</h3>
              <p className="text-[8.5px] text-slate-400 font-bold mt-1 uppercase">Received + Pending</p>
            </div>
          </div>

          {/* Received Amount */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Received</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-emerald-600">₹{receivedAmount.toLocaleString()}</h3>
              <p className="text-[8.5px] text-slate-400 font-bold mt-1 uppercase">Completed Bills</p>
            </div>
          </div>

          {/* Pending Amount */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pending</span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">₹{pendingAmount.toLocaleString()}</h3>
              <p className="text-[8.5px] text-slate-400 font-bold mt-1 uppercase">Active Stays</p>
            </div>
          </div>

          {/* Investments */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Investments</span>
              <Briefcase className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-purple-600">₹{totalInvestments.toLocaleString()}</h3>
              <p className="text-[8.5px] text-slate-400 font-bold mt-1 uppercase">Capital Outlay</p>
            </div>
          </div>

          {/* Profit / Loss */}
          <div className={`border p-5 rounded-2xl shadow-sm space-y-3 ${
            netProfit >= 0 ? "bg-emerald-50/20 border-emerald-100" : "bg-rose-50/20 border-rose-100"
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Profit / Loss</span>
              {netProfit >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-600" />
              )}
            </div>
            <div>
              <h3 className={`text-lg font-black ${netProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                ₹{netProfit.toLocaleString()}
              </h3>
              <p className="text-[8.5px] text-slate-400 font-bold mt-1 uppercase">Received - Invest</p>
            </div>
          </div>

          {/* GST Collected */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">GST Collected</span>
              <Percent className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-blue-600">₹{gstCollected.toLocaleString()}</h3>
              <p className="text-[8.5px] text-slate-400 font-bold mt-1 uppercase">Tax Component</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Row 3: Open Requests and Recent Checkouts ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Open Service Requests */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">Active Service Requests</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Operation logs awaiting completion.</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-650 font-bold text-[10px]">
              {openRequests.length} Pending
            </span>
          </div>

          {openRequests.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-1.5 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <Wrench className="w-8 h-8 mx-auto text-slate-350" />
              <p className="text-[10px] font-bold">All requests completed successfully!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100/70 max-h-[300px] overflow-y-auto pr-1">
              {openRequests.map((req) => (
                <div key={req.id} className="flex justify-between items-start py-3.5 first:pt-0 last:pb-0">
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-black text-slate-800 uppercase bg-slate-100 px-2 py-0.5 rounded">
                      Room {req.roomNumber}
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-900 pt-1">{req.serviceName}</h4>
                    <p className="text-[10.5px] text-slate-500 font-medium">{req.issue}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                    req.status === "pending"
                      ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                      : "bg-blue-50 text-blue-700 border border-blue-200/60"
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Checkout Guests */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">Recent Checkouts</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Latest guests checked out within range.</p>
            </div>
            <Link href="/reports" className="text-[10px] font-bold text-blue-600 hover:underline">
              View Ledger
            </Link>
          </div>

          {recentCheckoutGuests.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-1.5 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <Users className="w-8 h-8 mx-auto text-slate-350" />
              <p className="text-[10px] font-bold">No checkout entries in this range</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100/70 max-h-[300px] overflow-y-auto pr-1">
              {recentCheckoutGuests.map((inv) => (
                <div key={inv.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-900">{inv.guestName}</h4>
                    <p className="text-[9.5px] text-slate-500 font-bold">
                      Room {inv.roomNumber} · Checked Out {inv.invoiceDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">
                      ₹{(gstEnabled ? inv.subtotal + Math.round(inv.subtotal * (gstRate / 100) * 100) / 100 : inv.total).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{inv.paymentMethod || "UPI"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
