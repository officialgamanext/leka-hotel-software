import { Business, Staff, Room, Guest, Booking, Invoice, DashboardSummary, HotelSettings } from "@/types";

export interface ServiceType {
  id: string;
  name: string;
}

export interface ServiceRequest {
  id: string;
  roomNumber: string;
  serviceName: string;
  issue: string;
  status: "pending" | "in-progress" | "completed";
  createdAt: string;
}

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
    currency: "INR",
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
  }
];

const MOCK_ROOMS: Room[] = [
  { id: "r101", roomNumber: "101", type: "Deluxe Room", floor: 1, status: "available", pricePerNight: 2500 },
  { id: "r102", roomNumber: "102", type: "Deluxe Room", floor: 1, status: "occupied", pricePerNight: 2500, guestName: "Rahul Sharma", guestPhone1: "9876543210", checkInTime: "2024-05-19T10:30:00" },
  { id: "r103", roomNumber: "103", type: "Deluxe Room", floor: 1, status: "near-checkout", pricePerNight: 2500, checkOutTime: "2024-05-24T11:00:00" },
  { id: "r104", roomNumber: "104", type: "Standard Room", floor: 1, status: "available", pricePerNight: 1500 },
  { id: "r105", roomNumber: "105", type: "Deluxe Room", floor: 1, status: "cleaning", pricePerNight: 2500 },
  { id: "r106", roomNumber: "106", type: "Suite Room", floor: 1, status: "occupied", pricePerNight: 4500, guestName: "Priya Mehta", guestPhone1: "9765432109", checkInTime: "2024-05-21T12:00:00" },
  { id: "r107", roomNumber: "107", type: "Suite Room", floor: 1, status: "near-checkout", pricePerNight: 4500, checkOutTime: "2024-05-25T11:00:00" },
  { id: "r108", roomNumber: "108", type: "Standard Room", floor: 1, status: "available", pricePerNight: 1500 },
];

const MOCK_FLOORS = [1, 2, 3];
const MOCK_ROOM_TYPES = [
  { name: "Deluxe Room", price: 2500 },
  { name: "Standard Room", price: 1500 },
  { name: "Suite Room", price: 4500 }
];

const MOCK_SERVICES: ServiceType[] = [
  { id: "s1", name: "Housekeeping" },
  { id: "s2", name: "Room Service (Food)" },
  { id: "s3", name: "Maintenance & Repairs" },
  { id: "s4", name: "Laundry Assistance" },
  { id: "s5", name: "Luggage Service" }
];

const MOCK_REQUESTS: ServiceRequest[] = [
  { id: "req1", roomNumber: "102", serviceName: "Housekeeping", issue: "Need 2 extra fresh towels and a bottle of mineral water.", status: "pending", createdAt: new Date().toISOString() },
  { id: "req2", roomNumber: "106", serviceName: "Room Service (Food)", issue: "1x Vegetarian Club Sandwich and a Hot Cappuccino.", status: "in-progress", createdAt: new Date().toISOString() },
];

