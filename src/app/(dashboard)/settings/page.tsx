"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { businessService } from "@/services/business.service";
import { Business } from "@/types";
import {
  Building2, Phone, MapPin, Globe, User, Calendar,
  ShieldCheck, Loader2, Percent, ToggleLeft, ToggleRight,
  CheckCircle2, Clock, CreditCard
} from "lucide-react";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] text-slate-450 font-bold uppercase tracking-widest">{label}</span>
      <span className="text-xs font-extrabold text-slate-800">{value || "—"}</span>
    </div>
  );
}

export default function SettingsPage() {
  const selectedBusinessId = useAppStore((state) => state.selectedBusinessId) || "";
  const currentStaff = useAppStore((state) => state.currentStaff);
  const canEdit = !currentStaff || currentStaff.role === "owner" || currentStaff.role === "admin" || (currentStaff.permissions?.settings?.edit ?? false);

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  // GST states
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState<number>(18);
  const [hotelGstNumber, setHotelGstNumber] = useState<string>("");
  const [savingGst, setSavingGst] = useState(false);
  const [gstSaved, setGstSaved] = useState(false);

  useEffect(() => {
    async function load() {
      if (!selectedBusinessId) return;
      setLoading(true);
      try {
        const biz = await businessService.getBusiness(selectedBusinessId);
        if (biz) {
          setBusiness(biz);
          setGstEnabled(biz.settings?.gstEnabled ?? false);
          setGstRate(biz.settings?.gstRate ?? 18);
          setHotelGstNumber(biz.settings?.gstNumber ?? "");
        }
      } catch (err) {
        console.error("Failed to load business:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedBusinessId]);

  const handleSaveGst = async () => {
    if (!selectedBusinessId) return;
    setSavingGst(true);
    try {
      await businessService.saveGstSettings(
        selectedBusinessId,
        gstEnabled,
        gstEnabled ? gstRate : 0,
        gstEnabled ? hotelGstNumber.trim() : ""
      );
      setGstSaved(true);
      setTimeout(() => setGstSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save GST settings:", err);
      alert("Failed to save GST settings. Please try again.");
    } finally {
      setSavingGst(false);
    }
  };

  const subStatusColor = business?.subscriptionStatus === "active"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-rose-50 text-rose-700 border-rose-200";

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">

      {/* Page Header */}
      <div className="border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 text-xs mt-1.5 font-semibold">Manage your hotel configuration and billing preferences.</p>
      </div>

      {/* ─── Card 1: Business Information (View Only) ─── */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        
        {/* Card Header */}
        <div className="flex items-center gap-3 px-7 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Building2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Business Information</h2>
            <p className="text-[10px] text-slate-450 font-bold">View-only · Contact GamaNext to update details</p>
          </div>
        </div>

        {/* Business Details Grid */}
        <div className="p-7 space-y-6">

          {/* Name + Status Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <span className="text-[9px] text-slate-450 font-bold uppercase tracking-widest block">Hotel / Business Name</span>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">{business?.name || "—"}</h3>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border ${subStatusColor}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {business?.subscriptionStatus === "active" ? "Active Subscription" : "Inactive"}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
              <InfoRow label="Admin / Owner Name" value={business?.adminName} />
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <InfoRow label="Mobile Number" value={business?.mobileNumber} />
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                <Globe className="w-4 h-4" />
              </div>
              <InfoRow label="Domain / Category" value={business?.domain} />
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <InfoRow label="Location" value={business?.location} />
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <InfoRow label="Registered On" value={business?.createdAt ? new Date(business.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : undefined} />
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                <CreditCard className="w-4 h-4" />
              </div>
              <InfoRow
                label="Subscription Plan"
                value={business?.subscriptionPlan ? business.subscriptionPlan.charAt(0).toUpperCase() + business.subscriptionPlan.slice(1) : undefined}
              />
            </div>
          </div>

          {/* Check-in / Check-out Times */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Default Check-in</span>
                <span className="text-sm font-extrabold text-slate-900">{business?.settings?.checkInTime || "14:00"}</span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
              <Clock className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Default Check-out</span>
                <span className="text-sm font-extrabold text-slate-900">{business?.settings?.checkOutTime || "11:00"}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── Card 2: GST Settings ─── */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        
        {/* Card Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Percent className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">GST / Tax Settings</h2>
              <p className="text-[10px] text-slate-450 font-bold">Apply GST on guest invoices during checkout</p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => setGstEnabled((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all disabled:opacity-50 disabled:pointer-events-none ${
              gstEnabled
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            {gstEnabled ? (
              <ToggleRight className="w-5 h-5 text-emerald-600" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-slate-400" />
            )}
            {gstEnabled ? "GST Enabled" : "GST Disabled"}
          </button>
        </div>

        <div className="p-7 space-y-5">

          {!gstEnabled ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 border-dashed p-5 rounded-2xl text-slate-450">
              <Percent className="w-6 h-6 shrink-0 text-slate-350" />
              <div>
                <p className="text-xs font-bold text-slate-600">GST is currently disabled</p>
                <p className="text-[10px] font-medium text-slate-450 mt-0.5">Toggle the switch above to enable GST billing. Once enabled, set your GST rate below and save.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Hotel GSTIN (GST Number) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  disabled={!canEdit}
                  value={hotelGstNumber}
                  onChange={(e) => setHotelGstNumber(e.target.value)}
                  className="max-w-xs w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold outline-none transition-all disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  GST Percentage *
                </label>
                <div className="flex items-center gap-3 max-w-xs">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      disabled={!canEdit}
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-4 py-3 rounded-xl text-sm font-extrabold outline-none transition-all text-center disabled:opacity-50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 font-bold text-sm pointer-events-none">
                      %
                    </span>
                  </div>
                  {/* Quick preset buttons */}
                  {[5, 12, 18, 28].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => setGstRate(preset)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-50 ${
                        gstRate === preset
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-slate-200 text-slate-650 hover:border-blue-400 hover:text-blue-600"
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Standard GST slabs: 5%, 12%, 18%, 28%. Select a preset or enter a custom rate.
                </p>
              </div>

              {/* Preview */}
              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl space-y-1.5">
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Bill Preview</span>
                <div className="text-xs font-semibold space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span>Room Charge (example ₹2,000):</span>
                    <span className="font-bold">₹2,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({gstRate}%):</span>
                    <span className="font-bold">₹{(2000 * gstRate / 100).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-slate-900 border-t border-blue-200 pt-1 mt-1">
                    <span>Total:</span>
                    <span className="text-blue-600">₹{(2000 + 2000 * gstRate / 100).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSaveGst}
              disabled={savingGst || !canEdit}
              className="h-10 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm active:scale-[0.99]"
            >
              {savingGst ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save GST Settings
            </button>
            {gstSaved && (
              <span className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> Saved successfully!
              </span>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
