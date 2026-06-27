import { Business, Staff, Room, Guest, Booking, Invoice, DashboardSummary, HotelSettings } from "@/types";

const MOCK_BUSINESS: Business = {
  id: "demo-hotel-id",
  name: "Leka Hotel",
  ownerUid: "demo-user-id",
  adminName: "Alex Mercer",
  mobileNumber: "+1 (555) 019-9234",
  domain: "leka-hotel.com",
  location: "New York, USA",
  subscriptionStatus: "active",
  subscriptionPlan: "premium",
  subscriptionEndDate: "2026-12-30",
  createdAt: new Date().toISOString(),
  settings: {
    currency: "INR", // Changed to Rupees
    checkInTime: "14:00",
    checkOutTime: "11:00",
    taxRate: 12,
  },
};

const MOCK_BUSINESSES: Business[] = [
  MOCK_BUSINESS,
  {
    id: "demo-resort-id",
    name: "Leka Resort & Spa",
    ownerUid: "demo-user-id",
    adminName: "Alex Mercer",
    mobileNumber: "+1 (555) 014-4921",
    domain: "leka-resort.com",
    location: "Miami, USA",
    subscriptionStatus: "active",
    subscriptionPlan: "premium",
    subscriptionEndDate: "2026-07-15",
    createdAt: new Date().toISOString(),
    settings: { currency: "INR", checkInTime: "14:00", checkOutTime: "11:00", taxRate: 10 }
  },
  {
    id: "demo-grand-id",
    name: "Leka Grand Hotel",
    ownerUid: "demo-user-id",
    adminName: "Alex Mercer",
    mobileNumber: "+1 (555) 017-7392",
    domain: "leka-grand.com",
    location: "Denver, USA",
    subscriptionStatus: "inactive",
    subscriptionPlan: "basic",
    subscriptionEndDate: "2026-05-10",
    createdAt: new Date().toISOString(),
    settings: { currency: "INR", checkInTime: "14:00", checkOutTime: "11:00", taxRate: 10 }
  },
  {
    id: "demo-palace-id",
    name: "Leka Palace",
    ownerUid: "demo-user-id",
    adminName: "Alex Mercer",
    mobileNumber: "+1 (555) 015-8839",
    domain: "leka-palace.com",
    location: "San Diego, USA",
    subscriptionStatus: "inactive",
    subscriptionPlan: "premium",
    subscriptionEndDate: null,
    createdAt: new Date().toISOString(),
    settings: { currency: "INR", checkInTime: "14:00", checkOutTime: "11:00", taxRate: 10 }
  },
  {
    id: "demo-suites-id",
    name: "Leka Suites",
    ownerUid: "demo-user-id",
    adminName: "Alex Mercer",
    mobileNumber: "+1 (555) 012-4491",
    domain: "leka-suites.com",
    location: "Chicago, USA",
    subscriptionStatus: "active",
    subscriptionPlan: "basic",
    subscriptionEndDate: "2026-07-05",
    createdAt: new Date().toISOString(),
    settings: { currency: "INR", checkInTime: "14:00", checkOutTime: "11:00", taxRate: 10 }
  }
];

// High-fidelity rooms database matching mockup exactly
const MOCK_ROOMS: Room[] = [
  { id: "r101", roomNumber: "101", type: "Deluxe Room", floor: 1, status: "available", pricePerNight: 2500 },
  { id: "r102", roomNumber: "102", type: "Deluxe Room", floor: 1, status: "occupied", pricePerNight: 2500, guestName: "Rahul Sharma", checkInTime: "2024-05-19T10:30:00" },
  { id: "r103", roomNumber: "103", type: "Deluxe Room", floor: 1, status: "near-checkout", pricePerNight: 2500, checkOutTime: "2024-05-24T11:00:00" },
  { id: "r104", roomNumber: "104", type: "Standard Room", floor: 1, status: "available", pricePerNight: 1500 },
  { id: "r105", roomNumber: "105", type: "Deluxe Room", floor: 1, status: "cleaning", pricePerNight: 2500 },
  { id: "r106", roomNumber: "106", type: "Suite Room", floor: 1, status: "occupied", pricePerNight: 4500, guestName: "Priya Mehta", checkInTime: "2024-05-21T12:00:00" },
  { id: "r107", roomNumber: "107", type: "Suite Room", floor: 1, status: "near-checkout", pricePerNight: 4500, checkOutTime: "2024-05-25T11:00:00" },
  { id: "r108", roomNumber: "108", type: "Standard Room", floor: 1, status: "available", pricePerNight: 1500 },
  { id: "r109", roomNumber: "109", type: "Deluxe Room", floor: 1, status: "available", pricePerNight: 2500 },
  { id: "r110", roomNumber: "110", type: "Deluxe Room", floor: 1, status: "occupied", pricePerNight: 2500, guestName: "Amit Verma", checkInTime: "2024-05-20T14:00:00" },
  { id: "r111", roomNumber: "111", type: "Suite Room", floor: 1, status: "maintenance", pricePerNight: 4500 },
  { id: "r112", roomNumber: "112", type: "Standard Room", floor: 1, status: "available", pricePerNight: 1500 },
];

