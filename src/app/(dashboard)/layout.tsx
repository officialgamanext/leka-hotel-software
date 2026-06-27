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
    { label: "Settings", href: "/settings", icon: Settings },
    { label: "Support", href: "/support", icon: HelpCircle },
  ];

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
            <div className="flex items-center gap-0.5 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <div className="flex items-center gap-1.5 -mt-0.5">
              <div className="w-6 h-6 rounded bg-[#091e3a] flex items-center justify-center text-white">
                <Hotel className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-sm font-black tracking-tight text-[#091e3a] uppercase">LEKA HOTEL</span>
                <span className="text-[7px] uppercase font-bold text-amber-600 tracking-widest mt-0.5">Hotel</span>
              </div>
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
            {menuItems.map((item, idx) => {
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
                <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">Hotel Admin</p>
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
        {menuItems.map((item, idx) => {
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
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl w-full mx-auto">
        {children}
      </main>

    </div>
  );
}
