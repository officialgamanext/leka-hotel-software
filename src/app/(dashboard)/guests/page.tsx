"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { guestService } from "@/services/guest.service";
import { Guest } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Plus, Search, ChevronRight, ChevronLeft, 
  Loader2, Mail, Phone, Shield, Calendar, Trash2, X
} from "lucide-react";

export default function GuestsPage() {
  const selectedBusinessId = useAppStore((state) => state.selectedBusinessId) || "";

  // Data state
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination
  const [pageSize] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<Record<number, any>>({ 1: null });

  // Creation State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idProofType, setIdProofType] = useState("Passport");
  const [idProofNumber, setIdProofNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedBusinessId) return;
    loadGuests();
  }, [selectedBusinessId, currentPage, searchQuery]);

  const loadGuests = async () => {
    setLoading(true);
    try {
      const cursor = cursors[currentPage] || null;
      const result = await guestService.getGuests(
        selectedBusinessId,
        pageSize,
        searchQuery,
        cursor
      );

      setGuests(result.guests);

      // Store next page cursor
      if (result.lastVisibleDoc !== null) {
        setCursors((prev) => ({
          ...prev,
          [currentPage + 1]: result.lastVisibleDoc,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (cursors[currentPage + 1] !== undefined) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
    setCursors({ 1: null });
  };

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    setSubmitting(true);
    try {
      await guestService.createGuest(selectedBusinessId, {
        name,
        email: email || "walkin@guest.com",
        phone,
        idProofType,
        idProofNumber,
      });

      setName("");
      setEmail("");
      setPhone("");
      setIdProofNumber("");
      setShowAddModal(false);
      
      // Reload
      setCurrentPage(1);
      setCursors({ 1: null });
      loadGuests();
    } catch (err) {
      console.error(err);
      alert("Failed to register guest.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Guest Registry</h1>
          <p className="text-slate-400 text-sm mt-1">Directory of hotel occupants, details, and stay histories</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-10 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/15 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4.5 h-4.5" /> New Guest Profile
        </button>
      </div>

      {/* Search panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/40 border border-slate-850 rounded-2xl">
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search guests by name..."
            className="w-full bg-slate-950 border border-slate-850 hover:border-slate-850 focus:border-cyan-500 text-white placeholder-slate-500 pl-10 pr-4 py-2 rounded-lg text-sm transition-all outline-none"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Registered profiles: {guests.length}
        </div>
      </div>

      {/* Guest Cards list */}
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      ) : guests.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 border border-slate-850 rounded-2xl">
          <Users className="w-12 h-12 text-slate-650 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-semibold">No guest profiles found</p>
          <p className="text-xs text-slate-500 mt-1">Add a new guest profile or adjust search queries.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {guests.map((guest) => (
              <div
                key={guest.id}
                className="bg-slate-900/40 border border-slate-850 hover:border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm uppercase">
                      {guest.name.substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white truncate max-w-[150px]" title={guest.name}>{guest.name}</h3>
                      <span className="text-[10px] text-slate-550 block font-mono">ID: {guest.id.substring(0, 8)}</span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 border-t border-slate-850/50 pt-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate" title={guest.email}>{guest.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{guest.phone}</span>
                    </div>
                    {guest.idProofType && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Shield className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">
                          {guest.idProofType} ({guest.idProofNumber || "N/A"})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-850/50 text-[10px] text-slate-550">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Reg: {guest.createdAt.split("T")[0]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-4 pt-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 border border-slate-800 bg-slate-950/40 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs text-slate-450 font-bold">
              Page {currentPage}
            </span>
            <button
              onClick={handleNextPage}
              disabled={guests.length < pageSize}
              className="p-2 border border-slate-800 bg-slate-950/40 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Add Guest Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative z-10 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-white">Create Guest Profile</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Register guest information in the master record</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGuest} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-350 uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Robert Smith"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white placeholder-slate-650 px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-350 uppercase">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 882-1920"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white placeholder-slate-650 px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-350 uppercase">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="robert.smith@gmail.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white placeholder-slate-650 px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-350 uppercase">Proof Document</label>
                    <select
                      value={idProofType}
                      onChange={(e) => setIdProofType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white px-3.5 py-2 rounded-lg text-sm transition-all outline-none cursor-pointer"
                    >
                      <option value="Passport">Passport</option>
                      <option value="Driver License">Driver License</option>
                      <option value="National ID">National ID</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-350 uppercase">Document Number</label>
                    <input
                      type="text"
                      value={idProofNumber}
                      onChange={(e) => setIdProofNumber(e.target.value)}
                      placeholder="e.g. PP88301"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white placeholder-slate-650 px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-1/2 h-10 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-1/2 h-10 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile"}
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
