"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { roomService } from "@/services/room.service";
import { Room, RoomStatus } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Key, ChevronDown, User, Clock, 
  Trash2, X, ShieldAlert, Loader2, Paintbrush, 
  Wrench, Layers, CreditCard, Compass, Check, BedDouble, 
  Hotel, Users, Phone, Mail, Edit3, Save, Calendar
} from "lucide-react";

// Date formatting helper
function formatDateTime(dateTimeStr: string | null | undefined): string {
  if (!dateTimeStr) return "";
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? "0" + minutes : minutes;
    return `${month} ${day}, ${year} ${hours}:${minStr} ${ampm}`;
  } catch {
    return dateTimeStr;
  }
}

export default function RoomsPage() {
  const selectedBusinessId = useAppStore((state) => state.selectedBusinessId) || "";

  const [rooms, setRooms] = useState<Room[]>([]);
  const [floors, setFloors] = useState<number[]>([]);
  const [roomTypes, setRoomTypes] = useState<{ name: string; price: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals Visibility
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState<Room | null>(null);
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState<Room | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<Room | null>(null);

  // Add Floor State
  const [newFloorNumber, setNewFloorNumber] = useState<number>(1);
  const [submittingFloor, setSubmittingFloor] = useState(false);

  // Add Room Type State
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypePrice, setNewTypePrice] = useState<number>(1500);
  const [editingTypeOldName, setEditingTypeOldName] = useState<string | null>(null);
  const [submittingType, setSubmittingType] = useState(false);

  // Add Room State
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [selectedType, setSelectedType] = useState("");
  const [submittingRoom, setSubmittingRoom] = useState(false);

  // Edit Room State
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editRoomFloor, setEditRoomFloor] = useState<number>(1);
  const [editRoomType, setEditRoomType] = useState("");
  const [editRoomPrice, setEditRoomPrice] = useState<number>(1500);
  const [submittingEditRoom, setSubmittingEditRoom] = useState(false);

  // Check In Wizard State
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [headName, setHeadName] = useState("");
  const [headGender, setHeadGender] = useState("Male");
  const [headGovIdType, setHeadGovIdType] = useState("Aadhaar Card");
  const [headGovIdNumber, setHeadGovIdNumber] = useState("");
  const [headAddress, setHeadAddress] = useState("");
  const [guestPhone1, setGuestPhone1] = useState("");
  const [guestPhone2, setGuestPhone2] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [additionalMembers, setAdditionalMembers] = useState<any[]>([]);
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

  // Refresh catalogs
  const loadLists = async () => {
    if (!selectedBusinessId) return;
    try {
      const fetchedFloors = await roomService.getFloors(selectedBusinessId);
      setFloors(fetchedFloors);
      
      const fetchedTypes = await roomService.getRoomTypes(selectedBusinessId);
      setRoomTypes(fetchedTypes);

      if (fetchedFloors.length > 0) {
        setSelectedFloor(fetchedFloors[0]);
      }
      if (fetchedTypes.length > 0) {
        setSelectedType(fetchedTypes[0].name);
      }
    } catch (err) {
      console.error("Failed to load catalog lists:", err);
    }
  };

  useEffect(() => {
    if (!selectedBusinessId) return;

    loadLists();
    setLoading(true);

    const unsubscribe = roomService.subscribeRooms(selectedBusinessId, (updatedRooms) => {
      setRooms(updatedRooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedBusinessId]);

  // Quick Clean action toggle
  const handleQuickStatusChange = async (roomId: string, newStatus: RoomStatus) => {
    try {
      await roomService.updateRoomStatus(selectedBusinessId, roomId, newStatus);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Add Floor Submit
  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newFloorNumber <= 0) return;
    setSubmittingFloor(true);
    try {
      await roomService.addFloor(selectedBusinessId, newFloorNumber);
      await loadLists();
      setNewFloorNumber(prev => prev + 1);
    } catch (err) {
      console.error("Floor creation failed:", err);
    } finally {
      setSubmittingFloor(false);
    }
  };

  // Delete Floor Submit
  const handleDeleteFloor = async (fNum: number) => {
    if (!confirm(`Are you sure you want to delete Floor ${fNum}?`)) return;
    try {
      await roomService.deleteFloor(selectedBusinessId, fNum);
      await loadLists();
    } catch (err) {
      console.error("Floor deletion failed:", err);
    }
  };

  // Add / Edit Room Type Submit
  const handleAddOrEditType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim() || newTypePrice <= 0) return;
    setSubmittingType(true);
    try {
      if (editingTypeOldName) {
        // Edit Mode
        await roomService.editRoomType(selectedBusinessId, editingTypeOldName, newTypeName.trim(), newTypePrice);
        setEditingTypeOldName(null);
      } else {
        // Add Mode
        await roomService.addRoomType(selectedBusinessId, newTypeName.trim(), newTypePrice);
      }
      await loadLists();
      setNewTypeName("");
      setNewTypePrice(1500);
    } catch (err) {
      console.error("Room type database action failed:", err);
    } finally {
      setSubmittingType(false);
    }
  };

  // Delete Room Type
  const handleDeleteType = async (tName: string) => {
    if (!confirm(`Are you sure you want to delete "${tName}" room type?`)) return;
    try {
      await roomService.deleteRoomType(selectedBusinessId, tName);
      await loadLists();
    } catch (err) {
      console.error("Room type deletion failed:", err);
    }
  };

  // Add Room Submit
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNumber.trim() || !selectedType) return;
    setSubmittingRoom(true);
    try {
      const typeObj = roomTypes.find((t) => t.name === selectedType);
      const price = typeObj ? typeObj.price : 1500;

      await roomService.createRoom(selectedBusinessId, {
        roomNumber: newRoomNumber.trim(),
        floor: Number(selectedFloor),
        type: selectedType,
        pricePerNight: price,
        status: "available"
      });
      setShowAddRoomModal(false);
      setNewRoomNumber("");
    } catch (err) {
      console.error("Room creation failed:", err);
    } finally {
      setSubmittingRoom(false);
    }
  };

  // Edit Room Modal trigger
  const handleEditRoomTrigger = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    setShowEditRoomModal(room);
    setEditRoomNumber(room.roomNumber);
    setEditRoomFloor(room.floor);
    setEditRoomType(room.type);
    setEditRoomPrice(room.pricePerNight);
  };

  // Edit Room Submit
  const handleEditRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditRoomModal || !editRoomNumber.trim()) return;
    setSubmittingEditRoom(true);
    try {
      await roomService.editRoom(selectedBusinessId, showEditRoomModal.id, {
        roomNumber: editRoomNumber.trim(),
        floor: Number(editRoomFloor),
        type: editRoomType,
        pricePerNight: Number(editRoomPrice)
      });
      setShowEditRoomModal(null);
    } catch (err) {
      console.error("Room edit failed:", err);
    } finally {
      setSubmittingEditRoom(false);
    }
  };

  // Delete Room Trigger
  const handleDeleteRoomTrigger = async (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete Room ${room.roomNumber}?`)) return;
    try {
      await roomService.deleteRoom(selectedBusinessId, room.id, room.status);
    } catch (err) {
      console.error("Room delete failed:", err);
    }
  };

  // Check In Submit
  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCheckInModal || !headName.trim() || !guestPhone1.trim() || !checkInTime || !checkOutTime) {
      alert("Please fill in dates, primary occupant name, and Mobile Number 1.");
      return;
    }

    setSubmittingCheckIn(true);
    try {
      const primaryGuestLog = {
        guestName: headName.trim(),
        checkInTime,
        checkOutTime,
        additionalMembers: [
          {
            name: headName.trim(),
            gender: headGender,
            govIdType: headGovIdType,
            govIdNumber: headGovIdNumber,
            address: headAddress,
            isPrimary: true
          },
          ...additionalMembers.filter(m => m.name.trim() !== "")
        ]
      };

      // In checkInRoom, we also save the phone1, phone2, and email details directly to the room
      await roomService.editRoom(selectedBusinessId, showCheckInModal.id, {
        guestPhone1: guestPhone1.trim(),
        guestPhone2: guestPhone2.trim() ? guestPhone2.trim() : null,
        guestEmail: guestEmail.trim() ? guestEmail.trim() : null,
      });

      await roomService.checkInRoom(selectedBusinessId, showCheckInModal.id, primaryGuestLog);
      
      // Clear inputs
      setHeadName("");
      setGuestPhone1("");
      setGuestPhone2("");
      setGuestEmail("");
      setHeadGovIdNumber("");
      setHeadAddress("");
      setAdditionalMembers([]);
      setShowCheckInModal(null);
    } catch (err) {
      console.error("Check-in failed:", err);
      alert("Failed to check in guest.");
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  // Check Out Submit
  const handleCheckOut = async (roomId: string) => {
    if (!confirm("Confirm checkout? Room status will transition to cleaning.")) return;
    try {
      // Clear phone and email on checkout
      await roomService.editRoom(selectedBusinessId, roomId, {
        guestPhone1: null,
        guestPhone2: null,
        guestEmail: null
      });

      await roomService.checkOutRoom(selectedBusinessId, roomId);
      setShowDetailModal(null);
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Failed to checkout room.");
    }
  };

  const addMemberField = () => {
    setAdditionalMembers((prev) => [
      ...prev,
      { name: "", gender: "Male", govIdType: "Aadhaar Card", govIdNumber: "", address: "" }
    ]);
  };

  const removeMemberField = (idx: number) => {
    setAdditionalMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateMemberField = (idx: number, field: string, val: string) => {
    setAdditionalMembers((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  // Card Dispatcher
  const handleCardClick = (room: Room) => {
    if (room.status === "available" || room.status === "cleaning") {
      setShowCheckInModal(room);
      // Auto pre-populate current timestamps
      const now = new Date();
      const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setCheckInTime(localNow);

      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const localTomorrow = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setCheckOutTime(localTomorrow);
    } else {
      setShowDetailModal(room);
    }
  };

  // Filters computed
  const filteredRooms = rooms.filter((room) => {
    const matchesFloor = floorFilter === "all" || room.floor === Number(floorFilter);
    const matchesType = typeFilter === "all" || room.type === typeFilter;
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    const matchesSearch = searchQuery.trim() === "" || room.roomNumber.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesFloor && matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      
      {/* 1. HEADER & GLOBAL BUTTONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rooms</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium font-sans">Manage, edit, delete rooms and configure hotel layouts.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddFloorModal(true)}
            className="h-10 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Layers className="w-4 h-4 text-slate-400" /> Manage Floors
          </button>
          
          <button
            onClick={() => setShowAddTypeModal(true)}
            className="h-10 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <CreditCard className="w-4 h-4 text-slate-400" /> Manage Room Types
          </button>
          
          <button
            onClick={() => setShowAddRoomModal(true)}
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" /> Add Room
          </button>
        </div>
      </div>

      {/* 2. FILTER DROPDOWNS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="relative">
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="appearance-none bg-slate-50/50 border border-slate-200 text-xs font-bold text-slate-700 pl-4 pr-9 py-2 rounded-xl focus:border-blue-500 outline-none transition-colors cursor-pointer min-w-[120px]"
            >
              <option value="all">All Floors</option>
              {floors.map((f) => (
                <option key={f} value={f}>Floor {f}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none bg-slate-50/50 border border-slate-200 text-xs font-bold text-slate-700 pl-4 pr-9 py-2 rounded-xl focus:border-blue-500 outline-none transition-colors cursor-pointer min-w-[140px]"
            >
              <option value="all">All Room Types</option>
              {roomTypes.map((t) => (
                <option key={t.name} value={t.name}>{t.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-slate-50/50 border border-slate-200 text-xs font-bold text-slate-700 pl-4 pr-9 py-2 rounded-xl focus:border-blue-500 outline-none transition-colors cursor-pointer min-w-[130px]"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="near-checkout">Near Checkout</option>
              <option value="cleaning">Cleaning</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>

        </div>

        <div className="relative max-w-xs w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by room number..."
            className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 text-slate-900 placeholder-slate-400 pl-10 pr-4 py-2 rounded-xl text-xs transition-colors outline-none font-medium"
          />
        </div>
      </div>

      {/* 3. ROOM CARDS GRID */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <BedDouble className="w-12 h-12 text-slate-350 mx-auto mb-3" />
          <h3 className="font-extrabold text-slate-800 text-sm">No Rooms Created</h3>
          <p className="text-xs text-slate-450 mt-1">Configure layout parameters above to start cataloging rooms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredRooms.map((room) => {
            
            let borderStyle = "border-slate-100 hover:border-slate-200";
            let roomNumColor = "text-slate-850";
            let statusPill = "";
            let footerBlock = null;

            if (room.status === "available") {
              borderStyle = "border-emerald-100 hover:border-emerald-250 bg-emerald-50/5";
              roomNumColor = "text-emerald-600";
              statusPill = "bg-emerald-50 text-emerald-600 border border-emerald-100";
              footerBlock = (
                <div className="flex items-center gap-3.5 p-3.5 bg-emerald-50/40 rounded-xl mt-4">
                  <Key className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <h4 className="text-[10px] font-bold text-emerald-800">Available</h4>
                    <span className="text-[9px] text-emerald-600 block mt-0.5 font-medium">Ready for check-in</span>
                  </div>
                </div>
              );
            } 
            else if (room.status === "occupied") {
              borderStyle = "border-rose-100 hover:border-rose-250 bg-rose-50/5";
              roomNumColor = "text-rose-600";
              statusPill = "bg-rose-50 text-rose-600 border border-rose-100";
              footerBlock = (
                <div className="flex items-center gap-3 p-3 bg-rose-50/40 rounded-xl mt-4">
                  <div className="w-8 h-8 rounded-full bg-rose-100 overflow-hidden border border-rose-200 shrink-0 flex items-center justify-center">
                    <img 
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=128" 
                      alt="Guest avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[10px] font-bold text-rose-800 truncate">{room.guestName || "Guest Occupied"}</h4>
                    <span className="text-[9px] text-rose-600 block mt-0.5 truncate font-medium">
                      Check-in: {room.checkInTime ? room.checkInTime.split("T")[0] : "N/A"}
                    </span>
                  </div>
                </div>
              );
            } 
            else if (room.status === "near-checkout") {
              borderStyle = "border-amber-100 hover:border-amber-250 bg-amber-50/5";
              roomNumColor = "text-amber-600";
              statusPill = "bg-amber-50 text-amber-600 border border-amber-100";
              footerBlock = (
                <div className="flex items-center gap-3.5 p-3.5 bg-amber-50/40 rounded-xl mt-4">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <h4 className="text-[10px] font-bold text-amber-800">Check-out Soon</h4>
                    <span className="text-[9px] text-amber-600 block mt-0.5 font-medium">
                      {room.checkOutTime ? room.checkOutTime.split("T")[0] : "Today"}
                    </span>
                  </div>
                </div>
              );
            } 
            else if (room.status === "cleaning") {
              borderStyle = "border-blue-150 hover:border-blue-250 bg-blue-50/5";
              roomNumColor = "text-blue-600";
              statusPill = "bg-blue-50 text-blue-600 border border-blue-100";
              footerBlock = (
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex items-center gap-3.5 p-3.5 bg-blue-50/40 rounded-xl">
                    <Paintbrush className="w-5 h-5 text-blue-500 shrink-0" />
                    <div>
                      <h4 className="text-[10px] font-bold text-blue-800">Under Cleaning</h4>
                      <span className="text-[9px] text-blue-600 block mt-0.5 font-medium font-sans">Please wait</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickStatusChange(room.id, "available");
                    }}
                    className="w-full h-8 bg-blue-650 hover:bg-blue-700 text-white font-bold rounded-lg text-[9px] uppercase tracking-wide transition-colors"
                  >
                    Clean Complete
                  </button>
                </div>
              );
            } 
            else if (room.status === "maintenance") {
              borderStyle = "border-slate-200 hover:border-slate-300 bg-slate-50/5";
              roomNumColor = "text-slate-600";
              statusPill = "bg-slate-100 text-slate-600 border border-slate-200";
              footerBlock = (
                <div className="flex items-center gap-3.5 p-3.5 bg-slate-100/60 rounded-xl mt-4">
                  <Wrench className="w-5 h-5 text-slate-500 shrink-0" />
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-800">Maintenance</h4>
                    <span className="text-[9px] text-slate-600 block mt-0.5 font-medium">Not available</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={room.id}
                onClick={() => handleCardClick(room)}
                className={`bg-white border rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-all flex flex-col justify-between relative group ${borderStyle}`}
              >
                
                {/* Float Card Controls (Edit / Delete Room Icons) */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => handleEditRoomTrigger(e, room)}
                    className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 rounded-lg shadow-sm transition-all"
                    title="Edit Room"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteRoomTrigger(e, room)}
                    className="p-1.5 bg-white border border-slate-200 text-slate-550 hover:text-rose-600 hover:border-rose-200 rounded-lg shadow-sm transition-all"
                    title="Delete Room"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <div className="flex justify-between items-center pr-16">
                    <span className={`text-2.5xl font-extrabold ${roomNumColor}`}>{room.roomNumber}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-1">
                    <BedDouble className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{room.type} (Floor {room.floor})</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-[10px] text-slate-400 font-bold">
                      ₹{room.pricePerNight.toLocaleString()} <span className="font-medium text-[9px]">/ night</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${statusPill}`}>
                      {room.status === "near-checkout" ? "Soon Out" : room.status}
                    </span>
                  </div>
                </div>

                {footerBlock}

              </div>
            );
          })}
        </div>
      )}

      {/* Edit Room Modal */}
      <AnimatePresence>
        {showEditRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditRoomModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white border border-slate-150 p-6 rounded-2xl shadow-2xl relative z-10 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <Edit3 className="w-5 h-5 text-blue-650" /> Edit Room {showEditRoomModal.roomNumber}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Modify workspace identifier details</p>
                </div>
                <button onClick={() => setShowEditRoomModal(null)} className="text-slate-400 hover:text-slate-650">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditRoomSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Room Number</label>
                  <input
                    type="text"
                    required
                    value={editRoomNumber}
                    onChange={(e) => setEditRoomNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Floor Selection</label>
                  <div className="relative">
                    <select
                      value={editRoomFloor}
                      onChange={(e) => setEditRoomFloor(Number(e.target.value))}
                      className="w-full appearance-none bg-white border border-slate-200 focus:border-blue-500 text-slate-900 px-3.5 py-2 rounded-lg text-sm transition-all outline-none cursor-pointer"
                    >
                      {floors.map((f) => (
                        <option key={f} value={f}>Floor {f}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Room Type Category</label>
                  <div className="relative">
                    <select
                      value={editRoomType}
                      onChange={(e) => {
                        setEditRoomType(e.target.value);
                        const typeObj = roomTypes.find(t => t.name === e.target.value);
                        if (typeObj) setEditRoomPrice(typeObj.price);
                      }}
                      className="w-full appearance-none bg-white border border-slate-200 focus:border-blue-500 text-slate-900 px-3.5 py-2 rounded-lg text-sm transition-all outline-none cursor-pointer"
                    >
                      {roomTypes.map((t) => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Price per Night Override (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editRoomPrice}
                    onChange={(e) => setEditRoomPrice(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditRoomModal(null)}
                    className="w-1/2 h-10 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-lg text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEditRoom}
                    className="w-1/2 h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-all"
                  >
                    {submittingEditRoom ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Room Modal */}
      <AnimatePresence>
        {showAddRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddRoomModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white border border-slate-150 p-6 rounded-2xl shadow-2xl relative z-10 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <Hotel className="w-5 h-5 text-blue-650" /> Add Room
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Link a room number to floor and type catalogs</p>
                </div>
                <button onClick={() => setShowAddRoomModal(false)} className="text-slate-400 hover:text-slate-650">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {floors.length === 0 || roomTypes.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-100 text-amber-600 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                  <span>Configure Floors and Room Types first!</span>
                </div>
              ) : (
                <form onSubmit={handleAddRoom} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Room Number</label>
                    <input
                      type="text"
                      required
                      value={newRoomNumber}
                      onChange={(e) => setNewRoomNumber(e.target.value)}
                      placeholder="e.g. 101"
                      className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 px-3.5 py-2 rounded-lg text-sm transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Floor Selection</label>
                    <div className="relative">
                      <select
                        value={selectedFloor}
                        onChange={(e) => setSelectedFloor(Number(e.target.value))}
                        className="w-full appearance-none bg-white border border-slate-200 focus:border-blue-500 text-slate-900 px-3.5 py-2 rounded-lg text-sm transition-all outline-none cursor-pointer"
                      >
                        {floors.map((f) => (
                          <option key={f} value={f}>Floor {f}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Room Type Category</label>
                    <div className="relative">
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-200 focus:border-blue-500 text-slate-900 px-3.5 py-2 rounded-lg text-sm transition-all outline-none cursor-pointer"
                      >
                        {roomTypes.map((t) => (
                          <option key={t.name} value={t.name}>{t.name} (₹{t.price.toLocaleString()})</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddRoomModal(false)}
                      className="w-1/2 h-10 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-lg text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingRoom}
                      className="w-1/2 h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-all"
                    >
                      {submittingRoom ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Room"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Floors Modal (With Adding, Listing, and Deleting) */}
      <AnimatePresence>
        {showAddFloorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddFloorModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white border border-slate-150 p-6 rounded-2xl shadow-2xl relative z-10 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-5 h-5 text-blue-650" /> Manage Floors
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Add or remove floors within the hotel workspace</p>
                </div>
                <button onClick={() => setShowAddFloorModal(false)} className="text-slate-400 hover:text-slate-650">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grid: Top Add Form / Bottom List */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                
                {/* Form to Add Floor */}
                <form onSubmit={handleAddFloor} className="md:col-span-5 space-y-3 bg-slate-50/50 p-4 border border-slate-150 rounded-xl flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Floor Number</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newFloorNumber}
                      onChange={(e) => setNewFloorNumber(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 px-3 py-1.5 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingFloor}
                    className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors mt-2"
                  >
                    {submittingFloor ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Floor"}
                  </button>
                </form>

                {/* List of Floors */}
                <div className="md:col-span-7 space-y-2.5">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Existing Floors</h3>
                  {floors.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">No floors defined.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-xl p-2.5">
                      {floors.map((fNum) => (
                        <div key={fNum} className="flex justify-between items-center py-1.5 px-2.5 bg-slate-50/50 rounded-lg border border-slate-100 hover:border-slate-200">
                          <span className="text-xs font-bold text-slate-800">Floor {fNum}</span>
                          <button
                            onClick={() => handleDeleteFloor(fNum)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete Floor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddFloorModal(false)}
                  className="h-9 px-4 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold rounded-lg text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Room Types Modal (With Adding, Listing, Editing, and Deleting) */}
      <AnimatePresence>
        {showAddTypeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddTypeModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white border border-slate-150 p-6 rounded-2xl shadow-2xl relative z-10 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-5 h-5 text-blue-650" /> Manage Room Types
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Configure room pricing parameters and tags</p>
                </div>
                <button onClick={() => setShowAddTypeModal(false)} className="text-slate-400 hover:text-slate-650">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                
                {/* Form to Add / Edit Type */}
                <form onSubmit={handleAddOrEditType} className="md:col-span-5 space-y-3.5 bg-slate-50/50 p-4 border border-slate-150 rounded-xl">
                  <span className="text-[9px] uppercase font-black tracking-wider text-blue-600">
                    {editingTypeOldName ? "✏️ Edit Mode" : "✨ Create New Type"}
                  </span>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Type Name</label>
                    <input
                      type="text"
                      required
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder="e.g. Deluxe Room"
                      className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 px-3 py-1.5 rounded-lg text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newTypePrice}
                      onChange={(e) => setNewTypePrice(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 px-3 py-1.5 rounded-lg text-xs outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    {editingTypeOldName && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTypeOldName(null);
                          setNewTypeName("");
                          setNewTypePrice(1500);
                        }}
                        className="w-1/2 h-8 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold rounded-lg text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={submittingType}
                      className={`h-8 font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors ${
                        editingTypeOldName ? "w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white" : "w-full bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {submittingType ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingTypeOldName ? "Update" : "Save Type"}
                    </button>
                  </div>
                </form>

                {/* List of Types */}
                <div className="md:col-span-7 space-y-2.5">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Existing Room Types</h3>
                  {roomTypes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">No categories configured.</p>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded-xl p-2.5">
                      {roomTypes.map((type) => (
                        <div key={type.name} className="flex justify-between items-center py-2 px-3 bg-slate-50/50 rounded-lg border border-slate-100 hover:border-slate-250">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">{type.name}</span>
                            <span className="text-[10px] text-slate-450 font-semibold mt-0.5 block">Price: ₹{type.price.toLocaleString()}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingTypeOldName(type.name);
                                setNewTypeName(type.name);
                                setNewTypePrice(type.price);
                              }}
                              className="p-1.5 text-slate-450 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Type"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteType(type.name)}
                              className="p-1.5 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete Type"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(false)}
                  className="h-9 px-4 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold rounded-lg text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN CHECK-IN MODAL */}
      <AnimatePresence>
        {showCheckInModal && (
          <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col h-screen overflow-y-auto">
            
            {/* Header Navbar */}
            <div className="h-16 bg-white border-b border-slate-200/80 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-550 text-white flex items-center justify-center font-bold">
                  <Compass className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                    Guest Check-In Wizard — Room {showCheckInModal.roomNumber}
                  </h2>
                  <p className="text-[10px] text-slate-450 mt-0.5">
                    {showCheckInModal.type} • Floor {showCheckInModal.floor} • Overnight Rate: ₹{showCheckInModal.pricePerNight.toLocaleString()}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowCheckInModal(null)}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-450 hover:text-slate-650 hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleCheckInSubmit} className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Guest Primary Info & Schedule */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Section A: Dates */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Calendar className="w-4 h-4 text-blue-600" /> Schedule Dates
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Check-in Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 py-2 rounded-xl text-xs outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Check-out Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 py-2 rounded-xl text-xs outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Contact & Personal Details */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <User className="w-4 h-4 text-blue-600" /> Primary Member Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Occupant Name</label>
                      <input
                        type="text"
                        required
                        value={headName}
                        onChange={(e) => setHeadName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 py-2 rounded-xl text-xs outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Gender</label>
                      <div className="relative">
                        <select
                          value={headGender}
                          onChange={(e) => setHeadGender(e.target.value)}
                          className="w-full appearance-none bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* 2 Mobile Numbers & Optional Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile Number 1 *
                      </label>
                      <input
                        type="tel"
                        required
                        value={guestPhone1}
                        onChange={(e) => setGuestPhone1(e.target.value)}
                        placeholder="Primary Mobile"
                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 py-2 rounded-xl text-xs outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile Number 2
                      </label>
                      <input
                        type="tel"
                        value={guestPhone2}
                        onChange={(e) => setGuestPhone2(e.target.value)}
                        placeholder="Alternative Mobile"
                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 py-2 rounded-xl text-xs outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> Mail ID (Optional)
                      </label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="name@gmail.com"
                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 py-2 rounded-xl text-xs outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Government ID Type</label>
                      <div className="relative">
                        <select
                          value={headGovIdType}
                          onChange={(e) => setHeadGovIdType(e.target.value)}
                          className="w-full appearance-none bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
                        >
                          <option value="Aadhaar Card">Aadhaar Card</option>
                          <option value="PAN Card">PAN Card</option>
                          <option value="Voter ID">Voter ID</option>
                          <option value="Passport">Passport</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Selected Number Input</label>
                      <input
                        type="text"
                        required
                        value={headGovIdNumber}
                        onChange={(e) => setHeadGovIdNumber(e.target.value)}
                        placeholder="ID number string"
                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 py-2 rounded-xl text-xs outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Home/Contact Address</label>
                    <textarea
                      rows={2}
                      value={headAddress}
                      onChange={(e) => setHeadAddress(e.target.value)}
                      placeholder="Street, City, State, ZIP Code"
                      className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3.5 py-2.5 rounded-xl text-xs outline-none transition-all resize-none"
                    />
                  </div>
                </div>

              </div>

              {/* Right Column: Additional Members Panel */}
              <div className="lg:col-span-5 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                      <Users className="w-4.5 h-4.5 text-blue-600" /> Additional Members
                    </h3>
                    <button
                      type="button"
                      onClick={addMemberField}
                      className="h-8 px-3 border border-slate-200 hover:bg-slate-50 text-[10px] font-bold rounded-lg text-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-400" /> Add Member
                    </button>
                  </div>

                  {additionalMembers.length === 0 ? (
                    <div className="text-center py-14 text-slate-400 space-y-1 bg-slate-50/50 rounded-xl p-4 border border-dashed border-slate-200">
                      <Users className="w-8 h-8 mx-auto text-slate-350" />
                      <p className="text-[10px] font-bold">Only 1 Primary Guest Guest</p>
                      <p className="text-[9px] text-slate-400 leading-normal">Click Add Member above to register other occupants sharing Room {showCheckInModal.roomNumber}.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                      {additionalMembers.map((member, idx) => (
                        <div key={idx} className="bg-slate-50/50 p-4 border border-slate-200 rounded-xl space-y-3 relative">
                          <button
                            type="button"
                            onClick={() => removeMemberField(idx)}
                            className="absolute top-3.5 right-3.5 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <span className="text-[9px] uppercase font-black text-blue-600 tracking-wider">Member #{idx + 1}</span>

                          <div className="grid grid-cols-2 gap-3.5">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-450 uppercase">Name</label>
                              <input
                                type="text"
                                required
                                value={member.name}
                                onChange={(e) => updateMemberField(idx, "name", e.target.value)}
                                className="w-full bg-white border border-slate-250 text-xs px-2.5 py-1.5 rounded-lg outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-450 uppercase">Gender</label>
                              <select
                                value={member.gender}
                                onChange={(e) => updateMemberField(idx, "gender", e.target.value)}
                                className="w-full bg-white border border-slate-250 text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
                              >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3.5">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-450 uppercase">Gov ID Type</label>
                              <select
                                value={member.govIdType}
                                onChange={(e) => updateMemberField(idx, "govIdType", e.target.value)}
                                className="w-full bg-white border border-slate-250 text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
                              >
                                <option value="Aadhaar Card">Aadhaar Card</option>
                                <option value="PAN Card">PAN Card</option>
                                <option value="Voter ID">Voter ID</option>
                                <option value="Passport">Passport</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-450 uppercase">ID Number</label>
                              <input
                                type="text"
                                required
                                value={member.govIdNumber}
                                onChange={(e) => updateMemberField(idx, "govIdNumber", e.target.value)}
                                className="w-full bg-white border border-slate-250 text-xs px-2.5 py-1.5 rounded-lg outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-450 uppercase">Home Address</label>
                            <input
                              type="text"
                              required
                              value={member.address}
                              onChange={(e) => updateMemberField(idx, "address", e.target.value)}
                              className="w-full bg-white border border-slate-250 text-xs px-2.5 py-1.5 rounded-lg outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sticky Action Footer */}
                <div className="flex gap-4 border-t border-slate-100 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCheckInModal(null)}
                    className="w-1/2 h-10 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCheckIn}
                    className="w-1/2 h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all shadow-md active:scale-[0.99]"
                  >
                    {submittingCheckIn ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Check-In"}
                  </button>
                </div>

              </div>

            </form>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN CHECKOUT / DETAIL MODAL */}
      <AnimatePresence>
        {showDetailModal && (
          <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col h-screen overflow-y-auto">
            
            {/* Header Navbar */}
            <div className="h-16 bg-white border-b border-slate-200/80 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-550 text-white flex items-center justify-center font-bold">
                  <Hotel className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                    Active Room Occupancy Details — Room {showDetailModal.roomNumber}
                  </h2>
                  <p className="text-[10px] text-slate-450 mt-0.5">
                    {showDetailModal.type} • Floor {showDetailModal.floor} • Overnight Rate: ₹{showDetailModal.pricePerNight.toLocaleString()}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowDetailModal(null)}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-450 hover:text-slate-650 hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split panel details view */}
            <div className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Timestamps & Contact Details */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Stay dates schedule widget */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Clock className="w-4 h-4 text-blue-600" /> Active Schedule
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                    <div className="p-3 bg-slate-50/50 border border-slate-150 rounded-xl space-y-1.5">
                      <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wide">Check-in Registered:</span>
                      <span className="text-slate-800 font-extrabold text-sm">{formatDateTime(showDetailModal.checkInTime) || "N/A"}</span>
                    </div>

                    <div className="p-3 bg-slate-50/50 border border-slate-150 rounded-xl space-y-1.5">
                      <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wide">Check-out Target:</span>
                      <span className="text-slate-800 font-extrabold text-sm">{formatDateTime(showDetailModal.checkOutTime) || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Primary guest card */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2.5 font-sans">
                    <User className="w-4 h-4 text-blue-600" /> Primary Member Contact Card
                  </h3>

                  <div className="space-y-4 text-xs font-semibold text-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100 pb-3.5">
                      <div>
                        <span className="text-[9px] text-slate-450 block uppercase tracking-wide">Guest Name</span>
                        <span className="text-slate-900 font-extrabold text-base">{showDetailModal.guestName || "Unrecorded Guest"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-450 block uppercase tracking-wide">Room Category & Base Rate</span>
                        <span className="text-slate-800 font-bold text-sm block mt-0.5">
                          {showDetailModal.type} (₹{showDetailModal.pricePerNight.toLocaleString()} / night)
                        </span>
                      </div>
                    </div>

                    {/* Phones and Email Display */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100 pb-3.5">
                      <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <Phone className="w-4 h-4 text-slate-450 shrink-0" />
                        <div>
                          <span className="text-[8px] text-slate-450 block uppercase tracking-wide leading-none">Phone 1</span>
                          <span className="text-slate-850 font-extrabold block mt-0.5">{showDetailModal.guestPhone1 || "Missing"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <Phone className="w-4 h-4 text-slate-450 shrink-0" />
                        <div>
                          <span className="text-[8px] text-slate-450 block uppercase tracking-wide leading-none">Phone 2</span>
                          <span className="text-slate-850 font-extrabold block mt-0.5">{showDetailModal.guestPhone2 || "—"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <Mail className="w-4 h-4 text-slate-450 shrink-0" />
                        <div>
                          <span className="text-[8px] text-slate-450 block uppercase tracking-wide leading-none">Mail ID</span>
                          <span className="text-slate-850 font-extrabold block mt-0.5 truncate">{showDetailModal.guestEmail || "—"}</span>
                        </div>
                      </div>
                    </div>

                    {/* ID & Address */}
                    {showDetailModal.additionalMembers && showDetailModal.additionalMembers.find(m => m.isPrimary) ? (
                      (() => {
                        const prim = showDetailModal.additionalMembers.find(m => m.isPrimary);
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <span className="text-[9px] text-slate-450 block uppercase tracking-wide">Government ID verification</span>
                              <span className="text-slate-850 font-extrabold block mt-0.5">
                                {prim.govIdType}: {prim.govIdNumber}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-450 block uppercase tracking-wide">Registered Home Address</span>
                              <span className="text-slate-800 font-bold block mt-0.5 leading-relaxed">{prim.address || "—"}</span>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">Extended primary member attributes not stored. Check-out is available.</p>
                    )}
                  </div>

                </div>

              </div>

              {/* Right Column: Additional Members list display */}
              <div className="lg:col-span-5 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-4">
                    <Users className="w-4.5 h-4.5 text-blue-600" /> Registered Occupants List
                  </h3>

                  {showDetailModal.additionalMembers && showDetailModal.additionalMembers.length > 0 ? (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {showDetailModal.additionalMembers.map((m: any, i: number) => (
                        <div key={i} className="p-3.5 border border-slate-150 rounded-xl space-y-1.5 text-xs font-semibold">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-900 font-extrabold">{m.name}</span>
                            <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase ${
                              m.isPrimary ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-650"
                            }`}>
                              {m.isPrimary ? "Primary Guest" : `Member #${i}`}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-1">
                            <span>Gender: {m.gender}</span>
                            <span>ID: {m.govIdType} ({m.govIdNumber})</span>
                          </div>
                          <p className="text-[10px] text-slate-450 leading-relaxed font-medium pt-0.5">Addr: {m.address}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-400 space-y-1 bg-slate-50/50 rounded-xl p-4 border border-slate-150">
                      <Users className="w-8 h-8 mx-auto text-slate-350" />
                      <p className="text-[10px] font-bold">Only 1 Primary Guest Guest</p>
                      <p className="text-[9px] text-slate-400 leading-normal">No additional members were listed under Room {showDetailModal.roomNumber} stay log.</p>
                    </div>
                  )}
                </div>

                {/* Sticky Action Footer */}
                <div className="flex gap-4 border-t border-slate-100 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowDetailModal(null)}
                    className="w-1/2 h-10 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold rounded-xl text-xs transition-colors"
                  >
                    Close Log
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCheckOut(showDetailModal.id)}
                    className="w-1/2 h-10 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-rose-600/10 active:scale-[0.99]"
                  >
                    Check Out Room
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
