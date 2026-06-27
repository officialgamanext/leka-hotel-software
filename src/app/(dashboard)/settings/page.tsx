"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { businessService } from "@/services/business.service";
import { demoDb } from "@/services/demoDb";
import { HotelSettings } from "@/types";
import { motion } from "framer-motion";
import { 
  Settings, Clock, Landmark, RefreshCcw, Save, 
  Loader2, Check, ShieldAlert, Sparkles, Building
} from "lucide-react";

export default function SettingsPage() {
  const selectedBusinessId = useAppStore((state) => state.selectedBusinessId) || "";

  // Settings States
  const [currency, setCurrency] = useState("USD");
  const [taxRate, setTaxRate] = useState(10);
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [hotelName, setHotelName] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Load current settings
  useEffect(() => {
    if (!selectedBusinessId) return;

    async function loadSettings() {
      setLoading(true);
      try {
        const biz = await businessService.getBusiness(selectedBusinessId);
        if (biz) {
          setHotelName(biz.name);
          setCurrency(biz.settings.currency);
          setTaxRate(biz.settings.taxRate);
          setCheckInTime(biz.settings.checkInTime);
          setCheckOutTime(biz.settings.checkOutTime);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [selectedBusinessId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await businessService.updateBusinessSettings(selectedBusinessId, {
        currency,
        taxRate: Number(taxRate),
        checkInTime,
        checkOutTime,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm("Are you sure you want to reset all demo rooms, bookings, and billing history to defaults? This will clear browser changes.")) return;

    setResetting(true);
    try {
      demoDb.resetAll();
      // Delay for loader realism
      await new Promise((resolve) => setTimeout(resolve, 800));
      window.location.reload();
    } catch (err) {
      console.error(err);
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure hotel workspace defaults, timezone limits, and system parameters</p>
      </div>

      {loading ? (
        <div className="h-[250px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Main settings form */}
          <form onSubmit={handleSave} className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl shadow-lg space-y-6">
            
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-400 uppercase tracking-wide border-b border-slate-850/50 pb-3">
              <Building className="w-4 h-4" /> Hotel Details
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Hotel name (view only or update depending on setup) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Hotel Workspace Name</label>
                <input
                  type="text"
                  disabled
                  value={hotelName}
                  className="w-full bg-slate-950/40 border border-slate-850 text-slate-450 px-4 py-2.5 rounded-lg text-sm cursor-not-allowed outline-none"
                />
                <span className="text-[10px] text-slate-500">Workspace name is configured in the Selector Wizard.</span>
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Currency Denomination</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-4 py-2.5 rounded-lg text-sm focus:border-cyan-500 outline-none cursor-pointer"
                >
                  <option value="USD">USD ($) - United States Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="AED">AED (د.إ) - UAE Dirham</option>
                </select>
              </div>

            </div>

            <div className="flex items-center gap-2 text-sm font-bold text-cyan-400 uppercase tracking-wide border-b border-slate-850/50 pt-4 pb-3">
              <Clock className="w-4 h-4" /> Hospitality Rules
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Check in time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Standard Check-In</label>
                <input
                  type="time"
                  required
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-4 py-2.5 rounded-lg text-sm focus:border-cyan-500 outline-none"
                />
              </div>

              {/* Check out time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Standard Check-Out</label>
                <input
                  type="time"
                  required
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-4 py-2.5 rounded-lg text-sm focus:border-cyan-500 outline-none"
                />
              </div>

              {/* Tax rate */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Taxation Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={40}
                  required
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 px-4 py-2.5 rounded-lg text-sm focus:border-cyan-500 outline-none"
                />
              </div>

            </div>

            {/* Save operations */}
            <div className="flex items-center justify-between border-t border-slate-850 pt-6">
              <div className="flex items-center gap-2">
                {savedSuccess && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/15 py-1 px-3 rounded-lg"
                  >
                    <Check className="w-3.5 h-3.5" /> Workspace configurations updated successfully.
                  </motion.span>
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="h-10 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/15 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Settings</>}
              </button>
            </div>

          </form>

          {/* Demo Reset Panel */}
          <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-2xl shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5" /> Demo System Workspace Reset
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Are you developing or demonstrating the platform? If you've modified rooms, bookings, or revenue, you can reset the entire workspace back to defaults. This clears the local browser state.
            </p>
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              className="h-9 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-400 text-xs font-bold px-4 rounded-lg flex items-center gap-2 transition-all"
            >
              {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><RefreshCcw className="w-3.5 h-3.5" /> Reset Demo Environment</>}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
