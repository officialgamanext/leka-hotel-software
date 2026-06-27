"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { guestService } from "@/services/guest.service";
import { Guest } from "@/types";
import {
  Users, Search, Phone, Mail, MapPin, CreditCard,
  Loader2, User, Calendar, BedDouble, ChevronRight,
  X, RefreshCw
} from "lucide-react";

const MaleAvatar = () => (
  <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
    <circle cx="20" cy="20" r="20" fill="#dbeafe" />
    <circle cx="20" cy="15" r="7" fill="#3b82f6" />
    <path d="M6 38c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="#3b82f6" />
  </svg>
);

const FemaleAvatar = () => (
  <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
    <circle cx="20" cy="20" r="20" fill="#fce7f3" />
    <circle cx="20" cy="15" r="7" fill="#ec4899" />
    <path d="M6 38c0-7.732 6.268-14 14-14s14 6.268 14 14" fill="#ec4899" />
  </svg>
);

export default function GuestsPage() {
  const selectedBusinessId = useAppStore((state) => state.selectedBusinessId) || "";
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);

  const PAGE_SIZE = 30;

  const loadGuests = useCallback(async (reset = true) => {
    if (!selectedBusinessId) return;
    if (reset) setLoading(true);
    try {
      const result = await guestService.getGuests(
        selectedBusinessId,
        PAGE_SIZE,
        searchQuery,
        reset ? null : lastDoc
      );
      setGuests((prev) => reset ? result.guests : [...prev, ...result.guests]);
      setLastDoc(result.lastVisibleDoc);
      setHasMore(result.guests.length === PAGE_SIZE);
    } catch (err) {
      console.error("Failed to load guests:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedBusinessId, searchQuery, lastDoc]);

  useEffect(() => {
    loadGuests(true);
  }, [selectedBusinessId, searchQuery]);

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return iso;
    }
  };

  const isFemale = (guest: Guest) =>
    (guest.gender || "").toLowerCase() === "female";

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Guest Directory</h1>
          <p className="text-slate-500 text-xs mt-1.5 font-semibold">
            All unique guests registered through room check-ins. Deduplicated by primary mobile number.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-450 bg-slate-100 px-3 py-1.5 rounded-xl">
            {guests.length} Guest{guests.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => loadGuests(true)}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name or mobile number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 pl-10 pr-10 py-2.5 rounded-xl text-xs font-semibold outline-none transition-all placeholder-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Guest Grid */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        </div>
      ) : guests.length === 0 ? (
        <div className="text-center py-24 space-y-3 border border-dashed border-slate-200 rounded-3xl bg-slate-50/40">
          <Users className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="text-sm font-extrabold text-slate-500">
            {searchQuery ? "No guests match your search" : "No guests yet"}
          </h3>
          <p className="text-[10px] text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
            {searchQuery
              ? "Try a different name or mobile number."
              : "Guests are automatically added when you check in a room. Each unique mobile number creates one guest profile."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {guests.map((guest) => (
              <button
                key={guest.id}
                type="button"
                onClick={() => setSelectedGuest(guest)}
                className="bg-white border border-slate-100 hover:border-blue-200 hover:shadow-md p-5 rounded-2xl shadow-sm text-left transition-all group active:scale-[0.99] space-y-4"
              >
                {/* Avatar + name row */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                    {isFemale(guest) ? <FemaleAvatar /> : <MaleAvatar />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-extrabold text-slate-900 truncate">{guest.name}</h3>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                      isFemale(guest) ? "text-pink-600 bg-pink-50" : "text-blue-600 bg-blue-50"
                    }`}>
                      {guest.gender || "Male"}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 ml-auto shrink-0 transition-colors" />
                </div>

                {/* Contact details */}
                <div className="space-y-1.5 text-[10px] font-semibold text-slate-500">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{guest.phone}</span>
                  </div>
                  {guest.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{guest.email}</span>
                    </div>
                  )}
                </div>

                {/* Footer stays row */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[9.5px] font-bold">
                  <div className="flex items-center gap-1.5 text-slate-450">
                    <BedDouble className="w-3.5 h-3.5" />
                    <span>
                      {guest.totalStays || 1} Stay{(guest.totalStays || 1) !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {guest.lastRoom && (
                    <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded-lg">
                      Last: Room {guest.lastRoom}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => loadGuests(false)}
                className="px-6 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-colors"
              >
                Load More Guests
              </button>
            </div>
          )}
        </>
      )}

      {/* Guest Detail Slide Panel */}
      {selectedGuest && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedGuest(null)}
          />

          {/* Side Panel */}
          <div className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col h-full z-10 overflow-y-auto">

            {/* Panel Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                  {isFemale(selectedGuest) ? <FemaleAvatar /> : <MaleAvatar />}
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">{selectedGuest.name}</h2>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    isFemale(selectedGuest) ? "text-pink-600 bg-pink-50" : "text-blue-600 bg-blue-50"
                  }`}>
                    {selectedGuest.gender || "Male"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedGuest(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="p-6 space-y-6 flex-1">

              {/* Stay Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-2xl text-center">
                  <BedDouble className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <span className="text-lg font-black text-blue-700">{selectedGuest.totalStays || 1}</span>
                  <p className="text-[9px] text-blue-500 font-bold uppercase tracking-wide">Total Stays</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl text-center">
                  <Calendar className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                  <span className="text-[10px] font-black text-slate-700 block">{formatDate(selectedGuest.lastCheckIn)}</span>
                  <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wide">Last Stay</p>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-1">
                <h4 className="text-[9px] text-slate-450 font-black uppercase tracking-widest border-b border-slate-100 pb-2">Contact Details</h4>
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Primary Mobile</span>
                      <span className="font-extrabold text-slate-900">{selectedGuest.phone}</span>
                    </div>
                  </div>
                  {selectedGuest.phone2 && (
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Secondary Mobile</span>
                        <span className="font-extrabold text-slate-900">{selectedGuest.phone2}</span>
                      </div>
                    </div>
                  )}
                  {selectedGuest.email && (
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Email</span>
                        <span className="font-extrabold text-slate-900 break-all">{selectedGuest.email}</span>
                      </div>
                    </div>
                  )}
                  {selectedGuest.address && (
                    <div className="flex items-start gap-3 text-xs font-semibold text-slate-700">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block uppercase">Address</span>
                        <span className="font-bold text-slate-800 leading-relaxed">{selectedGuest.address}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ID Proof */}
              {(selectedGuest.idProofType || selectedGuest.idProofNumber) && (
                <div className="space-y-1">
                  <h4 className="text-[9px] text-slate-450 font-black uppercase tracking-widest border-b border-slate-100 pb-2">Identity Verification</h4>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <div className="text-xs">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">
                        {selectedGuest.idProofType || "ID Proof"}
                      </span>
                      <span className="font-extrabold text-slate-900">{selectedGuest.idProofNumber || "—"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Last Room */}
              {selectedGuest.lastRoom && (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
                  <BedDouble className="w-5 h-5 text-slate-500 shrink-0" />
                  <div>
                    <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wide block">Last Stayed In</span>
                    <span className="text-sm font-extrabold text-slate-900">Room {selectedGuest.lastRoom}</span>
                    <span className="text-[10px] text-slate-450 font-medium block">{formatDate(selectedGuest.lastCheckIn)}</span>
                  </div>
                </div>
              )}

              {/* Registered since */}
              <div className="text-[9.5px] text-slate-400 font-bold text-center pt-2 border-t border-slate-100">
                Guest profile created: {formatDate(selectedGuest.createdAt)}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