const MOCK_GUESTS: Guest[] = [
  {
    id: "guest-9398765432",
    name: "Rahul Sharma",
    phone: "9398765432",
    phone2: "9876543210",
    email: "rahul.sharma@example.com",
    gender: "Male",
    idProofType: "Aadhaar Card",
    idProofNumber: "1234-5678-9012",
    address: "123 Green Glen Layout, Bangalore, Karnataka",
    gstNumber: "29AAAAA1111A1Z1",
    totalStays: 2,
    createdAt: "2024-05-10T10:00:00Z",
    updatedAt: "2024-05-19T10:30:00Z"
  },
  {
    id: "guest-9765432109",
    name: "Priya Mehta",
    phone: "9765432109",
    email: "priya.mehta@example.com",
    gender: "Female",
    idProofType: "Passport",
    idProofNumber: "A1234567",
    address: "45 Marine Drive, Mumbai, Maharashtra",
    totalStays: 1,
    createdAt: "2024-05-20T12:00:00Z",
    updatedAt: "2024-05-21T12:00:00Z"
  },
  {
    id: "guest-9876543210",
    name: "Amit Patel",
    phone: "9876543210",
    email: "amit.patel@example.com",
    gender: "Male",
    idProofType: "PAN Card",
    idProofNumber: "ABCDE1234F",
    address: "78 SG Road, Ahmedabad, Gujarat",
    gstNumber: "24AAAAA2222B1Z2",
    totalStays: 3,
    createdAt: "2024-04-15T09:00:00Z",
    updatedAt: "2024-05-18T11:00:00Z"
  }
];
const MOCK_BOOKINGS: Booking[] = [];
const MOCK_INVOICES: Invoice[] = [];
const MOCK_INVESTMENTS: any[] = [];
const MOCK_STAFF_PROFILES: Staff[] = [
  {
    uid: "demo-user-id",
    name: "Admin",
    email: "admin@lekahotel.com",
    role: "owner",
    businessId: "demo-hotel-id",
    active: true,
    createdAt: new Date().toISOString(),
  }
];

const MOCK_DASHBOARD: DashboardSummary = {
  occupiedRooms: 3,
  availableRooms: 5,
  dirtyRooms: 1,
  maintenanceRooms: 1,
  todayRevenue: 48750,
  pendingRequests: 4,
  todayCheckIns: 2,
  todayCheckOuts: 1,
  lastUpdated: new Date().toISOString(),
};

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
  
  getServices: () => getStorageItem<ServiceType[]>("demo_services", MOCK_SERVICES),
  setServices: (services: ServiceType[]) => setStorageItem<ServiceType[]>("demo_services", services),

  getRequests: () => getStorageItem<ServiceRequest[]>("demo_requests", MOCK_REQUESTS),
  setRequests: (requests: ServiceRequest[]) => setStorageItem<ServiceRequest[]>("demo_requests", requests),

  getGuests: () => getStorageItem<Guest[]>("demo_guests", MOCK_GUESTS),
  setGuests: (guests: Guest[]) => setStorageItem<Guest[]>("demo_guests", guests),
  
  getBookings: () => getStorageItem<Booking[]>("demo_bookings", MOCK_BOOKINGS),
  setBookings: (bookings: Booking[]) => setStorageItem<Booking[]>("demo_bookings", bookings),
  
  getInvoices: () => getStorageItem<Invoice[]>("demo_invoices", MOCK_INVOICES),
  setInvoices: (invoices: Invoice[]) => setStorageItem<Invoice[]>("demo_invoices", invoices),

  getStaff: () => getStorageItem<Staff[]>("demo_staff", MOCK_STAFF_PROFILES),
  setStaff: (staff: Staff[]) => setStorageItem<Staff[]>("demo_staff", staff),

  getInvestments: () => getStorageItem<any[]>("demo_investments", MOCK_INVESTMENTS),
  setInvestments: (investments: any[]) => setStorageItem<any[]>("demo_investments", investments),
  
  getDashboard: () => getStorageItem<DashboardSummary>("demo_dashboard", MOCK_DASHBOARD),
  setDashboard: (dashboard: DashboardSummary) => setStorageItem<DashboardSummary>("demo_dashboard", dashboard),

  resetAll: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("demo_business");
    localStorage.removeItem("demo_businesses");
    localStorage.removeItem("demo_rooms");
    localStorage.removeItem("demo_floors");
    localStorage.removeItem("demo_room_types");
    localStorage.removeItem("demo_services");
    localStorage.removeItem("demo_requests");
    localStorage.removeItem("demo_guests");
    localStorage.removeItem("demo_bookings");
    localStorage.removeItem("demo_invoices");
    localStorage.removeItem("demo_investments");
    localStorage.removeItem("demo_dashboard");
    localStorage.removeItem("demo_staff");
  }
};
