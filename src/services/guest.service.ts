import { db, isFirebaseConfigured } from "@/firebase/client";
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  startAfter, 
  startAt, 
  endAt, 
  setDoc,
  DocumentSnapshot
} from "firebase/firestore";
import { Guest } from "@/types";
import { demoDb } from "./demoDb";

export interface PaginatedGuests {
  guests: Guest[];
  lastVisibleDoc: any;
}

export const guestService = {
  /**
   * Fetch paginated list of guests. Supports searching by guest name.
   */
  async getGuests(
    businessId: string,
    pageSize: number = 20,
    searchQuery: string = "",
    startAfterDoc: any = null
  ): Promise<PaginatedGuests> {
    if (!isFirebaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      let guests = demoDb.getGuests();

      if (searchQuery.trim() !== "") {
        const queryLower = searchQuery.trim().toLowerCase();
        guests = guests.filter((g) => g.name.toLowerCase().includes(queryLower));
      }

      // Sort by name
      guests.sort((a, b) => a.name.localeCompare(b.name));

      let startIndex = 0;
      if (startAfterDoc !== null && typeof startAfterDoc === "number") {
        startIndex = startAfterDoc + 1;
      }

      const pagedGuests = guests.slice(startIndex, startIndex + pageSize);
      const nextCursorIndex = startIndex + pagedGuests.length - 1;
      const lastVisibleDoc = pagedGuests.length > 0 ? nextCursorIndex : null;

      return {
        guests: pagedGuests,
        lastVisibleDoc,
      };
    }

    const guestsRef = collection(db, `businesses/${businessId}/guests`);
    let q = query(guestsRef, orderBy("name"));

    if (searchQuery.trim() !== "") {
      const searchLower = searchQuery.trim();
      q = query(
        guestsRef,
        orderBy("name"),
        startAt(searchLower),
        endAt(searchLower + "\uf8ff")
      );
    }

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    q = query(q, limit(pageSize));

    const snapshot = await getDocs(q);
    const guests: Guest[] = [];
    
    snapshot.forEach((docSnap) => {
      guests.push(docSnap.data() as Guest);
    });

    const lastVisibleDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

    return {
      guests,
      lastVisibleDoc,
    };
  },

  /**
   * Add a new guest record.
   */
  async createGuest(businessId: string, guestData: Omit<Guest, "id" | "createdAt">): Promise<Guest> {
    if (!isFirebaseConfigured) {
      const guests = demoDb.getGuests();
      const newGuest: Guest = {
        ...guestData,
        id: `demo-guest-${Math.random().toString(36).substring(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      guests.push(newGuest);
      demoDb.setGuests(guests);
      
      // Trigger synthetic updates
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }

      return newGuest;
    }

    const guestsRef = collection(db, `businesses/${businessId}/guests`);
    const newGuestDoc = doc(guestsRef);
    const guestId = newGuestDoc.id;

    const guest: Guest = {
      ...guestData,
      id: guestId,
      createdAt: new Date().toISOString(),
    };

    await setDoc(newGuestDoc, guest);
    return guest;
  }
};
