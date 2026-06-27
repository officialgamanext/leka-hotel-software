"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { roomService } from "@/services/room.service";
import { Room, RoomStatus } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BedDouble, Plus, Filter, CheckCircle2, AlertTriangle, 
  Wrench, ShieldCheck, Loader2, RefreshCcw, LayoutGrid
} from "lucide-react";

export default function RoomsPage() {
  const selectedBusinessId = useAppStore((state) => state.selectedBusinessId) || "";
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [floorFilter, setFloorFilter] = useState<string>("all");
  
  // Add Room Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomType, setNewRoomType] = useState("Standard Double");
  const [newRoomFloor, setNewRoomFloor] = useState(1);
  const [newRoomPrice, setNewRoomPrice] = useState(149);
  const [submitting, setSubmitting] = useState(false);

  // 1. Subscribe to real-time room updates (onSnapshot)
  useEffect(() => {
    if (!selectedBusinessId) return;

    setLoading(true);
    const unsubscribe = roomService.subscribeRooms(selectedBusinessId, (updatedRooms) => {
      setRooms(updatedRooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedBusinessId]);

  // Handle status update (e.g. housekeeping cleans the room)
  const handleStatusChange = async (roomId: string, status: RoomStatus) => {
    try {
      await roomService.updateRoomStatus(selectedBusinessId, roomId, status);
    } catch (err) {
      console.error("Failed to update room status:", err);
      alert("Error updating room status.");
    }
  };

  // Handle create new room
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim()) return;

    setSubmitting(true);
    try {
      await roomService.createRoom(selectedBusinessId, {
        roomNumber: newRoomNumber.trim(),
        type: newRoomType,
        floor: Number(newRoomFloor),
        pricePerNight: Number(newRoomPrice),
        status: "available",
      });
      setNewRoomNumber("");
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to add room:", err);
      alert("Error adding room.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter computations
  const filteredRooms = rooms.filter((room) => {
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    const matchesFloor = floorFilter === "all" || room.floor === Number(floorFilter);
    return matchesStatus && matchesFloor;
  });

  // Extract unique floors
  const floors = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);

  const statusThemes: Record<RoomStatus, { bg: string; text: string; border: string; glow: string; icon: any }> = {
    available: { 
      bg: "bg-cyan-500/10", 
      text: "text-cyan-400", 
      border: "border-cyan-500/20 hover:border-cyan-500/40", 
      glow: "bg-cyan-500/50",
      icon: CheckCircle2 
    },
    occupied: { 
      bg: "bg-indigo-500/10", 
      text: "text-indigo-400", 
      border: "border-indigo-500/20 hover:border-indigo-500/40", 
      glow: "bg-indigo-500/50",
      icon: BedDouble 
    },
    dirty: { 
      bg: "bg-amber-500/10", 
      text: "text-amber-400", 
      border: "border-amber-500/20 hover:border-amber-500/40", 
      glow: "bg-amber-500/50",
      icon: AlertTriangle 
    },
    maintenance: { 
      bg: "bg-rose-500/10", 
      text: "text-rose-400", 
      border: "border-rose-500/20 hover:border-rose-500/40", 
      glow: "bg-rose-500/50",
      icon: Wrench 
    },
  };

  return (
    <div className="space-y-6">
      {/* Header operations */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Room Controller</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time status monitoring and room grid dispatcher</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="h-10 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 rounded-lg text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/15 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4.5 h-4.5" /> Add Room
        </button>
      </div>

      {/* Filter panel */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/40 border border-slate-850 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wide">
            <Filter className="w-3.5 h-3.5" /> Filter by:
          </div>
          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:border-cyan-500 outline-none transition-all cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="dirty">Dirty</option>
            <option value="maintenance">Maintenance</option>
          </select>

          {/* Floor selector */}
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:border-cyan-500 outline-none transition-all cursor-pointer"
          >
            <option value="all">All Floors</option>
            {floors.map((floor) => (
              <option key={floor} value={floor}>Floor {floor}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredRooms.length} of {rooms.length} rooms
        </div>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 border border-slate-850 rounded-2xl">
          <BedDouble className="w-12 h-12 text-slate-650 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-semibold">No matching rooms found</p>
          <p className="text-xs text-slate-500 mt-1">Adjust your filters or add a new room to begin.</p>
        </div>
      ) : (
        <motion.div 
          layout 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          {filteredRooms.map((room) => {
            const themeProps = statusThemes[room.status];
            const StatusIcon = themeProps.icon;
            
            return (
              <motion.div
                layout
                key={room.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 bg-slate-900/40 border rounded-2xl relative overflow-hidden group shadow-lg flex flex-col justify-between transition-all ${themeProps.border}`}
              >
                {/* Tiny glowing indicator */}
                <div className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-bl-xl ${themeProps.glow}`} />

                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-lg font-bold text-white tracking-tight">Room {room.roomNumber}</span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Fl. {room.floor}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{room.type}</p>
                </div>

                <div className="mt-6">
                  {/* Price */}
                  <span className="text-xs text-slate-400 font-bold block mb-3">
                    ${room.pricePerNight} <span className="font-normal text-[10px] text-slate-500">/ night</span>
                  </span>

                  {/* Actions Dropdown / Quick buttons */}
                  <div className="flex flex-col gap-1.5 border-t border-slate-850/80 pt-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${themeProps.text}`}>
                      <StatusIcon className="w-3.5 h-3.5" /> {room.status}
                    </span>

                    {/* Quick cleaner toggle (Dirty -> Available) or Service controls */}
                    <div className="hidden group-hover:flex items-center gap-1.5 mt-2 transition-all">
                      {room.status === "dirty" && (
                        <button
                          onClick={() => handleStatusChange(room.id, "available")}
                          className="w-full bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 text-[10px] font-bold py-1 px-2 rounded border border-cyan-500/20 transition-all uppercase"
                        >
                          Mark Clean
                        </button>
                      )}
                      {room.status === "available" && (
                        <button
                          onClick={() => handleStatusChange(room.id, "maintenance")}
                          className="w-full bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 text-[10px] font-bold py-1 px-2 rounded transition-all uppercase"
                        >
                          Service Hold
                        </button>
                      )}
                      {room.status === "maintenance" && (
                        <button
                          onClick={() => handleStatusChange(room.id, "available")}
                          className="w-full bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 text-[10px] font-bold py-1 px-2 rounded border border-emerald-500/20 transition-all uppercase"
                        >
                          Release Hold
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Add Room Modal Popup */}
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
              <div>
                <h2 className="text-lg font-bold text-white">Register New Room</h2>
                <p className="text-xs text-slate-400 mt-0.5">Initialize a room record inside the hotel catalogue</p>
              </div>

              <form onSubmit={handleAddRoom} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-350 uppercase tracking-wide">Room Number</label>
                    <input
                      type="text"
                      required
                      value={newRoomNumber}
                      onChange={(e) => setNewRoomNumber(e.target.value)}
                      placeholder="e.g. 305"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white placeholder-slate-650 px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-350 uppercase tracking-wide">Floor</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newRoomFloor}
                      onChange={(e) => setNewRoomFloor(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-350 uppercase tracking-wide">Room Category</label>
                  <select
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white px-3.5 py-2 rounded-lg text-sm transition-all outline-none cursor-pointer"
                  >
                    <option value="Standard Single">Standard Single</option>
                    <option value="Standard Double">Standard Double</option>
                    <option value="Deluxe Room">Deluxe Room</option>
                    <option value="Deluxe Suite">Deluxe Suite</option>
                    <option value="Executive Suite">Executive Suite</option>
                    <option value="Penthouse Suite">Penthouse Suite</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-350 uppercase tracking-wide">Price per Night ($)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newRoomPrice}
                    onChange={(e) => setNewRoomPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-white px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-3">
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
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Room"}
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