const MOCK_FLOORS = [1, 2, 3];
const MOCK_ROOM_TYPES = [
  { name: "Deluxe Room", price: 2500 },
  { name: "Standard Room", price: 1500 },
  { name: "Suite Room", price: 4500 }
];

const MOCK_GUESTS: Guest[] = [
  { id: "g1", name: "John Doe", email: "john.doe@gmail.com", phone: "+91 9999999999", idProofType: "Aadhaar Card", idProofNumber: "883920199382", createdAt: new Date().toISOString() },
  { id: "g2", name: "Jane Smith", email: "jane.smith@yahoo.com", phone: "+91 9888888888", idProofType: "PAN Card", idProofNumber: "ABCDE1234F", createdAt: new Date().toISOString() },
  { id: "g3", name: "Robert Johnson", email: "robert.j@outlook.com", phone: "+91 9777777777", idProofType: "Voter ID", idProofNumber: "VTR9283912", createdAt: new Date().toISOString() },
];

const MOCK_BOOKINGS: Booking[] = [];
const MOCK_INVOICES: Invoice[] = [];

const MOCK_DASHBOARD: DashboardSummary = {
  occupiedRooms: 3,
  availableRooms: 5,
  dirtyRooms: 1, // mapped to cleaning
  maintenanceRooms: 1,
  todayRevenue: 48750,
  pendingRequests: 4,
  todayCheckIns: 2,
  todayCheckOuts: 1,
  lastUpdated: new Date().toISOString(),
};

// Strongly-typed generic localStorage accessor
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

const setStorageItem = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};

export const demoDb = {
  getBusiness: () => getStorageItem<Business>("demo_business", MOCK_BUSINESS),
  setBusiness: (business: Business) => setStorageItem<Business>("demo_business", business),
  
  getBusinesses: () => getStorageItem<Business[]>("demo_businesses", MOCK_BUSINESSES),
  setBusinesses: (businesses: Business[]) => setStorageItem<Business[]>("demo_businesses", businesses),

  getRooms: () => getStorageItem<Room[]>("demo_rooms", MOCK_ROOMS),
  setRooms: (rooms: Room[]) => setStorageItem<Room[]>("demo_rooms", rooms),

  getFloors: () => getStorageItem<number[]>("demo_floors", MOCK_FLOORS),
  setFloors: (floors: number[]) => setStorageItem<number[]>("demo_floors", floors),

  getRoomTypes: () => getStorageItem<{ name: string; price: number }[]>("demo_room_types", MOCK_ROOM_TYPES),
  setRoomTypes: (types: { name: string; price: number }[]) => setStorageItem<{ name: string; price: number }[]>("demo_room_types", types),
  
  getGuests: () => getStorageItem<Guest[]>("demo_guests", MOCK_GUESTS),
  setGuests: (guests: Guest[]) => setStorageItem<Guest[]>("demo_guests", guests),
  
  getBookings: () => getStorageItem<Booking[]>("demo_bookings", MOCK_BOOKINGS),
  setBookings: (bookings: Booking[]) => setStorageItem<Booking[]>("demo_bookings", bookings),
  
  getInvoices: () => getStorageItem<Invoice[]>("demo_invoices", MOCK_INVOICES),
  setInvoices: (invoices: Invoice[]) => setStorageItem<Invoice[]>("demo_invoices", invoices),
  
  getDashboard: () => getStorageItem<DashboardSummary>("demo_dashboard", MOCK_DASHBOARD),
  setDashboard: (dashboard: DashboardSummary) => setStorageItem<DashboardSummary>("demo_dashboard", dashboard),

  resetAll: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("demo_business");
    localStorage.removeItem("demo_businesses");
    localStorage.removeItem("demo_rooms");
    localStorage.removeItem("demo_floors");
    localStorage.removeItem("demo_room_types");
    localStorage.removeItem("demo_guests");
    localStorage.removeItem("demo_bookings");
    localStorage.removeItem("demo_invoices");
    localStorage.removeItem("demo_dashboard");
  }
};
