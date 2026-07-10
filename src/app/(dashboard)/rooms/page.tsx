"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { roomService } from "@/services/room.service";
import { reportService } from "@/services/report.service";
import { guestService } from "@/services/guest.service";
import { businessService } from "@/services/business.service";
import { Room, RoomStatus, Business, Guest } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Key, ChevronDown, User, Clock, 
  Trash2, X, ShieldAlert, Loader2, Paintbrush, 
  Wrench, Layers, CreditCard, Compass, Check, BedDouble, 
  Hotel, Users, Phone, Mail, Edit3, Save, Calendar, Sparkles, Download
} from "lucide-react";
import { CustomDropdown } from "@/components/ui/dropdown";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";

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

function getQrCodeUrl(businessId: string, roomNum: string): string {
  if (typeof window === "undefined") return "";
  const scanUrl = `${window.location.origin}/raise-request?hotelId=${businessId}&roomNumber=${roomNum}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(scanUrl)}`;
}

function downloadSingleQr(roomNumber: string, businessId: string, qrCodeUrl?: string | null) {
  if (typeof window === "undefined") return;
  const scanUrl = `${window.location.origin}/raise-request?hotelId=${businessId}&roomNumber=${roomNumber}`;
  const qrUrl = qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(scanUrl)}`;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = qrUrl;
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 340;
    canvas.height = 410;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background card (White)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header branding & Room identifier
    ctx.fillStyle = "#0f172a"; // Slate-900
    ctx.font = "bold 24px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`ROOM ${roomNumber}`, canvas.width / 2, 45);

    // QR Image draw
    ctx.drawImage(img, 20, 70, 300, 300);

    // Footer instruction
    ctx.fillStyle = "#64748b"; // Slate-500
    ctx.font = "bold 10px Arial, Helvetica, sans-serif";
    ctx.fillText("Scan to Raise Guest Service Request", canvas.width / 2, 390);

    // Download trigger link
    const link = document.createElement("a");
    link.download = `Room_${roomNumber}_QR.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
}

const MaleAvatar = () => (
  <svg viewBox="0 0 128 128" className="w-full h-full text-blue-600 rounded-full" fill="currentColor">
    <circle cx="64" cy="64" r="64" fill="#dbeafe" />
    <path d="M64 74a17 17 0 1 0 0-34 17 17 0 0 0 0 34z" fill="#1e3a8a" />
    <path d="M102 110a4 4 0 0 0-3.6-2.2C89.5 98.4 77.2 92 64 92s-25.5 6.4-34.4 15.8a4 4 0 0 0-3.6 2.2c-.4.8-.1 1.8.6 2.3A62.8 62.8 0 0 0 64 128a62.8 62.8 0 0 0 37.4-15.7c.7-.5 1-1.5.6-2.3z" fill="#1e40af" />
  </svg>
);

const FemaleAvatar = () => (
  <svg viewBox="0 0 128 128" className="w-full h-full text-pink-600 rounded-full" fill="currentColor">
    <circle cx="64" cy="64" r="64" fill="#fce7f3" />
    <path d="M64 74a17 17 0 1 0 0-34 17 17 0 0 0 0 34z" fill="#9d174d" />
    <path d="M64 30c-13.8 0-25 11.2-25 25v12c0 1.7 1.3 3 3 3h44c1.7 0 3-1.3 3-3V55c0-13.8-11.2-25-25-25z" fill="#831843" opacity="0.15" />
    <path d="M102 110a4 4 0 0 0-3.6-2.2C89.5 98.4 77.2 92 64 92s-25.5 6.4-34.4 15.8a4 4 0 0 0-3.6 2.2c-.4.8-.1 1.8.6 2.3A62.8 62.8 0 0 0 64 128a62.8 62.8 0 0 0 37.4-15.7c.7-.5 1-1.5.6-2.3z" fill="#db2777" />
  </svg>
);

// Helper to compute room status on a specific target date
function getRoomStatusOnDate(room: Room, selectedDateStr: string): {
  status: RoomStatus;
  guestName?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  additionalMembers?: any[] | null;
  guestGender?: string | null;
  guestPhone1?: string | null;
  guestPhone2?: string | null;
  guestEmail?: string | null;
  gstNumber?: string | null;
} {
  if (!room.checkInTime) {
    return {
      status: room.status,
      guestName: room.guestName,
      checkInTime: room.checkInTime,
      checkOutTime: room.checkOutTime,
      additionalMembers: room.additionalMembers,
      guestGender: room.guestGender,
      guestPhone1: room.guestPhone1,
      guestPhone2: room.guestPhone2,
      guestEmail: room.guestEmail,
      gstNumber: room.gstNumber,
    };
  }

  const targetDate = new Date(selectedDateStr);
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  const checkIn = new Date(room.checkInTime);
  const checkOut = room.checkOutTime ? new Date(room.checkOutTime) : null;

  const overlaps = checkIn <= dayEnd && (!checkOut || checkOut >= dayStart);

  if (overlaps) {
    const isCheckoutDay = checkOut && checkOut >= dayStart && checkOut <= dayEnd;
    return {
      status: isCheckoutDay ? "near-checkout" : "occupied",
      guestName: room.guestName,
      checkInTime: room.checkInTime,
      checkOutTime: room.checkOutTime,
      additionalMembers: room.additionalMembers,
      guestGender: room.guestGender,
      guestPhone1: room.guestPhone1,
      guestPhone2: room.guestPhone2,
      guestEmail: room.guestEmail,
      gstNumber: room.gstNumber,
    };
  } else {
    const baseStatus = room.status === "maintenance" ? "maintenance" : "available";
    return {
      status: baseStatus,
      guestName: null,
      checkInTime: null,
      checkOutTime: null,
      additionalMembers: null,
      guestGender: null,
      guestPhone1: null,
      guestPhone2: null,
      guestEmail: null,
      gstNumber: null,
    };
  }
}

