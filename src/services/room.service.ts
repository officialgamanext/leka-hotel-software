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
  increment,
  deleteDoc
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
      callback(demoDb.getRooms());
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
    // Generate QR Code once and upload to ImageKit
    let qrCodeUrl: string | null = null;
    try {
      const res = await fetch("/api/upload-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomNumber: roomData.roomNumber, businessId }),
      });
      if (res.ok) {
        const data = await res.json();
        qrCodeUrl = data.url;
      }
    } catch (err) {
      console.error("Failed to generate/upload QR Code during room creation:", err);
    }

    if (!isFirebaseConfigured) {
      const rooms = demoDb.getRooms();
      const newRoom: Room = {
        ...roomData,
        id: `demo-room-${Math.random().toString(36).substring(2, 9)}`,
        qrCodeUrl,
      };
      rooms.push(newRoom);
      rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
      demoDb.setRooms(rooms);

      const dashboard = demoDb.getDashboard();
      const statusFieldMap: Record<RoomStatus, keyof typeof dashboard> = {
        available: "availableRooms",
        occupied: "occupiedRooms",
        "near-checkout": "occupiedRooms",
        cleaning: "dirtyRooms",
        maintenance: "maintenanceRooms",
      };
      const field = statusFieldMap[newRoom.status];
      if (field) {
        (dashboard[field] as number) += 1;
        dashboard.lastUpdated = new Date().toISOString();
        demoDb.setDashboard(dashboard);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }

      return newRoom;
    }

    const roomsRef = collection(db, `businesses/${businessId}/rooms`);
    const newRoomDoc = doc(roomsRef);
    const roomId = newRoomDoc.id;
    const room: Room = { ...roomData, id: roomId, qrCodeUrl };

    const dashboardSummaryRef = doc(db, `businesses/${businessId}/dashboard/summary`);

    await runTransaction(db, async (transaction) => {
      transaction.set(newRoomDoc, room);

      const statusFieldMap: Record<RoomStatus, string> = {
        available: "availableRooms",
        occupied: "occupiedRooms",
        "near-checkout": "occupiedRooms",
        cleaning: "dirtyRooms",
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
   * Edit an existing room.
   */
  async editRoom(businessId: string, roomId: string, updatedData: Partial<Room>): Promise<void> {
    // If the room number is edited, regenerate QR and upload to ImageKit
    if (updatedData.roomNumber) {
      try {
        const res = await fetch("/api/upload-qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomNumber: updatedData.roomNumber, businessId }),
        });
        if (res.ok) {
          const data = await res.json();
          updatedData.qrCodeUrl = data.url;
        }
      } catch (err) {
        console.error("Failed to update QR Code during room edit:", err);
      }
    }

    if (!isFirebaseConfigured) {
      const rooms = demoDb.getRooms();
      const idx = rooms.findIndex((r) => r.id === roomId);
      if (idx !== -1) {
        rooms[idx] = { ...rooms[idx], ...updatedData };
        demoDb.setRooms(rooms);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("demo-db-update"));
        }
      }
      return;
    }

    const roomDocRef = doc(db, `businesses/${businessId}/rooms/${roomId}`);
    await updateDoc(roomDocRef, updatedData);
  },

  /**
   * Delete a room.
   */
  async deleteRoom(businessId: string, roomId: string, currentStatus: RoomStatus): Promise<void> {
    if (!isFirebaseConfigured) {
      const rooms = demoDb.getRooms();
      const filtered = rooms.filter((r) => r.id !== roomId);
      demoDb.setRooms(filtered);

      const dashboard = demoDb.getDashboard();
      const statusFieldMap: Record<RoomStatus, keyof typeof dashboard> = {
        available: "availableRooms",
        occupied: "occupiedRooms",
        "near-checkout": "occupiedRooms",
        cleaning: "dirtyRooms",
        maintenance: "maintenanceRooms",
      };

      const field = statusFieldMap[currentStatus];
      if (field && (dashboard[field] as number) > 0) {
        (dashboard[field] as number) -= 1;
        dashboard.lastUpdated = new Date().toISOString();
        demoDb.setDashboard(dashboard);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }
      return;
    }

    const roomDocRef = doc(db, `businesses/${businessId}/rooms/${roomId}`);
    const dashboardSummaryRef = doc(db, `businesses/${businessId}/dashboard/summary`);

    await runTransaction(db, async (transaction) => {
      transaction.delete(roomDocRef);

      const statusFieldMap: Record<RoomStatus, string> = {
        available: "availableRooms",
        occupied: "occupiedRooms",
        "near-checkout": "occupiedRooms",
        cleaning: "dirtyRooms",
        maintenance: "maintenanceRooms",
      };

      const fieldToDecrement = statusFieldMap[currentStatus];
      if (fieldToDecrement) {
        transaction.update(dashboardSummaryRef, {
          [fieldToDecrement]: increment(-1),
          lastUpdated: new Date().toISOString(),
        });
      }
    });
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
        "near-checkout": "occupiedRooms",
        cleaning: "dirtyRooms",
        maintenance: "maintenanceRooms",
      };

      const oldField = statusFieldMap[oldStatus];
      const newField = statusFieldMap[newStatus];

      if (oldField) (dashboard[oldField] as number) -= 1;
      if (newField) (dashboard[newField] as number) += 1;
      dashboard.lastUpdated = new Date().toISOString();
      demoDb.setDashboard(dashboard);

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
        "near-checkout": "occupiedRooms",
        cleaning: "dirtyRooms",
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
  },

  /**
   * FLOORS DATABASE SERVICES
   */
  async getFloors(businessId: string): Promise<number[]> {
    if (!isFirebaseConfigured) {
      return demoDb.getFloors();
    }

    const floorsRef = collection(db, `businesses/${businessId}/floors`);
    const snapshot = await getDocs(floorsRef);
    const floors: number[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && typeof data.floorNumber === "number") {
        floors.push(data.floorNumber);
      }
    });
    return floors.sort((a, b) => a - b);
  },

  async addFloor(businessId: string, floorNumber: number): Promise<void> {
    if (!isFirebaseConfigured) {
      const floors = demoDb.getFloors();
      if (!floors.includes(floorNumber)) {
        floors.push(floorNumber);
        floors.sort((a, b) => a - b);
        demoDb.setFloors(floors);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("demo-db-update"));
        }
      }
      return;
    }

    const floorDocRef = doc(db, `businesses/${businessId}/floors/${floorNumber}`);
    await setDoc(floorDocRef, { floorNumber });
  },

  async deleteFloor(businessId: string, floorNumber: number): Promise<void> {
    if (!isFirebaseConfigured) {
      const floors = demoDb.getFloors();
      const filtered = floors.filter((f) => f !== floorNumber);
      demoDb.setFloors(filtered);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }
      return;
    }

    const floorDocRef = doc(db, `businesses/${businessId}/floors/${floorNumber}`);
    await deleteDoc(floorDocRef);
  },

  /**
   * ROOM TYPES DATABASE SERVICES
   */
  async getRoomTypes(businessId: string): Promise<{ name: string; price: number }[]> {
    if (!isFirebaseConfigured) {
      return demoDb.getRoomTypes();
    }

    const typesRef = collection(db, `businesses/${businessId}/roomTypes`);
    const snapshot = await getDocs(typesRef);
    const types: { name: string; price: number }[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.name) {
        types.push({ name: data.name, price: Number(data.price || 0) });
      }
    });
    return types;
  },

  async addRoomType(businessId: string, name: string, price: number): Promise<void> {
    if (!isFirebaseConfigured) {
      const types = demoDb.getRoomTypes();
      if (!types.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
        types.push({ name, price });
        demoDb.setRoomTypes(types);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("demo-db-update"));
        }
      }
      return;
    }

    const typeId = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const typeDocRef = doc(db, `businesses/${businessId}/roomTypes/${typeId}`);
    await setDoc(typeDocRef, { name, price });
  },

  async editRoomType(businessId: string, oldName: string, name: string, price: number): Promise<void> {
    if (!isFirebaseConfigured) {
      const types = demoDb.getRoomTypes();
      const idx = types.findIndex((t) => t.name === oldName);
      if (idx !== -1) {
        types[idx] = { name, price };
        demoDb.setRoomTypes(types);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("demo-db-update"));
        }
      }
      return;
    }

    const oldTypeId = oldName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const newTypeId = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    
    // Delete old document and create new one if the name changed
    if (oldTypeId !== newTypeId) {
      await deleteDoc(doc(db, `businesses/${businessId}/roomTypes/${oldTypeId}`));
    }
    await setDoc(doc(db, `businesses/${businessId}/roomTypes/${newTypeId}`), { name, price });
  },

  async deleteRoomType(businessId: string, name: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const types = demoDb.getRoomTypes();
      const filtered = types.filter((t) => t.name !== name);
      demoDb.setRoomTypes(filtered);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }
      return;
    }

    const typeId = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    await deleteDoc(doc(db, `businesses/${businessId}/roomTypes/${typeId}`));
  },

  /**
   * GUEST CHECK IN SERVICE
   * Transition room to occupied and register logs.
   */
  async checkInRoom(
    businessId: string,
    roomId: string,
    checkInData: {
      guestName: string;
      checkInTime: string;
      checkOutTime: string;
      additionalMembers: any[];
      gstNumber?: string | null;
    }
  ): Promise<void> {
    if (!isFirebaseConfigured) {
      const rooms = demoDb.getRooms();
      const idx = rooms.findIndex((r) => r.id === roomId);
      if (idx !== -1) {
        const roomData = rooms[idx];
        if (roomData.status === "occupied" && roomData.checkInTime) {
          const existingStart = new Date(roomData.checkInTime).getTime();
          const existingEnd = roomData.checkOutTime ? new Date(roomData.checkOutTime).getTime() : new Date(8640000000000000).getTime();
          const newStart = new Date(checkInData.checkInTime).getTime();
          const newEnd = new Date(checkInData.checkOutTime).getTime();
          
          const overlaps = existingStart < newEnd && existingEnd > newStart;
          const isExistingActive = !roomData.checkOutTime || new Date(roomData.checkOutTime) > new Date();

          if (overlaps && isExistingActive) {
            throw new Error("Room is already occupied during this stay period.");
          }
        } else if (roomData.status === "occupied" && !roomData.checkInTime) {
          throw new Error("Room is already occupied.");
        }

        rooms[idx].status = "occupied";
        rooms[idx].guestName = checkInData.guestName;
        rooms[idx].checkInTime = checkInData.checkInTime;
        rooms[idx].checkOutTime = checkInData.checkOutTime;
        rooms[idx].additionalMembers = checkInData.additionalMembers;
        rooms[idx].guestGender = checkInData.additionalMembers[0]?.gender || "Male";
        rooms[idx].gstNumber = checkInData.gstNumber || null;
        demoDb.setRooms(rooms);

        // Update dashboard
        const dbSummary = demoDb.getDashboard();
        dbSummary.occupiedRooms += 1;
        dbSummary.availableRooms = Math.max(0, dbSummary.availableRooms - 1);
        demoDb.setDashboard(dbSummary);

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("demo-db-update"));
        }
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
      if (roomData.status === "occupied" && roomData.checkInTime) {
        const existingStart = new Date(roomData.checkInTime).getTime();
        const existingEnd = roomData.checkOutTime ? new Date(roomData.checkOutTime).getTime() : new Date(8640000000000000).getTime();
        const newStart = new Date(checkInData.checkInTime).getTime();
        const newEnd = new Date(checkInData.checkOutTime).getTime();

        const overlaps = existingStart < newEnd && existingEnd > newStart;
        const isExistingActive = !roomData.checkOutTime || new Date(roomData.checkOutTime) > new Date();

        if (overlaps && isExistingActive) {
          throw new Error("Room is already occupied during this stay period.");
        }
      } else if (roomData.status === "occupied" && !roomData.checkInTime) {
        throw new Error("Room is already occupied.");
      }

      // Update room details
      transaction.update(roomDocRef, {
        status: "occupied",
        guestName: checkInData.guestName,
        checkInTime: checkInData.checkInTime,
        checkOutTime: checkInData.checkOutTime,
        additionalMembers: checkInData.additionalMembers,
        guestGender: checkInData.additionalMembers[0]?.gender || "Male",
        gstNumber: checkInData.gstNumber || null
      });

      // Update occupancy dashboard counts
      transaction.update(dashboardSummaryRef, {
        occupiedRooms: increment(1),
        availableRooms: increment(-1),
        lastUpdated: new Date().toISOString()
      });
    });
  },

  /**
   * GUEST CHECK OUT SERVICE
   * Restores room to available/cleaning and logs check-out.
   */
  async checkOutRoom(businessId: string, roomId: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const rooms = demoDb.getRooms();
      const idx = rooms.findIndex((r) => r.id === roomId);
      if (idx !== -1) {
        rooms[idx].status = "cleaning";
        rooms[idx].guestName = null;
        rooms[idx].checkInTime = null;
        rooms[idx].checkOutTime = null;
        rooms[idx].additionalMembers = null;
        rooms[idx].guestGender = null;
        rooms[idx].gstNumber = null;
        demoDb.setRooms(rooms);

        // Update dashboard
        const dbSummary = demoDb.getDashboard();
        dbSummary.occupiedRooms = Math.max(0, dbSummary.occupiedRooms - 1);
        dbSummary.dirtyRooms = (dbSummary.dirtyRooms || 0) + 1;
        dbSummary.todayCheckOuts = (dbSummary.todayCheckOuts || 0) + 1;
        demoDb.setDashboard(dbSummary);

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("demo-db-update"));
        }
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

      transaction.update(roomDocRef, {
        status: "cleaning",
        guestName: null,
        checkInTime: null,
        checkOutTime: null,
        additionalMembers: null,
        guestGender: null,
        gstNumber: null
      });

      transaction.update(dashboardSummaryRef, {
        occupiedRooms: increment(-1),
        dirtyRooms: increment(1),
        todayCheckOuts: increment(1),
        lastUpdated: new Date().toISOString()
      });
    });
  }
};
