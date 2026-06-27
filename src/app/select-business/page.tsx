"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { businessService } from "@/services/business.service";
import { authService } from "@/services/auth.service";
import { useAppStore } from "@/lib/store";
import { demoDb } from "@/services/demoDb";
import { db, auth, isFirebaseConfigured } from "@/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hotel, Plus, Loader2, LogOut, Bell, HelpCircle,
  MapPin, Calendar, MoreVertical, X, Check, ChevronDown,
  AlertTriangle, Phone, User, Landmark, Globe
} from "lucide-react";

// Formatter to render dates nicely, e.g. "2026-12-30" -> "30 Dec 2026"
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No Date Configured";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day < 10 ? '0' + day : day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

function SelectionConsole() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { setSelectedBusinessId, currentStaff, setCurrentStaff } = useAppStore();

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Creation States
  const [newHotelName, setNewHotelName] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newMobileNumber, setNewMobileNumber] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newDomain, setNewDomain] = useState("");

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User Dropdown State
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Firebase auth listener
  const [firebaseUserEmail, setFirebaseUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = auth.onAuthStateChanged((user: any) => {
        if (user) {
          setFirebaseUserEmail(user.email);
        } else {
          setFirebaseUserEmail(null);
        }
      });
      return () => unsubscribe();
    } else {
      setFirebaseUserEmail("admin@lekahotel.com");
    }
  }, []);

  // Read error parameter from URL redirect
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "inactive") {
      setError("Strict Access Violation: The selected hotel workspace has an inactive or expired subscription.");
    }
  }, [searchParams]);

  // Load hotel workspaces
  const loadData = async () => {
    if (isFirebaseConfigured && !firebaseUserEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (!isFirebaseConfigured) {
        // Sandbox/Demo mode: load demo database hotels
        const demoList = demoDb.getBusinesses();
        setBusinesses(demoList);
        return;
      }

      // Real Firebase Mode: strictly load entries mapped to the logged-in user profile
      const userEmail = firebaseUserEmail || currentStaff?.email;
      const userUid = auth.currentUser?.uid;

      if (!userEmail) {
        setBusinesses([]);
        return;
      }

      const list: any[] = [];

      // 1. Fetch by staff profiles (matching collection group)
      try {
        const staffProfiles = await authService.getUserStaffProfiles(userEmail);
        for (const profile of staffProfiles) {
          const biz = await businessService.getBusiness(profile.businessId);
          if (biz && !list.some((b) => b.id === biz.id)) {
            list.push(biz);
          }
        }
      } catch (err) {
        console.warn("Collection group query failed or index still building:", err);
      }

      // 2. Fetch directly by ownerUid (index-free, reliable, instant fallback!)
      if (userUid) {
        try {
          const ownerQuery = query(
            collection(db, "businesses"),
            where("ownerUid", "==", userUid)
          );
          const ownerSnapshot = await getDocs(ownerQuery);
          ownerSnapshot.forEach((docSnap) => {
            const biz = docSnap.data();
            if (biz && !list.some((b) => b.id === biz.id)) {
              list.push(biz);
            }
          });
        } catch (err) {
          console.error("Direct owner query failed:", err);
        }
      }

      setBusinesses(list);
    } catch (err) {
      console.error("Error loading workspaces:", err);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentStaff, firebaseUserEmail]);

  // STRICT CHECK ON ACTION SELECTION
  const handleSelect = (biz: any) => {
    setError(null);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Is subscription end date set?
    if (!biz.subscriptionEndDate) {
      setError(`Access Blocked: "${biz.name}" has no subscription configured (Inactive). Please contact support.`);
      return;
    }

    // 2. Is subscription end date past today's date?
    const endDate = new Date(biz.subscriptionEndDate);
    if (endDate < today) {
      setError(`Access Blocked: "${biz.name}" subscription has expired on ${formatDate(biz.subscriptionEndDate)}. Please contact support.`);
      return;
    }

    // 3. Is status set to active?
    if (biz.subscriptionStatus !== "active") {
      setError(`Access Blocked: "${biz.name}" subscription is set to inactive.`);
      return;
    }

    // Pass verification check -> Allow routing
    setSelectedBusinessId(biz.id);
    if (currentStaff) {
      setCurrentStaff({
        ...currentStaff,
        businessId: biz.id,
        role: "owner"
      });
    }
    router.push("/dashboard");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHotelName.trim() || !newAdminName.trim() || !newMobileNumber.trim() || !newLocation.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const currentUser = isFirebaseConfigured ? auth.currentUser : null;
      const ownerUid = currentUser?.uid || "demo-user-id";
      const ownerEmail = currentUser?.email || "admin@lekahotel.com";
      const domainVal = newDomain.trim() || `${newHotelName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.com`;

      // Save to service (will write to Firebase or demoDb)
      // New hotel is inactive (subscriptionEndDate = null) by default!
      const newBiz = await businessService.createBusiness(
        newHotelName.trim(),
        ownerUid,
        ownerEmail,
        newAdminName.trim(),
        newMobileNumber.trim(),
        newLocation.trim(),
        domainVal
      );

      // Clean inputs
      setNewHotelName("");
      setNewAdminName("");
      setNewMobileNumber("");
      setNewLocation("");
      setNewDomain("");
      setShowAddModal(false);

      // Reload lists
      await loadData();

      // Notify user that the business is created but locked until subscription is set
      setError(`Workspace "${newBiz.name}" created successfully, but has been flagged INACTIVE because subscription end date is null. Please configure it inside settings or database.`);
    } catch (err: any) {
      setError(err.message || "Failed to create business workspace.");
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login");
  };

  const rowThemes = [
    { bg: "bg-blue-50 text-blue-600", colorClass: "text-blue-500" },
    { bg: "bg-emerald-50 text-emerald-600", colorClass: "text-emerald-500" },
    { bg: "bg-rose-50 text-rose-600", colorClass: "text-rose-500" },
    { bg: "bg-cyan-50 text-cyan-600", colorClass: "text-cyan-500" },
    { bg: "bg-amber-50 text-amber-600", colorClass: "text-amber-500" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between">

      {/* 1. TOP HEADER */}
      <header className="h-20 bg-white border-b border-slate-100 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-30 shadow-sm">

        {/* LEKA HOTEL logo */}
        <div className="flex items-center gap-2">
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
                className="h-8 w-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* Right Corner Actions */}
        <div className="flex items-center gap-5">
          <button className="relative p-2 hover:bg-slate-50 rounded-full text-slate-500 hover:text-slate-700 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
              4
            </span>
          </button>

          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-blue-100 overflow-hidden border border-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256"
                  alt="Admin Profile"
                  className="w-full h-full object-cover"
                />
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
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-rose-50 rounded-lg transition-colors text-left font-bold"
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

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 flex flex-col justify-start">

        {/* Welcome and actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome back, {currentStaff?.name || "Admin"}! 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">Select a business to continue</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 rounded-lg text-sm flex items-center gap-2 shadow-md active:scale-[0.98] transition-all"
          >
            <Plus className="w-4.5 h-4.5" /> Add Business
          </button>
        </div>

        {/* Global Block Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-3 shadow-sm font-medium leading-relaxed"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1">
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-rose-450 hover:text-rose-700 font-bold">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Workspaces Rows list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs text-slate-400 mt-2 font-medium">Synchronizing workspaces...</p>
          </div>
        ) : businesses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200/60 rounded-2xl p-10 text-center max-w-lg mx-auto shadow-sm mt-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Hotel className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">No Hotel Workspaces Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
              You haven't registered any hotels under this account yet. Click the button below to add your first property workspace.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-md"
            >
              <Plus className="w-4 h-4" /> Add First Business
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {businesses.map((biz, idx) => {
              const themeProps = rowThemes[idx % rowThemes.length];

              // Validate subscription status for row display
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const hasNoDate = !biz.subscriptionEndDate;
              const isExpired = biz.subscriptionEndDate ? new Date(biz.subscriptionEndDate) < today : true;
              const isInactive = biz.subscriptionStatus !== "active";

              let rowStatus = "active";
              if (hasNoDate || isInactive) rowStatus = "inactive";
              else if (isExpired) rowStatus = "inactive";
              else {
                // Check if expiring in less than 30 days
                const end = new Date(biz.subscriptionEndDate!);
                const diffTime = Math.abs(end.getTime() - today.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 30) rowStatus = "expiring-soon";
              }

              // Color mappings based on evaluated state
              const dateColor = rowStatus === "inactive"
                ? "text-rose-500"
                : rowStatus === "expiring-soon"
                  ? "text-amber-500"
                  : "text-blue-500";

              return (
                <motion.div
                  key={biz.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="bg-white border border-slate-100 hover:border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm transition-all group"
                >
                  {/* Icon & Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${themeProps.bg}`}>
                      <Hotel className="w-7 h-7" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-800 text-base group-hover:text-blue-600 transition-colors">
                        {biz.name}
                      </h3>
                      <p className="text-xs text-slate-450 mt-0.5 truncate">{biz.domain || "no-domain.com"}</p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {biz.location || "Location Unknown"}
                      </div>
                    </div>
                  </div>

                  {/* Right segment details */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 md:gap-12">

                    {/* Subscription end date */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Subscription End Date</span>
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${dateColor}`}>
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>{formatDate(biz.subscriptionEndDate)}</span>
                      </div>
                    </div>

                    {/* Status badge pill */}
                    <div className="w-28 flex md:justify-center">
                      {rowStatus === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-bold rounded-full uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      ) : rowStatus === "expiring-soon" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold rounded-full uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Expiring Soon
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold rounded-full uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Inactive
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelect(biz)}
                        className="px-4 py-2 border border-blue-250 hover:bg-blue-50 text-blue-600 font-bold rounded-lg text-xs transition-all shadow-sm active:scale-[0.98]"
                      >
                        Open
                      </button>
                      <button className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                        <MoreVertical className="w-4.5 h-4.5" />
                      </button>
                    </div>

                  </div>

                </motion.div>
              );
            })}
          </div>
        )}

      </main>

      {/* 3. FOOTER HELP */}
      <footer className="py-6 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
        <HelpCircle className="w-4 h-4 text-slate-400" /> Need help?{" "}
        <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
          Contact Support
        </a>
      </footer>

      {/* Add Hotel Workspace Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-slate-150 p-6 sm:p-8 rounded-2xl shadow-2xl relative z-10 space-y-4 text-slate-800"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                    <Hotel className="w-5 h-5 text-blue-600" /> Add Hotel Workspace
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">All created hotels are INACTIVE by default.</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">

                {/* 1. Business Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Business Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Landmark className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={newHotelName}
                      onChange={(e) => setNewHotelName(e.target.value)}
                      placeholder="e.g. Leka Suites"
                      className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 placeholder-slate-450 pl-10 pr-4 py-2 rounded-lg text-sm transition-all outline-none"
                    />
                  </div>
                </div>

                {/* 2. Admin Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Admin Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="e.g. SivaKrishna"
                      className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 placeholder-slate-450 pl-10 pr-4 py-2 rounded-lg text-sm transition-all outline-none"
                    />
                  </div>
                </div>

                {/* 3. Mobile Number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={newMobileNumber}
                      onChange={(e) => setNewMobileNumber(e.target.value)}
                      placeholder="e.g. +91 9999999999"
                      className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 placeholder-slate-450 pl-10 pr-4 py-2 rounded-lg text-sm transition-all outline-none"
                    />
                  </div>
                </div>

                {/* 4. Business Address (Location) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Business Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="e.g. Chicago, USA"
                      className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 placeholder-slate-450 pl-10 pr-4 py-2 rounded-lg text-sm transition-all outline-none"
                    />
                  </div>
                </div>

                {/* 5. Domain (optional placeholder override) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Business Domain Url (Optional)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Globe className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="e.g. leka-suites.com"
                      className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 placeholder-slate-450 pl-10 pr-4 py-2 rounded-lg text-sm transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-1/2 h-10 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-lg text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-1/2 h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Property"}
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

export default function SelectBusinessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <SelectionConsole />
    </Suspense>
  );
}
