export type UserRole = "owner" | "admin" | "receptionist" | "housekeeper";

export interface Staff {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  businessId: string;
  active: boolean;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  ownerUid: string;
  adminName: string;
  mobileNumber: string;
  domain: string;
  location: string;
  subscriptionStatus: "active" | "inactive";
  subscriptionPlan: "basic" | "premium";
  subscriptionEndDate: string | null; // e.g. "YYYY-MM-DD" or null (inactive by default)
  createdAt: string;
  settings: HotelSettings;
}

export interface HotelSettings {
  currency: string;
  checkInTime: string;
  checkOutTime: string;
  taxRate: number;
  gstEnabled?: boolean;
  gstRate?: number;
}

export type RoomStatus = "available" | "occupied" | "near-checkout" | "cleaning" | "maintenance";

export interface Room {
  id: string;
  roomNumber: string;
  type: string;
  floor: number;
  status: RoomStatus;
  pricePerNight: number;
  guestName?: string | null;
  guestPhone1?: string | null;
  guestPhone2?: string | null;
  guestEmail?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  guestId?: string | null;
  additionalMembers?: any[] | null;
  lastCleaned?: string;
  notes?: string;
  qrCodeUrl?: string | null;
  guestGender?: string | null;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  idProofType?: string;
  idProofNumber?: string;
  createdAt: string;
}

export type BookingStatus = "pending" | "confirmed" | "checked-in" | "checked-out" | "cancelled";

export interface Booking {
  id: string;
  guestId: string;
  guestName: string;
  guestPhone: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  status: BookingStatus;
  numberOfGuests: number;
  totalPrice: number;
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  amount: number;
  quantity: number;
}

export interface Invoice {
  id: string;
  bookingId: string;
  guestId: string;
  guestName: string;
  invoiceDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: "unpaid" | "paid" | "partially-paid" | "refunded";
  createdAt: string;
  roomId?: string | null;
  roomNumber?: string | null;
  paymentMethod?: string | null;
}

export interface DashboardSummary {
  occupiedRooms: number;
  availableRooms: number;
  dirtyRooms: number;
  maintenanceRooms: number;
  todayRevenue: number;
  pendingRequests: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  lastUpdated: string;
}
