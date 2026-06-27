"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { bookingService } from "@/services/booking.service";
import { roomService } from "@/services/room.service";
import { guestService } from "@/services/guest.service";
import { Booking, BookingStatus, Room } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CalendarDays, Plus, Search, ChevronRight, ChevronLeft, 
  Check, ArrowRight, UserPlus, Loader2, Sparkles, X, Filter
} from "lucide-react";

export default function BookingsPage() {
  const selectedBusinessId = useAppStore((state) => state.selectedBusinessId) || "";

  // Data State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filters
  const [statusFilter, setStatusFilter] = useState<BookingStatus | undefined>(undefined);
  const [pageSize] = useState(6); // Set small for visual pagination testing
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<Record<number, any>>({ 1: null });

  // Booking Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guestsCount, setGuestsCount] = useState(1);
  const [totalPrice, setTotalPrice] = useState(150);
  const [submitting, setSubmitting] = useState(false);

  // Available Rooms for booking dropdown
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

  // Fetch Bookings with Pagination
  useEffect(() => {
    if (!selectedBusinessId) return;
    loadBookings();
  }, [selectedBusinessId, currentPage, statusFilter]);

  // Load available rooms when opening add modal
  useEffect(() => {
    if (!selectedBusinessId || !showAddModal) return;
    async function loadRooms() {
      const list = await roomService.getRooms(selectedBusinessId);
      setAvailableRooms(list.filter((r) => r.status === "available"));
    }
    loadRooms();
  }, [selectedBusinessId, showAddModal]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const cursor = cursors[currentPage] || null;
      const result = await bookingService.getBookingsPaginated(
        selectedBusinessId,
        pageSize,
        cursor,
        statusFilter
      );
      
      setBookings(result.bookings);
      
      // Store cursor for next page if available
      if (result.lastVisibleDoc !== null) {
        setCursors((prev) => ({
          ...prev,
          [currentPage + 1]: result.lastVisibleDoc,
        }));
      }
    } catch (err) {
      console.error("Error loading bookings:", err);
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

  const handleFilterChange = (status: string) => {
    setStatusFilter(status === "all" ? undefined : (status as BookingStatus));
    setCurrentPage(1);
    setCursors({ 1: null });
  };

  const handleStatusChange = async (bookingId: string, status: BookingStatus) => {
    try {
      await bookingService.updateBookingStatus(selectedBusinessId, bookingId, status);
      // Reload current page
      loadBookings();
    } catch (err) {
      console.error(err);
      alert("Failed to update booking status.");
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !selectedRoomId || !checkInDate || !checkOutDate) return;

    setSubmitting(true);
    try {
      // Find room details
      const room = availableRooms.find((r) => r.id === selectedRoomId);
      if (!room) throw new Error("Selected room is invalid.");

      // 1. Check if guest already exists or register them in directory
      const newGuest = await guestService.createGuest(selectedBusinessId, {
        name: guestName,
        email: guestEmail || "walkin@guest.com",
        phone: guestPhone || "+1 (555) 000-0000",
      });

      // 2. Save booking
      await bookingService.createBooking(selectedBusinessId, {
        guestId: newGuest.id,
        guestName: newGuest.name,
        guestPhone: newGuest.phone,
        roomId: room.id,
        roomNumber: room.roomNumber,
        roomType: room.type,
        checkInDate,
        checkOutDate,
        status: "confirmed",
        numberOfGuests: Number(guestsCount),
        totalPrice: Number(totalPrice),
      });

      // Clean inputs
      setGuestName("");
      setGuestPhone("");
      setGuestEmail("");
      setSelectedRoomId("");
      setCheckInDate("");
      setCheckOutDate("");
      setShowAddModal(false);
      
      // Reload first page
      setCurrentPage(1);
      setCursors({ 1: null });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors: Record<BookingStatus, string> = {
    pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    confirmed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    "checked-in": "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    "checked-out": "text-slate-450 bg-slate-900 border-slate-800",
    cancelled: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Bookings Log</h1>
          <p className="text-slate-400 text-sm mt-1">Manage guest check-ins, registrations, and scheduler</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-10 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/15 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4.5 h-4.5" /> Book Room
        </button>
      </div>

      {/* Filter panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/40 border border-slate-850 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-450 font-bold uppercase tracking-wide">
            <Filter className="w-3.5 h-3.5" /> Status:
          </div>
          {["all", "confirmed", "checked-in", "checked-out", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                (status === "all" && !statusFilter) || statusFilter === status
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                  : "bg-slate-950/40 text-slate-400 border border-slate-850 hover:border-slate-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Booking List Cards */}
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 border border-slate-850 rounded-2xl">
          <CalendarDays className="w-12 h-12 text-slate-650 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-semibold">No bookings registered</p>
          <p className="text-xs text-slate-500 mt-1">Try changing status filter or book a room to start.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-slate-900/30 border border-slate-850 hover:border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg hover:shadow-xl transition-all"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white text-base">{booking.guestName}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{booking.guestPhone}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${statusColors[booking.status]}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-850/50">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Room Allocation</span>
                      <p className="text-xs font-semibold text-slate-200 mt-0.5">
                        Room {booking.roomNumber} <span className="font-normal text-slate-450 text-[10px]">({booking.roomType})</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Stay Schedule</span>
                      <p className="text-xs font-semibold text-slate-200 mt-0.5">
                        {booking.checkInDate} to {booking.checkOutDate}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-850/50">
                  <span className="text-xs font-bold text-white">
                    Total: ${booking.totalPrice}
                  </span>

                  {/* Actions based on booking state */}
                  <div className="flex items-center gap-2">
                    {booking.status === "confirmed" && (
                      <button
                        onClick={() => handleStatusChange(booking.id, "checked-in")}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold py-1.5 px-3 rounded-lg shadow transition-colors"
                      >
                        Check-In
                      </button>
                    )}
                    {booking.status === "checked-in" && (
                      <button
                        onClick={() => handleStatusChange(booking.id, "checked-out")}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold py-1.5 px-3 rounded-lg shadow transition-colors"
                      >
                        Check-Out
                      </button>
                    )}
                    {(booking.status === "confirmed" || booking.status === "pending") && (
                      <button
                        onClick={() => handleStatusChange(booking.id, "cancelled")}
                        className="text-rose-400 hover:bg-rose-500/10 text-xs font-semibold py-1.5 px-2.5 rounded-lg transition-colors border border-transparent hover:border-rose-500/10"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Simple Pagination Buttons */}
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
              disabled={bookings.length < pageSize}
              className="p-2 border border-slate-800 bg-slate-950/40 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Book Room Modal */}
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
              className="w-full max-w-lg bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative z-10 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-white">Create Booking Workspace</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Assign an available room to a guest profile</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBooking} className="space-y-4">
                
                {/* Guest Details */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4" /> Guest Information
                  </h3>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-350 uppercase">Full Name</label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white placeholder-slate-650 px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-350 uppercase">Phone Number</label>
                      <input
                        type="text"
                        required
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="+1 (555) 012-3456"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white placeholder-slate-650 px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-350 uppercase">Email Address</label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="john.doe@gmail.com"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white placeholder-slate-650 px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Stay Details */}
                <div className="space-y-3.5 border-t border-slate-850 pt-4">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" /> Room & Schedule
                  </h3>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-350 uppercase">Select Available Room</label>
                    <select
                      required
                      value={selectedRoomId}
                      onChange={(e) => {
                        const rId = e.target.value;
                        setSelectedRoomId(rId);
                        const rm = availableRooms.find((r) => r.id === rId);
                        if (rm) setTotalPrice(rm.pricePerNight * 2); // Default to 2 nights estimation
                      }}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white px-3.5 py-2 rounded-lg text-sm transition-all outline-none cursor-pointer"
                    >
                      <option value="">-- Choose a clean room --</option>
                      {availableRooms.map((rm) => (
                        <option key={rm.id} value={rm.id}>
                          Room {rm.roomNumber} - {rm.type} (${rm.pricePerNight}/night)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-350 uppercase">Check-In Date</label>
                      <input
                        type="date"
                        required
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-350 uppercase">Check-Out Date</label>
                      <input
                        type="date"
                        required
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-350 uppercase">Number of Guests</label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        required
                        value={guestsCount}
                        onChange={(e) => setGuestsCount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-350 uppercase">Estimated Total Cost ($)</label>
                      <input
                        type="number"
                        required
                        value={totalPrice}
                        onChange={(e) => setTotalPrice(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Submits */}
                <div className="flex gap-3 pt-4 border-t border-slate-850">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="w-1/2 h-10 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedRoomId}
                    className="w-1/2 h-10 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Reservation"}
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
