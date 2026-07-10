"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { authService } from "@/services/auth.service";
import { businessService } from "@/services/business.service";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hotel, LayoutDashboard, BedDouble, CalendarDays,
  Users, BarChart3, Settings, LogOut, ChevronDown,
  Bell, ChevronLeft, ChevronRight, Loader2, DollarSign,
  Briefcase, ShieldAlert, HelpCircle
} from "lucide-react";
import Link from "next/link";

function checkPagePermission(pathname: string, staff: any): { view: boolean; edit: boolean } {
  if (!staff) {
    return { view: true, edit: true };
  }
  if (staff.role === "owner" || staff.role === "admin") {
    return { view: true, edit: true };
  }
  const permissions = staff.permissions;
  if (!permissions) {
    return { view: false, edit: false };
  }
  if (pathname.startsWith("/dashboard")) return permissions.dashboard || { view: false, edit: false };
  if (pathname.startsWith("/rooms")) return permissions.rooms || { view: false, edit: false };
  if (pathname.startsWith("/reports")) return permissions.reports || { view: false, edit: false };
  if (pathname.startsWith("/bookings")) return permissions.bookings || { view: false, edit: false };
  if (pathname.startsWith("/guests")) return permissions.guests || { view: false, edit: false };
  if (pathname.startsWith("/investments")) return permissions.investments || { view: false, edit: false };
  if (pathname.startsWith("/settings")) return permissions.settings || { view: false, edit: false };
  if (pathname.startsWith("/support")) return permissions.support || { view: false, edit: false };
  if (pathname.startsWith("/staff")) return permissions.staff || { view: false, edit: false };

  return { view: true, edit: true };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    selectedBusinessId,
    setSelectedBusinessId,
    currentStaff,
    resetStore
  } = useAppStore();

  const [hotelName, setHotelName] = useState("Leka Hotel");
  const [loading, setLoading] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // 1. Protection Gatekeeper Check
  useEffect(() => {
    if (!selectedBusinessId) {
      router.replace("/select-business");
      return;
    }

    async function loadHotelDetails() {
      try {
        if (selectedBusinessId) {
          const biz = await businessService.getBusiness(selectedBusinessId);
          if (biz) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const isExpired = biz.subscriptionEndDate ? new Date(biz.subscriptionEndDate) < today : true;
            const isInactive = biz.subscriptionStatus !== "active";

            if (isInactive || isExpired) {
              console.warn("Strict check failed: Business subscription is inactive or expired.");
              setSelectedBusinessId(null); // Clear active selection context
              router.replace("/select-business?error=inactive");
              return;
            }

            setHotelName(biz.name);
          } else {
            setSelectedBusinessId(null);
            router.replace("/select-business");
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load hotel details:", err);
        setSelectedBusinessId(null);
        router.replace("/select-business");
      } finally {
        setLoading(false);
      }
    }

    loadHotelDetails();
  }, [selectedBusinessId, router, setSelectedBusinessId]);

  const handleLogout = async () => {
    await authService.logout();
    resetStore();
    router.replace("/login");
  };

  const handleScroll = (direction: "left" | "right") => {
    if (menuRef.current) {
      const scrollAmount = direction === "left" ? -200 : 200;
      menuRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Horizontal Menu Items matching specifications
  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Rooms", href: "/rooms", icon: BedDouble },
    { label: "Payments", href: "/reports", icon: DollarSign },
    { label: "Requests", href: "/bookings", icon: CalendarDays },
    { label: "Guests", href: "/guests", icon: Users },
    { label: "Investments", href: "/investments", icon: Briefcase },
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Support", href: "/support", icon: HelpCircle },
    { label: "Staff", href: "/staff", icon: ShieldAlert },
  ];

  const permissions = checkPagePermission(pathname, currentStaff);

  const visibleMenuItems = menuItems.filter((item) => {
    const perm = checkPagePermission(item.href, currentStaff);
    return perm.view;
  });

  if (!selectedBusinessId || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs text-slate-500 mt-2 font-medium">Synchronizing workspaces...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">

      {/* GLOBAL HORIZONTAL HEADER */}
      <header className="h-20 bg-white border-b border-slate-100 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-30 shadow-sm">

        {/* Left Side: Logo & Workspace Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-start gap-0.5">
            {/* <div className="flex items-center gap-0.5 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div> */}
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="Leka Hotel Logo"
                className="h-8 w-auto object-contain cursor-pointer"
                onClick={() => router.push("/dashboard")}
              />
            </div>
          </div>

          {/* Quick switcher caret */}
          <button
            onClick={() => router.push("/select-business")}
            className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors ml-1"
            title="Switch Workspace"
          >
            <ChevronDown className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Middle Section: Horizontal Nav Tab Items with Scroller Arrows */}
        <div className="hidden lg:flex items-center gap-1 max-w-[60%] flex-1 mx-4 overflow-hidden relative">
          {/* Left Arrow Button */}
          <button
            onClick={() => handleScroll("left")}
            className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center border border-slate-200/50 text-slate-550 shrink-0 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Nav Container */}
          <div
            ref={menuRef}
            className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
          >
            {visibleMenuItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={idx}
                  href={item.href}
                  className={`
                    flex flex-col items-center justify-center gap-1.5 px-4.5 py-1.5 rounded-xl text-[10px] font-bold transition-all min-w-[76px] select-none
                    ${isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }
                  `}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-blue-600" : "text-slate-450"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={() => handleScroll("right")}
            className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center border border-slate-200/50 text-slate-550 shrink-0 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Corner: Profile Dropdown */}
        <div className="flex items-center gap-4 shrink-0">

          {/* Mobile indicator for switching business */}
          <span className="lg:hidden text-xs font-bold text-slate-700 max-w-[120px] truncate bg-slate-100 px-2 py-1 rounded">
            {hotelName}
          </span>

          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-left"
            >
              {/* Profile Image with active state dot */}
              <div className="relative w-9 h-9 rounded-full bg-blue-100 overflow-hidden border border-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256"
                  alt="Admin Profile"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-xs font-bold text-slate-800">{currentStaff?.name || "Admin"}</p>
                <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">
                  {currentStaff?.role === "owner" ? "Hotel Owner" : currentStaff?.role === "admin" ? "Hotel Admin" : "Hotel Staff"}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            <AnimatePresence>
              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-100 p-2 shadow-xl z-20"
                  >
                    {/* Switcher in profile for mobile devices */}
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        router.push("/select-business");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left font-bold border-b border-slate-100"
                    >
                      <Hotel className="w-4 h-4 text-slate-400" /> Switch Hotel
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-rose-50 rounded-lg transition-colors text-left font-bold mt-1"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

      </header>

      {/* MOBILE SCROLLABLE NAV TAB STRIP (shows only on smaller devices below lg layout breakpoint) */}
      <nav className="lg:hidden flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth bg-white border-b border-slate-100 py-3 px-4 shadow-sm shrink-0">
        {visibleMenuItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={idx}
              href={item.href}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-colors
                ${isActive ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"}
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto max-w-7xl w-full mx-auto">
        {permissions.view ? (
          children
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white border border-slate-200 rounded-3xl shadow-sm min-h-[50vh]">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-xs">
              <ShieldAlert className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Access Restricted</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed font-semibold">
              You do not have the required permissions to view the <strong>{pathname.replace("/", "").toUpperCase()}</strong> page.
            </p>
            <p className="text-[10px] text-slate-450 mt-1 italic">
              Please contact your hotel administrator to request page access.
            </p>
            <button
              onClick={() => router.push(currentStaff?.permissions?.dashboard?.view ? "/dashboard" : "/select-business")}
              className="mt-6 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-705 text-white text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
            >
              Return Home
            </button>
          </div>
        )}
      </main>

    </div>
  );
}