export default function RoomsPage() {
  const selectedBusinessId = useAppStore((state) => state.selectedBusinessId) || "";
  const toast = useToast();
  const confirm = useConfirm();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [customPricePerNight, setCustomPricePerNight] = useState<number | "">("");
  const [floors, setFloors] = useState<number[]>([]);
  const [roomTypes, setRoomTypes] = useState<{ name: string; price: number }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Checkout Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Card" | "">("");

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [floorFilter, typeFilter, statusFilter, searchQuery]);

  // Modals Visibility
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState<Room | null>(null);
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState<Room | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<Room | null>(null);
  const [viewQrRoom, setViewQrRoom] = useState<Room | null>(null);

  // Reset payment method and custom price when details modal is shown
  useEffect(() => {
    setPaymentMethod("");
    if (showDetailModal) {
      setCustomPricePerNight(showDetailModal.pricePerNight);
    } else {
      setCustomPricePerNight("");
    }
  }, [showDetailModal]);

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
  const [submittingCheckOut, setSubmittingCheckOut] = useState(false);

  // New States
  const [gstNumber, setGstNumber] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [grouping, setGrouping] = useState<"none" | "floor" | "type">("none");
  const [guestList, setGuestList] = useState<Guest[]>([]);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const [updatingRoomId, setUpdatingRoomId] = useState<string | null>(null);

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

  const downloadAllQrs = () => {
    if (filteredRooms.length === 0) return;
    filteredRooms.forEach((rm, index) => {
      setTimeout(() => {
        downloadSingleQr(rm.roomNumber, selectedBusinessId, rm.qrCodeUrl);
      }, index * 200);
    });
  };

  useEffect(() => {
    if (!selectedBusinessId) return;

    loadLists();
    setLoading(true);

    const fetchBusiness = async () => {
      try {
        const biz = await businessService.getBusiness(selectedBusinessId);
        setBusiness(biz);
      } catch (err) {
        console.error("Failed to load business details:", err);
      }
    };
    fetchBusiness();

    const unsubscribe = roomService.subscribeRooms(selectedBusinessId, (updatedRooms) => {
      setRooms(updatedRooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedBusinessId]);

  useEffect(() => {
    if (showCheckInModal && selectedBusinessId) {
      guestService.getGuests(selectedBusinessId, 200).then((res) => {
        setGuestList(res.guests || []);
      }).catch(err => console.error("Failed to load guests for autocomplete:", err));
    } else {
      setGuestList([]);
    }
  }, [showCheckInModal, selectedBusinessId]);

  // Quick Clean action toggle
  const handleQuickStatusChange = async (roomId: string, newStatus: RoomStatus) => {
    setUpdatingRoomId(roomId);
    try {
      await roomService.updateRoomStatus(selectedBusinessId, roomId, newStatus);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingRoomId(null);
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
      toast.success(`Floor ${newFloorNumber} added successfully!`);
      setNewFloorNumber(prev => prev + 1);
    } catch (err) {
      console.error("Floor creation failed:", err);
      toast.error("Failed to add floor.");
    } finally {
      setSubmittingFloor(false);
    }
  };

  // Delete Floor Submit
  const handleDeleteFloor = async (fNum: number) => {
    if (!await confirm({
      title: "Delete Floor",
      message: `Are you sure you want to delete Floor ${fNum}? All rooms on this floor will be deleted.`,
      variant: "danger"
    })) return;
    try {
      await roomService.deleteFloor(selectedBusinessId, fNum);
      await loadLists();
      toast.success(`Floor ${fNum} deleted successfully!`);
    } catch (err) {
      console.error("Floor deletion failed:", err);
      toast.error("Failed to delete floor.");
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
        toast.success("Room type updated successfully!");
      } else {
        // Add Mode
        await roomService.addRoomType(selectedBusinessId, newTypeName.trim(), newTypePrice);
        toast.success("Room type added successfully!");
      }
      await loadLists();
      setNewTypeName("");
      setNewTypePrice(1500);
    } catch (err) {
      console.error("Room type database action failed:", err);
      toast.error("Failed to save room type.");
    } finally {
      setSubmittingType(false);
    }
  };

  // Delete Room Type
  const handleDeleteType = async (tName: string) => {
    if (!await confirm({
      title: "Delete Room Type",
      message: `Are you sure you want to delete "${tName}" room type?`,
      variant: "danger"
    })) return;
    try {
      await roomService.deleteRoomType(selectedBusinessId, tName);
      await loadLists();
      toast.success("Room type deleted successfully!");
    } catch (err) {
      console.error("Room type deletion failed:", err);
      toast.error("Failed to delete room type.");
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
      toast.success(`Room ${newRoomNumber} created successfully!`);
    } catch (err) {
      console.error("Room creation failed:", err);
      toast.error("Failed to create room.");
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
      toast.success(`Room ${editRoomNumber} updated successfully!`);
    } catch (err) {
      console.error("Room edit failed:", err);
      toast.error("Failed to update room.");
    } finally {
      setSubmittingEditRoom(false);
    }
  };

  // Delete Room Trigger
  const handleDeleteRoomTrigger = async (e: React.MouseEvent, room: Room) => {
    e.stopPropagation();
    if (!await confirm({
      title: "Delete Room",
      message: `Are you sure you want to delete Room ${room.roomNumber}? This cannot be undone.`,
      variant: "danger"
    })) return;
    try {
      await roomService.deleteRoom(selectedBusinessId, room.id, room.status);
      toast.success(`Room ${room.roomNumber} deleted successfully!`);
    } catch (err) {
      console.error("Room delete failed:", err);
      toast.error("Failed to delete room.");
    }
  };

  // Check In Submit
  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCheckInModal || !headName.trim() || !guestPhone1.trim() || !checkInTime || !checkOutTime) {
      toast.warning("Please fill in dates, primary occupant name, and Mobile Number 1.");
      return;
    }

    setSubmittingCheckIn(true);
    try {
      const primaryGuestLog = {
        guestName: headName.trim(),
        checkInTime,
        checkOutTime,
        gstNumber: gstNumber.trim() ? gstNumber.trim() : null,
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
        guestGender: headGender,
        gstNumber: gstNumber.trim() ? gstNumber.trim() : null,
      });

      await roomService.checkInRoom(selectedBusinessId, showCheckInModal.id, primaryGuestLog);

      // Auto-save/update guest record keyed by primary mobile number
      await guestService.upsertGuest(selectedBusinessId, {
        name: headName.trim(),
        phone: guestPhone1.trim(),
        phone2: guestPhone2.trim() || null,
        email: guestEmail.trim() || null,
        gender: headGender,
        idProofType: headGovIdType || null,
        idProofNumber: headGovIdNumber.trim() || null,
        address: headAddress.trim() || null,
        lastRoom: showCheckInModal.roomNumber,
        lastCheckIn: checkInTime,
        gstNumber: gstNumber.trim() || null,
      });
      
      toast.success(`Guest ${headName} checked in to Room ${showCheckInModal.roomNumber}!`);

      // Clear inputs
      setHeadName("");
      setGuestPhone1("");
      setGuestPhone2("");
      setGuestEmail("");
      setHeadGovIdNumber("");
      setHeadAddress("");
      setGstNumber("");
      setAdditionalMembers([]);
      setShowCheckInModal(null);
    } catch (err) {
      console.error("Check-in failed:", err);
      toast.error("Failed to check in guest.");
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  // Check Out Submit
  const handleCheckOut = async (room: Room, ratePerNight: number, method: string) => {
    const checkInDate = new Date(room.checkInTime || new Date());
    const checkOutDate = new Date();
    const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const roomCost = ratePerNight * nights;

    const gstEnabled = business?.settings?.gstEnabled ?? false;
    const gstRate = business?.settings?.gstRate ?? 0;
    const gstAmount = gstEnabled ? Math.round(roomCost * (gstRate / 100) * 100) / 100 : 0;
    const totalWithGst = roomCost + gstAmount;

    if (!await confirm({
      title: "Confirm Check-Out",
      message: `Confirm check-out for Room ${room.roomNumber}? Total Amount: ₹${totalWithGst.toLocaleString()} via ${method}`,
      variant: "info",
      confirmText: "Check Out"
    })) return;
    setSubmittingCheckOut(true);
    try {
      const checkOutDateStr = new Date().toISOString().split("T")[0];

      const items = [
        {
          description: `${room.type} (Room ${room.roomNumber}) Stay - ${nights} Nights`,
          amount: ratePerNight,
          quantity: nights
        }
      ];

      // Compile and write invoice record to Firebase
      await reportService.createInvoice(selectedBusinessId, {
        bookingId: `checkout-${room.id}-${Date.now()}`,
        guestId: room.guestId || `guest-${Date.now()}`,
        guestName: room.guestName || "Walk-in Guest",
        invoiceDate: checkOutDateStr,
        items,
        status: "paid",
        roomId: room.id,
        roomNumber: room.roomNumber,
        paymentMethod: method
      });

      // Clear guest details on checkout
      await roomService.editRoom(selectedBusinessId, room.id, {
        guestPhone1: null,
        guestPhone2: null,
        guestEmail: null,
        guestGender: null,
        gstNumber: null
      });

      // Transition room back to available immediately
      await roomService.checkOutRoom(selectedBusinessId, room.id);
      
      toast.success(`Room ${room.roomNumber} checkout complete! Invoice saved.`);

      // Close details modal
      setShowDetailModal(null);
    } catch (err) {
      console.error("Checkout failed:", err);
      toast.error("Failed to checkout room.");
    } finally {
      setSubmittingCheckOut(false);
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
      // Auto pre-populate current timestamps based on selectedDate
      const now = new Date();
      const filterDate = new Date(selectedDate);
      filterDate.setHours(now.getHours(), now.getMinutes());
      
      const localNow = new Date(filterDate.getTime() - filterDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setCheckInTime(localNow);

      const tomorrow = new Date(filterDate.getTime() + 24 * 60 * 60 * 1000);
      const localTomorrow = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setCheckOutTime(localTomorrow);
    } else {
      setShowDetailModal(room);
    }
  };

  // Map rooms to their computed status for the selected date
  const roomsOnDate = rooms.map((room) => {
    const stateOnDate = getRoomStatusOnDate(room, selectedDate);
    return {
      ...room,
      ...stateOnDate,
    };
  });

  // Filters computed
  const filteredRooms = roomsOnDate.filter((room) => {
    const matchesFloor = floorFilter === "all" || room.floor === Number(floorFilter);
    const matchesType = typeFilter === "all" || room.type === typeFilter;
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    const matchesSearch = searchQuery.trim() === "" || room.roomNumber.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesFloor && matchesType && matchesStatus && matchesSearch;
  });

  // Helper to render room cards
  const renderRoomCard = (room: Room) => {
    let borderStyle = "";
    let cardBg = "";
    let roomNumColor = "";
    let statusPill = "";
    let footerBlock = null;

    const statusLabels: Record<RoomStatus, string> = {
      available: "Available",
      occupied: "Occupied",
      "near-checkout": "Near Checkout",
      cleaning: "Cleaning",
      maintenance: "Maintenance"
    };

    if (room.status === "available") {
      borderStyle = "border-[#d1f2e0] hover:border-[#a3e6c2]";
      cardBg = "bg-[#f8fdfa]";
      roomNumColor = "text-[#10b981]";
      statusPill = "bg-[#ecfdf5] text-[#10b981] border border-transparent";
      footerBlock = (
        <div className="flex items-center gap-3 p-3.5 bg-[#e6f7ed] border border-[#d1f2e0]/30 rounded-2xl mt-4">
          <Key className="w-5 h-5 text-[#10b981] shrink-0" />
          <div>
            <h4 className="text-[11px] font-bold text-[#065f46] leading-none">Available</h4>
            <span className="text-[9.5px] text-[#047857] block mt-1 font-medium font-sans">Ready for check-in</span>
          </div>
        </div>
      );
    } 
    else if (room.status === "occupied") {
      borderStyle = "border-[#ffe0e0] hover:border-[#ffc0c0]";
      cardBg = "bg-[#fff8f8]";
      roomNumColor = "text-[#f43f5e]";
      statusPill = "bg-[#fff1f2] text-[#f43f5e] border border-transparent";
      
      const isFemale = room.guestGender === "Female";

      footerBlock = (
        <div className="flex items-center gap-3 p-3 bg-[#ffe4e6] border border-[#ffe0e0]/30 rounded-2xl mt-4 font-sans">
          <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center">
            {isFemale ? <FemaleAvatar /> : <MaleAvatar />}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[11px] font-bold text-[#9f1239] truncate leading-none">{room.guestName || "Guest Occupied"}</h4>
            <span className="text-[9.5px] text-[#be123c] block mt-1 truncate font-medium">
              In: {room.checkInTime ? formatDateTime(room.checkInTime) : "N/A"}
            </span>
            <span className="text-[9.5px] text-[#be123c] block mt-0.5 truncate font-medium">
              Out: {room.checkOutTime ? formatDateTime(room.checkOutTime) : "N/A"}
            </span>
          </div>
        </div>
      );
    } 
    else if (room.status === "near-checkout") {
      borderStyle = "border-[#fef3c7] hover:border-[#fde68a]";
      cardBg = "bg-[#fffbf2]";
      roomNumColor = "text-[#d97706]";
      statusPill = "bg-[#fffbeb] text-[#d97706] border border-transparent";
      footerBlock = (
        <div className="flex items-center gap-3 p-3 bg-[#fef3c7] border border-[#fde68a]/30 rounded-2xl mt-4 font-sans">
          <Clock className="w-5 h-5 text-[#d97706] shrink-0" />
          <div className="min-w-0 flex-1">
            <h4 className="text-[11px] font-bold text-[#92400e] truncate leading-none">{room.guestName || "Guest Occupied"}</h4>
            <span className="text-[9.5px] text-[#b45309] block mt-1 truncate font-medium">
              In: {room.checkInTime ? formatDateTime(room.checkInTime) : "N/A"}
            </span>
            <span className="text-[9.5px] text-[#b45309] block mt-0.5 truncate font-medium">
              Out: {room.checkOutTime ? formatDateTime(room.checkOutTime) : "N/A"}
            </span>
          </div>
        </div>
      );
    } 
    else if (room.status === "cleaning") {
      borderStyle = "border-[#e4dffa] hover:border-[#ccc3f7]";
      cardBg = "bg-[#f1effd]";
      roomNumColor = "text-[#6646e2]";
      statusPill = "bg-[#f1effd] text-[#6646e2] border border-transparent";
      footerBlock = (
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-3 p-3.5 bg-[#e4dffa] border border-[#ccc3f7]/30 rounded-2xl">
            <Paintbrush className="w-5 h-5 text-[#6646e2] shrink-0" />
            <div>
              <h4 className="text-[11px] font-bold text-[#4427a3] leading-none">Under Cleaning</h4>
              <span className="text-[9.5px] text-[#5435c4] block mt-1 font-medium font-sans">Please wait</span>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleQuickStatusChange(room.id, "available");
            }}
            disabled={updatingRoomId === room.id}
            className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[9px] uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-1 disabled:opacity-50"
          >
            {updatingRoomId === room.id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              "Clean Complete"
            )}
          </button>
        </div>
      );
    } 
    else if (room.status === "maintenance") {
      borderStyle = "border-[#e2e8f0] hover:border-[#cbd5e1]";
      cardBg = "bg-[#f8fafc]";
      roomNumColor = "text-[#475569]";
      statusPill = "bg-[#f1f5f9] text-[#475569] border border-transparent";
      footerBlock = (
        <div className="flex items-center gap-3 p-3.5 bg-[#e2e8f0] border border-[#cbd5e1]/30 rounded-2xl mt-4">
          <Wrench className="w-5 h-5 text-[#475569] shrink-0" />
          <div>
            <h4 className="text-[11px] font-bold text-[#334155] leading-none">Maintenance</h4>
            <span className="text-[9.5px] text-[#475569] block mt-1 font-medium font-sans">Not available</span>
          </div>
        </div>
      );
    }

    return (
      <div
        key={room.id}
        onClick={() => handleCardClick(room)}
        className={`border rounded-3xl p-6 shadow-sm cursor-pointer hover:shadow-md transition-all flex flex-col justify-between relative group ${cardBg} ${borderStyle}`}
      >
        
        {/* Float Card Controls (Edit / Delete Room Icons) */}
        <div className="absolute top-5 right-5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={(e) => handleEditRoomTrigger(e, room)}
            className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 rounded-lg shadow-sm transition-all animate-none"
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
            <span className={`text-3xl font-extrabold tracking-tight ${roomNumColor}`}>{room.roomNumber}</span>
            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${statusPill}`}>
              {statusLabels[room.status]}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-450 mt-1.5 font-sans">
            <BedDouble className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{room.type} • ₹{room.pricePerNight.toLocaleString()}</span>
          </div>
        </div>

        {footerBlock}

        {/* QR Code Action Footer */}
        <div className="border-t border-slate-100/70 mt-5 pt-3.5 flex items-center justify-between text-[11px] font-bold text-slate-500">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewQrRoom(room);
            }}
            className="hover:text-blue-650 transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" /> View QR
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadSingleQr(room.roomNumber, selectedBusinessId, room.qrCodeUrl);
            }}
            className="hover:text-blue-650 transition-colors flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" /> Download QR
          </button>
        </div>

      </div>
    );
  };

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
            onClick={downloadAllQrs}
            disabled={filteredRooms.length === 0}
            className="h-10 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-400" /> Download All QR Codes
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
                   <CustomDropdown
            value={floorFilter}
            onChange={setFloorFilter}
            options={[
              { value: "all", label: "All Floors" },
              ...floors.map((f) => ({ value: String(f), label: `Floor ${f}` }))
            ]}
            className="w-[130px]"
            triggerClassName="bg-slate-50/50 border-slate-200"
          />

          <CustomDropdown
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "all", label: "All Room Types" },
              ...roomTypes.map((t) => ({ value: t.name, label: t.name }))
            ]}
            className="w-[150px]"
            triggerClassName="bg-slate-50/50 border-slate-200"
          />

          <CustomDropdown
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all", label: "All Status" },
              { value: "available", label: "Available" },
              { value: "occupied", label: "Occupied" },
              { value: "near-checkout", label: "Near Checkout" },
              { value: "cleaning", label: "Cleaning" },
              { value: "maintenance", label: "Maintenance" }
            ]}
            className="w-[140px]"
            triggerClassName="bg-slate-50/50 border-slate-200"
          />

          {/* Date Filter */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Calendar className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50/50 border border-slate-200 focus:border-blue-500 text-slate-800 pl-9 pr-3 py-2 rounded-xl text-xs outline-none font-bold transition-all cursor-pointer"
            />
          </div>

          {/* Cleaning Quick Filter Button */}
          <button
            type="button"
            onClick={() => {
              setStatusFilter(prev => prev === "cleaning" ? "all" : "cleaning");
            }}
            className={`h-10 px-3.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer select-none ${
              statusFilter === "cleaning"
                ? "bg-purple-50 text-purple-650 border-purple-250 shadow-sm"
                : "bg-white text-slate-650 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Paintbrush className="w-4 h-4 text-purple-500 shrink-0" />
            <span>Cleaning</span>
            {rooms.filter((r) => r.status === "cleaning").length > 0 && (
              <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none min-w-[16px] text-center">
                {rooms.filter((r) => r.status === "cleaning").length}
              </span>
            )}
          </button>

          {/* Grouping Toggle */}
          <div className="flex items-center bg-slate-50 border border-slate-200 p-0.5 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setGrouping("none")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                grouping === "none" ? "bg-white text-blue-600 shadow-sm border border-slate-150/40" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All Grid
            </button>
            <button
              type="button"
              onClick={() => setGrouping("floor")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                grouping === "floor" ? "bg-white text-blue-600 shadow-sm border border-slate-150/40" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Floor Wise
            </button>
            <button
              type="button"
              onClick={() => setGrouping("type")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                grouping === "type" ? "bg-white text-blue-600 shadow-sm border border-slate-150/40" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Type Wise
            </button>
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
        <div className="space-y-6">
          {grouping === "none" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredRooms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((room) => renderRoomCard(room))}
              </div>

              {/* Pagination Footer block */}
              {filteredRooms.length > itemsPerPage && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-slate-100 mt-6">
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-wide">
                    Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredRooms.length)} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredRooms.length)} of {filteredRooms.length} rooms
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors font-bold text-xs"
                    >
                      &lt;
                    </button>

                    {(() => {
                      const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
                      const pages = [];
                      for (let i = 1; i <= totalPages; i++) {
                        if (totalPages <= 5 || i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i)}
                              className={`w-8 h-8 rounded-xl text-xs font-extrabold transition-all ${
                                currentPage === i
                                  ? "bg-blue-600 text-white shadow-md shadow-blue-650/10"
                                  : "border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white"
                              }`}
                            >
                              {i}
                            </button>
                          );
                        } else if (pages[pages.length - 1]?.key !== "ellipsis-" + i) {
                          pages.push(
                            <span key={"ellipsis-" + i} className="px-1 text-xs text-slate-400 font-extrabold select-none">
                              ...
                            </span>
                          );
                        }
                      }
                      return pages;
                    })()}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, Math.ceil(filteredRooms.length / itemsPerPage)))}
                      disabled={currentPage === Math.ceil(filteredRooms.length / itemsPerPage)}
                      className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors font-bold text-xs"
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {grouping === "floor" && (
            <div className="space-y-10">
              {floors.map((floorNum) => {
                const roomsOnFloor = filteredRooms.filter((r) => r.floor === floorNum);
                if (roomsOnFloor.length === 0) return null;
                return (
                  <div key={floorNum} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide shrink-0">
                        Floor {floorNum} <span className="text-[10px] text-slate-450 font-bold font-sans ml-1">({roomsOnFloor.length} Room{roomsOnFloor.length > 1 ? "s" : ""})</span>
                      </h3>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {roomsOnFloor.map((room) => renderRoomCard(room))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {grouping === "type" && (
            <div className="space-y-10">
              {roomTypes.map((typeObj) => {
                const roomsOfType = filteredRooms.filter((r) => r.type === typeObj.name);
                if (roomsOfType.length === 0) return null;
                return (
                  <div key={typeObj.name} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide shrink-0">
                        {typeObj.name} <span className="text-[10px] text-slate-450 font-bold font-sans ml-1">({roomsOfType.length} Room{roomsOfType.length > 1 ? "s" : ""})</span>
                      </h3>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {roomsOfType.map((room) => renderRoomCard(room))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                  <CustomDropdown
                    value={editRoomFloor}
                    onChange={(val) => setEditRoomFloor(Number(val))}
                    options={floors.map((f) => ({ value: f, label: `Floor ${f}` }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Room Type Category</label>
                  <CustomDropdown
                    value={editRoomType}
                    onChange={(val) => {
                      setEditRoomType(val);
                      const typeObj = roomTypes.find(t => t.name === val);
                      if (typeObj) setEditRoomPrice(typeObj.price);
                    }}
                    options={roomTypes.map((t) => ({ value: t.name, label: t.name }))}
                  />
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
                    <CustomDropdown
                      value={selectedFloor}
                      onChange={(val) => setSelectedFloor(Number(val))}
                      options={floors.map((f) => ({ value: f, label: `Floor ${f}` }))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Room Type Category</label>
                    <CustomDropdown
                      value={selectedType}
                      onChange={setSelectedType}
                      options={roomTypes.map((t) => ({ value: t.name, label: `${t.name} (₹${t.price.toLocaleString()})` }))}
                    />
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
            <form onSubmit={handleCheckInSubmit} className="flex-1 max-w-[1440px] w-full mx-auto p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
              
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
                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 py-2 rounded-xl text-xs outline-none transition-all cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Check-out Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 py-2 rounded-xl text-xs outline-none transition-all cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* QR Code Card */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Sparkles className="w-4 h-4 text-blue-600" /> Room QR Code
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {showCheckInModal && (
                      <img 
                        src={showCheckInModal.qrCodeUrl || getQrCodeUrl(selectedBusinessId, showCheckInModal.roomNumber)} 
                        alt={`QR Code for Room ${showCheckInModal.roomNumber}`}
                        className="w-28 h-28 border border-slate-155 rounded-lg p-1 bg-white shrink-0 shadow-sm"
                      />
                    )}
                    <div className="text-xs space-y-1.5 leading-relaxed text-slate-500">
                      <p className="font-bold text-slate-700">Scan to Raise Guest Service Request</p>
                      <p className="text-[11px]">Print this QR code and place it inside Room {showCheckInModal?.roomNumber}. Guests scan this code to raise service or housekeeping requests directly from their mobile phones.</p>
                      {showCheckInModal && (
                        <a 
                          href={`${window.location.origin}/raise-request?hotelId=${selectedBusinessId}&roomNumber=${showCheckInModal.roomNumber}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline font-bold text-[11px] block pt-1"
                        >
                          Open Portal Link &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section B: Contact & Personal Details */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <User className="w-4 h-4 text-blue-600" /> Primary Member Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Occupant Name</label>
                      <input
                        type="text"
                        required
                        value={headName}
                        onChange={(e) => {
                          setHeadName(e.target.value);
                          setShowNameSuggestions(true);
                          setShowPhoneSuggestions(false);
                        }}
                        onFocus={() => {
                          setShowNameSuggestions(true);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowNameSuggestions(false), 200);
                        }}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 py-2 rounded-xl text-xs outline-none transition-all"
                      />

                      {showNameSuggestions && headName.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                          {guestList.filter(g => g.name.toLowerCase().includes(headName.toLowerCase()) || (g.phone || "").includes(headName)).map((guest) => (
                            <button
                              key={guest.id}
                              type="button"
                              onMouseDown={() => {
                                setHeadName(guest.name);
                                setGuestPhone1(guest.phone);
                                if (guest.phone2) setGuestPhone2(guest.phone2);
                                if (guest.email) setGuestEmail(guest.email);
                                if (guest.gender) setHeadGender(guest.gender);
                                if (guest.idProofType) setHeadGovIdType(guest.idProofType);
                                if (guest.idProofNumber) setHeadGovIdNumber(guest.idProofNumber);
                                if (guest.address) setHeadAddress(guest.address);
                                if (guest.gstNumber) setGstNumber(guest.gstNumber);
                                setShowNameSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 flex flex-col gap-0.5 transition-colors cursor-pointer"
                            >
                              <span className="text-xs font-bold text-slate-800">{guest.name}</span>
                              <span className="text-[10px] text-slate-455 font-semibold">{guest.phone} {guest.email ? `• ${guest.email}` : ""}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Gender</label>
                      <CustomDropdown
                        value={headGender}
                        onChange={setHeadGender}
                        options={[
                          { value: "Male", label: "Male" },
                          { value: "Female", label: "Female" },
                          { value: "Other", label: "Other" }
                        ]}
                        triggerClassName="bg-slate-50/50 border-slate-200"
                      />
                    </div>
                  </div>

                  {/* 2 Mobile Numbers & Optional Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile Number 1 *
                      </label>
                      <input
                        type="tel"
                        required
                        value={guestPhone1}
                        onChange={(e) => {
                          setGuestPhone1(e.target.value);
                          setShowPhoneSuggestions(true);
                          setShowNameSuggestions(false);
                        }}
                        onFocus={() => {
                          setShowPhoneSuggestions(true);
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowPhoneSuggestions(false), 200);
                        }}
                        placeholder="Primary Mobile"
                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 py-2 rounded-xl text-xs outline-none transition-all"
                      />

                      {showPhoneSuggestions && guestPhone1.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                          {guestList.filter(g => g.name.toLowerCase().includes(guestPhone1.toLowerCase()) || (g.phone || "").includes(guestPhone1)).map((guest) => (
                            <button
                              key={guest.id}
                              type="button"
                              onMouseDown={() => {
                                setHeadName(guest.name);
                                setGuestPhone1(guest.phone);
                                if (guest.phone2) setGuestPhone2(guest.phone2);
                                if (guest.email) setGuestEmail(guest.email);
                                if (guest.gender) setHeadGender(guest.gender);
                                if (guest.idProofType) setHeadGovIdType(guest.idProofType);
                                if (guest.idProofNumber) setHeadGovIdNumber(guest.idProofNumber);
                                if (guest.address) setHeadAddress(guest.address);
                                if (guest.gstNumber) setGstNumber(guest.gstNumber);
                                setShowPhoneSuggestions(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 flex flex-col gap-0.5 transition-colors cursor-pointer"
                            >
                              <span className="text-xs font-bold text-slate-800">{guest.name}</span>
                              <span className="text-[10px] text-slate-455 font-semibold">{guest.phone} {guest.email ? `• ${guest.email}` : ""}</span>
                            </button>
                          ))}
                        </div>
                      )}
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
                      <CustomDropdown
                        value={headGovIdType}
                        onChange={setHeadGovIdType}
                        options={[
                          { value: "Aadhaar Card", label: "Aadhaar Card" },
                          { value: "PAN Card", label: "PAN Card" },
                          { value: "Voter ID", label: "Voter ID" },
                          { value: "Passport", label: "Passport" }
                        ]}
                        triggerClassName="bg-slate-50/50 border-slate-200"
                      />
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">GST Number (Optional)</label>
                      <input
                        type="text"
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value)}
                        placeholder="e.g. 22AAAAA0000A1Z5"
                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 py-2 rounded-xl text-xs outline-none transition-all"
                      />
                    </div>
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
                              <CustomDropdown
                                value={member.gender}
                                onChange={(val) => updateMemberField(idx, "gender", val)}
                                options={[
                                  { value: "Male", label: "Male" },
                                  { value: "Female", label: "Female" },
                                  { value: "Other", label: "Other" }
                                ]}
                                triggerClassName="border-slate-250 py-1.5 px-2.5 rounded-lg"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3.5">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-450 uppercase">Gov ID Type</label>
                              <CustomDropdown
                                value={member.govIdType}
                                onChange={(val) => updateMemberField(idx, "govIdType", val)}
                                options={[
                                  { value: "Aadhaar Card", label: "Aadhaar Card" },
                                  { value: "PAN Card", label: "PAN Card" },
                                  { value: "Voter ID", label: "Voter ID" },
                                  { value: "Passport", label: "Passport" }
                                ]}
                                triggerClassName="border-slate-250 py-1.5 px-2.5 rounded-lg"
                              />
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
            <div className="flex-1 max-w-[1440px] w-full mx-auto p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
              
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

                {/* QR Code Card */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Sparkles className="w-4 h-4 text-blue-600" /> Room QR Code
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {showDetailModal && (
                      <img 
                        src={showDetailModal.qrCodeUrl || getQrCodeUrl(selectedBusinessId, showDetailModal.roomNumber)} 
                        alt={`QR Code for Room ${showDetailModal.roomNumber}`}
                        className="w-28 h-28 border border-slate-155 rounded-lg p-1 bg-white shrink-0 shadow-sm"
                      />
                    )}
                    <div className="text-xs space-y-1.5 leading-relaxed text-slate-500">
                      <p className="font-bold text-slate-700">Scan to Raise Guest Service Request</p>
                      <p className="text-[11px]">Print this QR code and place it inside Room {showDetailModal?.roomNumber}. Guests scan this code to raise service or housekeeping requests directly from their mobile phones.</p>
                      {showDetailModal && (
                        <a 
                          href={`${window.location.origin}/raise-request?hotelId=${selectedBusinessId}&roomNumber=${showDetailModal.roomNumber}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline font-bold text-[11px] block pt-1"
                        >
                          Open Portal Link &rarr;
                        </a>
                      )}
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
                          {showDetailModal.type} (₹{showDetailModal.pricePerNight.toLocaleString()} / day)
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
                            {showDetailModal.gstNumber && (
                              <div className="sm:col-span-2">
                                <span className="text-[9px] text-slate-450 block uppercase tracking-wide">GST Number</span>
                                <span className="text-slate-850 font-extrabold block mt-0.5">{showDetailModal.gstNumber}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="space-y-3">
                        {showDetailModal.gstNumber && (
                          <div>
                            <span className="text-[9px] text-slate-450 block uppercase tracking-wide">GST Number</span>
                            <span className="text-slate-850 font-extrabold block mt-0.5">{showDetailModal.gstNumber}</span>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 italic">Extended primary member attributes not stored. Check-out is available.</p>
                      </div>
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

                {/* Billing Summary & Payment Selector */}
                {(() => {
                  const checkInDate = new Date(showDetailModal.checkInTime || new Date());
                  const checkOutDate = new Date();
                  const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime());
                  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

                  const activePrice = customPricePerNight !== "" ? Number(customPricePerNight) : showDetailModal.pricePerNight;
                  const roomCost = activePrice * nights;
                  const gstEnabled = business?.settings?.gstEnabled ?? false;
                  const gstRate = business?.settings?.gstRate ?? 0;
                  const gstAmount = gstEnabled ? Math.round(roomCost * (gstRate / 100) * 100) / 100 : 0;
                  const totalCost = roomCost + gstAmount;

                  return (
                    <div className="space-y-4 border-t border-slate-100 pt-4 mt-4">
                      
                      {/* Price Details */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3 shadow-sm">
                        <div className="flex justify-between items-center text-xs text-slate-550 font-semibold">
                          <span>Room Rate per Night (₹):</span>
                          <input
                            type="number"
                            required
                            min={0}
                            value={customPricePerNight}
                            onChange={(e) => setCustomPricePerNight(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-24 bg-white border border-slate-200 focus:border-blue-500 text-slate-900 px-2 py-1 rounded-lg text-xs font-bold text-right outline-none shadow-sm transition-all"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-slate-550 font-semibold pt-1 border-t border-slate-150/40">
                          <span>Room Cost ({nights} Night{nights > 1 ? "s" : ""}):</span>
                          <span className="text-slate-800 font-bold">₹{roomCost.toLocaleString()}</span>
                        </div>
                        {gstEnabled ? (
                          <div className="flex justify-between text-xs text-slate-550 font-semibold">
                            <span>GST ({gstRate}%):</span>
                            <span className="text-slate-800 font-bold">₹{gstAmount.toLocaleString()}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between text-xs text-slate-550 font-semibold">
                            <span>Taxes (Included):</span>
                            <span className="text-slate-800 font-bold">₹0</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm text-slate-800 font-extrabold pt-2 border-t border-slate-200">
                          <span>Total Amount:</span>
                          <span className="text-blue-600 text-base">₹{totalCost.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Payment Method Selector */}
                      <div className="space-y-2">
                        <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Select Payment Mode *</span>
                        <div className="grid grid-cols-3 gap-2">
                          {["Cash", "UPI", "Card"].map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setPaymentMethod(method as any)}
                              className={`h-9 font-bold text-xs rounded-xl border transition-all active:scale-[0.97] ${
                                paymentMethod === method
                                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                                  : "bg-white border-slate-300 text-slate-650 hover:border-blue-400 hover:text-blue-650 hover:bg-blue-50"
                              }`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sticky Action Footer */}
                      <div className="flex gap-4 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowDetailModal(null)}
                          className="w-1/2 h-10 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold rounded-xl text-xs transition-colors"
                        >
                          Close Log
                        </button>
                        <button
                          type="button"
                          disabled={!paymentMethod || submittingCheckOut}
                          onClick={() => handleCheckOut(showDetailModal, activePrice, paymentMethod)}
                          className="w-1/2 h-10 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-rose-600/10 active:scale-[0.99] flex items-center justify-center gap-1.5"
                        >
                          {submittingCheckOut ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Checking Out...</span>
                            </>
                          ) : (
                            <span>Check Out Room</span>
                          )}
                        </button>
                      </div>

                    </div>
                  );
                })()}

              </div>

            </div>

          </div>
        )}
      </AnimatePresence>

      {/* View QR Code Modal */}
      <AnimatePresence>
        {viewQrRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewQrRoom(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white border border-slate-150 p-6 rounded-2xl shadow-2xl relative z-10 space-y-5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5 font-sans">
                    <Sparkles className="w-5 h-5 text-blue-600" /> Room {viewQrRoom.roomNumber} QR Code
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-sans">Guest service scan portal</p>
                </div>
                <button onClick={() => setViewQrRoom(null)} className="text-slate-400 hover:text-slate-650">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <img 
                  src={viewQrRoom.qrCodeUrl || getQrCodeUrl(selectedBusinessId, viewQrRoom.roomNumber)} 
                  alt={`QR Code for Room ${viewQrRoom.roomNumber}`}
                  className="w-48 h-48 border border-slate-150 rounded-xl p-2.5 bg-white shadow-sm"
                />
                <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-3 font-sans">
                  Scan to Raise Service Request
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setViewQrRoom(null)}
                  className="w-1/2 h-10 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-colors font-sans"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => downloadSingleQr(viewQrRoom.roomNumber, selectedBusinessId, viewQrRoom.qrCodeUrl)}
                  className="w-1/2 h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm font-sans"
                >
                  <Download className="w-4 h-4" /> Download QR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
