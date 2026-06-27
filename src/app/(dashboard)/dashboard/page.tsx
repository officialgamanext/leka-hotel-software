"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import { businessService } from "@/services/business.service";
import { motion } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { 
  CalendarDays, Users, Hotel, DollarSign, ArrowUpRight, 
  Plus, UserPlus, BedDouble, FileText, BellRing, 
  ChevronRight, Calendar, ArrowDownRight, Loader2, ChevronDown
} from "lucide-react";
import Link from "next/link";

// Mock weekly revenue overview data matching graph exactly
const MOCK_REVENUE_CHART = [
  { day: "21 Jun", revenue: 9500 },
  { day: "22 Jun", revenue: 19500 },
  { day: "23 Jun", revenue: 23000 },
  { day: "24 Jun", revenue: 27500 },
  { day: "25 Jun", revenue: 39000 },
  { day: "26 Jun", revenue: 44000 },
  { day: "27 Jun", revenue: 48750 }
];

// Mock recent bookings list matching mockup
const MOCK_RECENT_BOOKINGS = [
  { initials: "JS", name: "John Smith", room: "Room 101", date: "27 Jun 2025", status: "checked-in" },
  { initials: "AM", name: "Alice Morgan", room: "Room 205", date: "27 Jun 2025", status: "checked-in" },
  { initials: "RK", name: "Robert King", room: "Room 302", date: "27 Jun 2025", status: "confirmed" },
  { initials: "SP", name: "Sophia Patel", room: "Room 104", date: "28 Jun 2025", status: "upcoming" },
  { initials: "DW", name: "Daniel Wilson", room: "Room 201", date: "28 Jun 2025", status: "upcoming" }
];

// Room status overview chart data matching counts:
// Occupied (42), Available (38), Reserved (15), Maintenance (5)
const ROOM_STATUS_DATA = [
  { name: "Occupied", value: 42, color: "#3b82f6" },     // Blue
  { name: "Available", value: 38, color: "#10b981" },    // Emerald Green
  { name: "Reserved", value: 15, color: "#f59e0b" },     // Amber Orange
  { name: "Maintenance", value: 5, color: "#f43f5e" }    // Rose Red
];

export default function DashboardPage() {
  const selectedBusinessId = useAppStore((state) => state.selectedBusinessId) || "";

  // React Query Fetch (Independent Summary)
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["dashboard-summary", selectedBusinessId],
    queryFn: () => businessService.getDashboardSummary(selectedBusinessId),
    enabled: !!selectedBusinessId,
  });

  const currencySymbol = "₹";

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* 1. WELCOME HEADER BAR WITH DATE PICKER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back, Admin! 👋</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">Here's what's happening at your hotel today.</p>
        </div>

        {/* Date Display Card Dropdown */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/80 rounded-xl text-slate-700 text-xs font-bold shadow-sm select-none">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>27 June 2025</span>
          <ChevronDown className="w-4 h-4 text-slate-400 ml-1.5" />
        </div>
      </div>

      {/* 2. FOUR KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Bookings */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Bookings</span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">128</h2>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> 12% from yesterday
            </span>
          </div>
        </div>

        {/* Checked In */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Checked In</span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">82</h2>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> 8% from yesterday
            </span>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Hotel className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Occupancy Rate</span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">68.5%</h2>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> 5% from yesterday
            </span>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Today's Revenue</span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">₹48,750</h2>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> 15% from yesterday
            </span>
          </div>
        </div>

      </div>

      {/* 3. MIDDLE SECTION: CHART + RECENT BOOKINGS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Overview Chart Column */}
        <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm font-extrabold tracking-tight text-slate-900">Revenue Overview</h2>
            </div>
            
            <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer">
              <span>This Week</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-1" />
            </div>
          </div>

          {/* Area Chart mapping weekly values */}
          <div className="h-[260px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_REVENUE_CHART} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}K`} />
                <Tooltip 
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Revenue"]}
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#f1f5f9", borderRadius: "10px", fontSize: "11px" }}
                  labelStyle={{ fontWeight: "bold", fontSize: "10px" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#2563eb" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: "#2563eb" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Bookings List Column */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-sm font-extrabold tracking-tight text-slate-900">Recent Bookings</h2>
            <Link href="/bookings" className="text-[11px] font-bold text-blue-600 hover:underline">
              View All
            </Link>
          </div>

          {/* Bookings rows */}
          <div className="space-y-4 flex-1">
            {MOCK_RECENT_BOOKINGS.map((booking, idx) => (
              <div key={idx} className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-3">
                  {/* Initials profile bubble */}
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                    {booking.initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">{booking.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{booking.room}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold text-slate-450">{booking.date}</span>
                  
                  {/* Status Badges */}
                  {booking.status === "checked-in" && (
                    <span className="w-[84px] text-center py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-bold rounded-lg uppercase">
                      Checked In
                    </span>
                  )}
                  {booking.status === "confirmed" && (
                    <span className="w-[84px] text-center py-1 bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-bold rounded-lg uppercase">
                      Confirmed
                    </span>
                  )}
                  {booking.status === "upcoming" && (
                    <span className="w-[84px] text-center py-1 bg-blue-50 text-blue-600 border border-blue-100 text-[9px] font-bold rounded-lg uppercase">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. BOTTOM SECTION: QUICK ACTIONS + ROOM STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quick Actions Column (55% / col-span-7) */}
        <div className="lg:col-span-7 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
          <h2 className="text-sm font-extrabold tracking-tight text-slate-900 mb-5">Quick Actions</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            {/* Action 1 */}
            <Link 
              href="/bookings"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 leading-tight group-hover:text-blue-600">New Booking</span>
            </Link>

            {/* Action 2 */}
            <Link 
              href="/guests"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 leading-tight group-hover:text-emerald-600">Add Guest</span>
            </Link>

            {/* Action 3 */}
            <Link 
              href="/rooms"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 shrink-0">
                <BedDouble className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 leading-tight group-hover:text-purple-600">Room Management</span>
            </Link>

            {/* Action 4 */}
            <Link 
              href="/reports"
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 leading-tight group-hover:text-orange-600">Create Invoice</span>
            </Link>

            {/* Action 5 */}
            <div 
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3 shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 leading-tight group-hover:text-cyan-600">Add Service</span>
            </div>
          </div>

        </div>

        {/* Room Status Overview Column (45% / col-span-5) */}
        <div className="lg:col-span-5 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <h2 className="text-sm font-extrabold tracking-tight text-slate-900 mb-5">Room Status Overview</h2>
          
          <div className="flex flex-row items-center justify-between gap-6 flex-1">
            {/* Pie chart representing room counts */}
            <div className="w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ROOM_STATUS_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={56}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {ROOM_STATUS_DATA.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Structured counts list on the right */}
            <div className="flex-1 space-y-2">
              {ROOM_STATUS_DATA.map((status, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: status.color }} 
                    />
                    <span className="font-bold text-slate-500">{status.name}</span>
                  </div>
                  <span className="font-extrabold text-slate-800">
                    {status.value} ({status.value}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
