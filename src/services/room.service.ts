import { db, isFirebaseConfigured } from "@/firebase/client";
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  runTransaction,
  increment 
} from "firebase/firestore";
import { Room, RoomStatus } from "@/types";
import { demoDb } from "./demoDb";

export const roomService = {
  /**
   * Fetch all rooms for a business ordered by room number.
   */
  async getRooms(businessId: string): Promise<Room[]> {
    if (!isFirebaseConfigured) {
      return demoDb.getRooms();
    }

    const roomsRef = collection(db, `businesses/${businessId}/rooms`);
    const q = query(roomsRef, orderBy("roomNumber", "asc"));
    const snapshot = await getDocs(q);
    const rooms: Room[] = [];
    snapshot.forEach((docSnap) => {
      rooms.push(docSnap.data() as Room);
    });
    return rooms;
  },

  /**
   * Set up real-time listener for room list.
   */
  subscribeRooms(businessId: string, callback: (rooms: Room[]) => void) {
    if (!isFirebaseConfigured) {
      // Direct call immediately with current data
      callback(demoDb.getRooms());

      // Setup a window listener to emulate Firestore real-time updates across components
      const handleStorageChange = () => {
        callback(demoDb.getRooms());
      };
      
      if (typeof window !== "undefined") {
        window.addEventListener("demo-db-update", handleStorageChange);
      }

      return () => {
        if (typeof window !== "undefined") {
          window.removeEventListener("demo-db-update", handleStorageChange);
        }
      };
    }

    const roomsRef = collection(db, `businesses/${businessId}/rooms`);
    const q = query(roomsRef, orderBy("roomNumber", "asc"));
    
    return onSnapshot(q, (snapshot) => {
      const rooms: Room[] = [];
      snapshot.forEach((docSnap) => {
        rooms.push(docSnap.data() as Room);
      });
      callback(rooms);
    }, (error) => {
      console.error("Room subscription error:", error);
    });
  },

  /**
   * Add a new room.
   */
  async createRoom(businessId: string, roomData: Omit<Room, "id">): Promise<Room> {
    if (!isFirebaseConfigured) {
      const rooms = demoDb.getRooms();
      const newRoom: Room = {
        ...roomData,
        id: `demo-room-${Math.random().toString(36).substring(2, 9)}`,
      };
      rooms.push(newRoom);
      // Sort by room number
      rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
      demoDb.setRooms(rooms);

      // Adjust Dashboard summary
      const dashboard = demoDb.getDashboard();
      const statusFieldMap: Record<RoomStatus, keyof typeof dashboard> = {
        available: "availableRooms",
        occupied: "occupiedRooms",
        dirty: "dirtyRooms",
        maintenance: "maintenanceRooms",
      };
      const field = statusFieldMap[newRoom.status];
      if (field) {
        (dashboard[field] as number) += 1;
        dashboard.lastUpdated = new Date().toISOString();
        demoDb.setDashboard(dashboard);
      }

      // Trigger synthetic updates
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }

      return newRoom;
    }

    const roomsRef = collection(db, `businesses/${businessId}/rooms`);
    const newRoomDoc = doc(roomsRef);
    const roomId = newRoomDoc.id;
    const room: Room = { ...roomData, id: roomId };

    const dashboardSummaryRef = doc(db, `businesses/${businessId}/dashboard/summary`);

    await runTransaction(db, async (transaction) => {
      transaction.set(newRoomDoc, room);

      const statusFieldMap: Record<RoomStatus, string> = {
        available: "availableRooms",
        occupied: "occupiedRooms",
        dirty: "dirtyRooms",
        maintenance: "maintenanceRooms",
      };

      const fieldToIncrement = statusFieldMap[room.status];
      if (fieldToIncrement) {
        transaction.update(dashboardSummaryRef, {
          [fieldToIncrement]: increment(1),
          lastUpdated: new Date().toISOString(),
        });
      }
    });

    return room;
  },

  /**
   * Update room status transactionally.
   */
  async updateRoomStatus(
    businessId: string,
    roomId: string,
    newStatus: RoomStatus
  ): Promise<void> {
    if (!isFirebaseConfigured) {
      const rooms = demoDb.getRooms();
      const idx = rooms.findIndex((r) => r.id === roomId);
      if (idx === -1) throw new Error("Room does not exist.");

      const oldStatus = rooms[idx].status;
      if (oldStatus === newStatus) return;

      rooms[idx].status = newStatus;
      demoDb.setRooms(rooms);

      const dashboard = demoDb.getDashboard();
      const statusFieldMap: Record<RoomStatus, keyof typeof dashboard> = {
        available: "availableRooms",
        occupied: "occupiedRooms",
        dirty: "dirtyRooms",
        maintenance: "maintenanceRooms",
      };

      const oldField = statusFieldMap[oldStatus];
      const newField = statusFieldMap[newStatus];

      if (oldField) (dashboard[oldField] as number) -= 1;
      if (newField) (dashboard[newField] as number) += 1;
      dashboard.lastUpdated = new Date().toISOString();
      demoDb.setDashboard(dashboard);

      // Trigger synthetic updates
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }
      return;
    }

    const roomDocRef = doc(db, `businesses/${businessId}/rooms/${roomId}`);
    const dashboardSummaryRef = doc(db, `businesses/${businessId}/dashboard/summary`);

    await runTransaction(db, async (transaction) => {
      const roomSnap = await transaction.get(roomDocRef);
      if (!roomSnap.exists()) {
        throw new Error("Room does not exist.");
      }

      const roomData = roomSnap.data() as Room;
      const oldStatus = roomData.status;

      if (oldStatus === newStatus) return;

      transaction.update(roomDocRef, { status: newStatus });

      const statusFieldMap: Record<RoomStatus, string> = {
        available: "availableRooms",
        occupied: "occupiedRooms",
        dirty: "dirtyRooms",
        maintenance: "maintenanceRooms",
      };

      const oldField = statusFieldMap[oldStatus];
      const newField = statusFieldMap[newStatus];

      const updates: Record<string, any> = {
        lastUpdated: new Date().toISOString(),
      };

      if (oldField) updates[oldField] = increment(-1);
      if (newField) updates[newField] = increment(1);

      transaction.update(dashboardSummaryRef, updates);
    });
  }
};
