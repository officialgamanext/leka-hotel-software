import { db, isFirebaseConfigured } from "@/firebase/client";
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  runTransaction,
  increment,
  DocumentSnapshot,
  where
} from "firebase/firestore";
import { Booking, BookingStatus, Room, RoomStatus } from "@/types";
import { demoDb } from "./demoDb";

export interface PaginatedBookings {
  bookings: Booking[];
  lastVisibleDoc: any; // Can be DocumentSnapshot or index number for demo
}

export const bookingService = {
  /**
   * Fetch a page of bookings for a business, ordered by check-in date descending.
   */
  async getBookingsPaginated(
    businessId: string,
    pageSize: number = 20,
    startAfterDoc: any = null,
    statusFilter?: BookingStatus
  ): Promise<PaginatedBookings> {
    if (!isFirebaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      let bookings = demoDb.getBookings();

      if (statusFilter) {
        bookings = bookings.filter((b) => b.status === statusFilter);
      }

      // Sort by checkInDate desc
      bookings.sort((a, b) => b.checkInDate.localeCompare(a.checkInDate));

      let startIndex = 0;
      if (startAfterDoc !== null && typeof startAfterDoc === "number") {
        startIndex = startAfterDoc + 1;
      } else if (startAfterDoc !== null) {
        // Fallback or find index
        const idx = bookings.findIndex((b) => b.id === startAfterDoc.id);
        if (idx !== -1) startIndex = idx + 1;
      }

      const pagedBookings = bookings.slice(startIndex, startIndex + pageSize);
      const nextCursorIndex = startIndex + pagedBookings.length - 1;
      const lastVisibleDoc = pagedBookings.length > 0 ? nextCursorIndex : null;

      return {
        bookings: pagedBookings,
        lastVisibleDoc,
      };
    }

    const bookingsRef = collection(db, `businesses/${businessId}/bookings`);
    let q = query(bookingsRef, orderBy("checkInDate", "desc"));
    
    if (statusFilter) {
      q = query(bookingsRef, where("status", "==", statusFilter), orderBy("checkInDate", "desc"));
    }
    
    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }
    
    q = query(q, limit(pageSize));
    
    const snapshot = await getDocs(q);
    const bookings: Booking[] = [];
    
    snapshot.forEach((docSnap) => {
      bookings.push(docSnap.data() as Booking);
    });
    
    const lastVisibleDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    
    return {
      bookings,
      lastVisibleDoc,
    };
  },

  /**
   * Create a booking.
   */
  async createBooking(
    businessId: string,
    bookingData: Omit<Booking, "id" | "createdAt">
  ): Promise<Booking> {
    if (!isFirebaseConfigured) {
      const bookings = demoDb.getBookings();
      const rooms = demoDb.getRooms();
      const dashboard = demoDb.getDashboard();

      const newBooking: Booking = {
        ...bookingData,
        id: `demo-booking-${Math.random().toString(36).substring(2, 9)}`,
        createdAt: new Date().toISOString(),
      };

      // 1. Add booking
      bookings.push(newBooking);
      demoDb.setBookings(bookings);

      // 2. Adjust room status and dashboard counters
      const roomIdx = rooms.findIndex((r) => r.id === bookingData.roomId);
      if (roomIdx !== -1) {
        const room = rooms[roomIdx];
        const oldRoomStatus = room.status;

        if (newBooking.status === "checked-in") {
          room.status = "occupied";
          
          if (oldRoomStatus === "available") {
            dashboard.availableRooms -= 1;
            dashboard.occupiedRooms += 1;
          } else if (oldRoomStatus === "cleaning") {
            dashboard.dirtyRooms -= 1;
            dashboard.occupiedRooms += 1;
          } else if (oldRoomStatus === "maintenance") {
            dashboard.maintenanceRooms -= 1;
            dashboard.occupiedRooms += 1;
          }
          
          dashboard.todayCheckIns += 1;
          dashboard.todayRevenue += newBooking.totalPrice;
        } else if (newBooking.status === "confirmed") {
          const todayStr = new Date().toISOString().split("T")[0];
          if (newBooking.checkInDate === todayStr) {
            dashboard.todayCheckIns += 1;
          }
        }
        
        demoDb.setRooms(rooms);
        dashboard.lastUpdated = new Date().toISOString();
        demoDb.setDashboard(dashboard);
      }

      // Trigger synthetic updates
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }

      return newBooking;
    }

    const bookingsRef = collection(db, `businesses/${businessId}/bookings`);
    const newBookingDoc = doc(bookingsRef);
    const bookingId = newBookingDoc.id;
    
    const booking: Booking = {
      ...bookingData,
      id: bookingId,
      createdAt: new Date().toISOString(),
    };

    const roomDocRef = doc(db, `businesses/${businessId}/rooms/${booking.roomId}`);
    const dashboardSummaryRef = doc(db, `businesses/${businessId}/dashboard/summary`);

    await runTransaction(db, async (transaction) => {
      transaction.set(newBookingDoc, booking);

      const roomSnap = await transaction.get(roomDocRef);
      if (!roomSnap.exists()) {
        throw new Error("Room does not exist.");
      }
      const roomData = roomSnap.data() as Room;

      const updates: Record<string, any> = {
        lastUpdated: new Date().toISOString(),
      };

      if (booking.status === "checked-in") {
        transaction.update(roomDocRef, { status: "occupied" as RoomStatus });
        
        if (roomData.status === "available") {
          updates.availableRooms = increment(-1);
          updates.occupiedRooms = increment(1);
        } else if (roomData.status === "cleaning") {
          updates.dirtyRooms = increment(-1);
          updates.occupiedRooms = increment(1);
        } else if (roomData.status === "maintenance") {
          updates.maintenanceRooms = increment(-1);
          updates.occupiedRooms = increment(1);
        }
        
        updates.todayCheckIns = increment(1);
        updates.todayRevenue = increment(booking.totalPrice);
      } else if (booking.status === "confirmed") {
        const todayStr = new Date().toISOString().split("T")[0];
        if (booking.checkInDate === todayStr) {
          updates.todayCheckIns = increment(1);
        }
      }

      transaction.update(dashboardSummaryRef, updates);
    });

    return booking;
  },

  /**
   * Update booking status.
   */
  async updateBookingStatus(
    businessId: string,
    bookingId: string,
    newStatus: BookingStatus
  ): Promise<void> {
    if (!isFirebaseConfigured) {
      const bookings = demoDb.getBookings();
      const rooms = demoDb.getRooms();
      const dashboard = demoDb.getDashboard();

      const bookingIdx = bookings.findIndex((b) => b.id === bookingId);
      if (bookingIdx === -1) throw new Error("Booking does not exist.");

      const booking = bookings[bookingIdx];
      const oldStatus = booking.status;
      if (oldStatus === newStatus) return;

      booking.status = newStatus;
      demoDb.setBookings(bookings);

      const roomIdx = rooms.findIndex((r) => r.id === booking.roomId);
      if (roomIdx !== -1) {
        const room = rooms[roomIdx];
        const oldRoomStatus = room.status;

        if (newStatus === "checked-in") {
          room.status = "occupied";
          if (oldRoomStatus === "available") {
            dashboard.availableRooms -= 1;
            dashboard.occupiedRooms += 1;
          } else if (oldRoomStatus === "cleaning") {
            dashboard.dirtyRooms -= 1;
            dashboard.occupiedRooms += 1;
          } else if (oldRoomStatus === "maintenance") {
            dashboard.maintenanceRooms -= 1;
            dashboard.occupiedRooms += 1;
          }
          dashboard.todayCheckIns += 1;
          dashboard.todayRevenue += booking.totalPrice;

        } else if (newStatus === "checked-out") {
          room.status = "cleaning";
          if (oldRoomStatus === "occupied") {
            dashboard.occupiedRooms -= 1;
            dashboard.dirtyRooms += 1;
          } else {
            dashboard.dirtyRooms += 1;
          }
          dashboard.todayCheckOuts += 1;

        } else if (newStatus === "cancelled") {
          if (oldStatus === "checked-in") {
            room.status = "available";
            dashboard.occupiedRooms -= 1;
            dashboard.availableRooms += 1;
            dashboard.todayRevenue -= booking.totalPrice;
          }
        }

        demoDb.setRooms(rooms);
        dashboard.lastUpdated = new Date().toISOString();
        demoDb.setDashboard(dashboard);
      }

      // Trigger synthetic updates
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }
      return;
    }

    const bookingDocRef = doc(db, `businesses/${businessId}/bookings/${bookingId}`);
    const dashboardSummaryRef = doc(db, `businesses/${businessId}/dashboard/summary`);

    await runTransaction(db, async (transaction) => {
      const bookingSnap = await transaction.get(bookingDocRef);
      if (!bookingSnap.exists()) {
        throw new Error("Booking does not exist.");
      }
      
      const bookingData = bookingSnap.data() as Booking;
      const oldStatus = bookingData.status;

      if (oldStatus === newStatus) return;

      const roomDocRef = doc(db, `businesses/${businessId}/rooms/${bookingData.roomId}`);
      const roomSnap = await transaction.get(roomDocRef);
      if (!roomSnap.exists()) {
        throw new Error("Associated room does not exist.");
      }
      const roomData = roomSnap.data() as Room;

      transaction.update(bookingDocRef, { status: newStatus });

      const updates: Record<string, any> = {
        lastUpdated: new Date().toISOString(),
      };

      if (newStatus === "checked-in") {
        transaction.update(roomDocRef, { status: "occupied" as RoomStatus });
        
        if (roomData.status === "available") {
          updates.availableRooms = increment(-1);
          updates.occupiedRooms = increment(1);
        } else if (roomData.status === "cleaning") {
          updates.dirtyRooms = increment(-1);
          updates.occupiedRooms = increment(1);
        } else if (roomData.status === "maintenance") {
          updates.maintenanceRooms = increment(-1);
          updates.occupiedRooms = increment(1);
        }
        
        updates.todayCheckIns = increment(1);
        updates.todayRevenue = increment(bookingData.totalPrice);

      } else if (newStatus === "checked-out") {
        transaction.update(roomDocRef, { status: "cleaning" as RoomStatus });
        
        if (roomData.status === "occupied") {
          updates.occupiedRooms = increment(-1);
          updates.dirtyRooms = increment(1);
        } else {
          updates.dirtyRooms = increment(1);
        }
        updates.todayCheckOuts = increment(1);

      } else if (newStatus === "cancelled") {
        if (oldStatus === "checked-in") {
          transaction.update(roomDocRef, { status: "available" as RoomStatus });
          updates.occupiedRooms = increment(-1);
          updates.availableRooms = increment(1);
          updates.todayRevenue = increment(-bookingData.totalPrice);
        }
      }

      transaction.update(dashboardSummaryRef, updates);
    });
  }
};
