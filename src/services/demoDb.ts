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
  subscriptionEndDate: "2026-12-30", // Active (after Jun 2026)
  createdAt: new Date().toISOString(),
  settings: {
    currency: "USD",
    checkInTime: "14:00",
    checkOutTime: "11:00",
    taxRate: 12,
  },
};

// Seed multiple mock hotels to match initial onboarding card layout
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
    subscriptionEndDate: "2026-07-15", // Active (expiring soon)
    createdAt: new Date().toISOString(),
    settings: { currency: "USD", checkInTime: "14:00", checkOutTime: "11:00", taxRate: 10 }
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
    subscriptionEndDate: "2026-05-10", // Expired (relative to Jun 2026)
    createdAt: new Date().toISOString(),
    settings: { currency: "USD", checkInTime: "14:00", checkOutTime: "11:00", taxRate: 10 }
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
    subscriptionEndDate: null, // Inactive / No subscription configured
    createdAt: new Date().toISOString(),
    settings: { currency: "USD", checkInTime: "14:00", checkOutTime: "11:00", taxRate: 10 }
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
    subscriptionEndDate: "2026-07-05", // Active (expiring soon)
    createdAt: new Date().toISOString(),
    settings: { currency: "USD", checkInTime: "14:00", checkOutTime: "11:00", taxRate: 10 }
  }
];

const MOCK_ROOMS: Room[] = [
  { id: "r101", roomNumber: "101", type: "Standard Single", floor: 1, status: "available", pricePerNight: 99 },
  { id: "r102", roomNumber: "102", type: "Standard Double", floor: 1, status: "occupied", pricePerNight: 149 },
  { id: "r103", roomNumber: "103", type: "Deluxe Suite", floor: 1, status: "dirty", pricePerNight: 249 },
  { id: "r104", roomNumber: "104", type: "Deluxe Suite", floor: 1, status: "available", pricePerNight: 249 },
  { id: "r201", roomNumber: "201", type: "Executive Suite", floor: 2, status: "maintenance", pricePerNight: 399 },
  { id: "r202", roomNumber: "202", type: "Standard Double", floor: 2, status: "available", pricePerNight: 149 },
  { id: "r203", roomNumber: "203", type: "Standard Double", floor: 2, status: "occupied", pricePerNight: 149 },
  { id: "r204", roomNumber: "204", type: "Penthouse Suite", floor: 2, status: "available", pricePerNight: 599 },
  { id: "r301", roomNumber: "301", type: "Deluxe Room", floor: 3, status: "available", pricePerNight: 199 },
  { id: "r302", roomNumber: "302", type: "Deluxe Room", floor: 3, status: "dirty", pricePerNight: 199 },
];

const MOCK_GUESTS: Guest[] = [
  { id: "g1", name: "John Doe", email: "john.doe@gmail.com", phone: "+1 (555) 019-9234", idProofType: "Passport", idProofNumber: "US8839201", createdAt: new Date().toISOString() },
  { id: "g2", name: "Jane Smith", email: "jane.smith@yahoo.com", phone: "+1 (555) 014-4921", idProofType: "Driver License", idProofNumber: "DL8392011", createdAt: new Date().toISOString() },
  { id: "g3", name: "Robert Johnson", email: "robert.j@outlook.com", phone: "+1 (555) 017-7392", idProofType: "National ID", idProofNumber: "NID2093812", createdAt: new Date().toISOString() },
];

const MOCK_BOOKINGS: Booking[] = [
  {
    id: "b1",
    guestId: "g2",
    guestName: "Jane Smith",
    guestPhone: "+1 (555) 014-4921",
    roomId: "r102",
    roomNumber: "102",
    roomType: "Standard Double",
    checkInDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    checkOutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "checked-in",
    numberOfGuests: 2,
    totalPrice: 596,
    createdAt: new Date().toISOString(),
  },
  {
    id: "b2",
    guestId: "g3",
    guestName: "Robert Johnson",
    guestPhone: "+1 (555) 017-7392",
    roomId: "r203",
    roomNumber: "203",
    roomType: "Standard Double",
    checkInDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    checkOutDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "checked-in",
    numberOfGuests: 1,
    totalPrice: 596,
    createdAt: new Date().toISOString(),
  },
  {
    id: "b3",
    guestId: "g1",
    guestName: "John Doe",
    guestPhone: "+1 (555) 019-9234",
    roomId: "r104",
    roomNumber: "104",
    roomType: "Deluxe Suite",
    checkInDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    checkOutDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "confirmed",
    numberOfGuests: 2,
    totalPrice: 747,
    createdAt: new Date().toISOString(),
  }
];

const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv1",
    bookingId: "b1",
    guestId: "g2",
    guestName: "Jane Smith",
    invoiceDate: new Date().toISOString().split("T")[0],
    items: [
      { description: "Standard Double Room - 4 Nights", amount: 149, quantity: 4 },
      { description: "Room Service - Dinner", amount: 45, quantity: 1 }
    ],
    subtotal: 641,
    taxAmount: 76.92,
    total: 717.92,
    status: "paid",
    createdAt: new Date().toISOString(),
  },
  {
    id: "inv2",
    bookingId: "b2",
    guestId: "g3",
    guestName: "Robert Johnson",
    invoiceDate: new Date().toISOString().split("T")[0],
    items: [
      { description: "Standard Double Room - 4 Nights", amount: 149, quantity: 4 }
    ],
    subtotal: 596,
    taxAmount: 71.52,
    total: 667.52,
    status: "partially-paid",
    createdAt: new Date().toISOString(),
  }
];

const MOCK_DASHBOARD: DashboardSummary = {
  occupiedRooms: 2,
  availableRooms: 5,
  dirtyRooms: 2,
  maintenanceRooms: 1,
  todayRevenue: 1385.44,
  pendingRequests: 4,
  todayCheckIns: 2,
  todayCheckOuts: 0,
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
    localStorage.removeItem("demo_guests");
    localStorage.removeItem("demo_bookings");
    localStorage.removeItem("demo_invoices");
    localStorage.removeItem("demo_dashboard");
  }
};
