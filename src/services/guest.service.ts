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
  updateDoc,
  where,
  getDoc
} from "firebase/firestore";
import { Guest } from "@/types";
import { demoDb } from "./demoDb";

export interface PaginatedGuests {
  guests: Guest[];
  lastVisibleDoc: any;
}

export const guestService = {
  /**
   * Fetch paginated guests, filterable by name/phone search.
   */
  async getGuests(
    businessId: string,
    pageSize: number = 50,
    searchQuery: string = "",
    startAfterDoc: any = null
  ): Promise<PaginatedGuests> {
    if (!isFirebaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      let guests = demoDb.getGuests();
      if (searchQuery.trim() !== "") {
        const q = searchQuery.trim().toLowerCase();
        guests = guests.filter(
          (g) =>
            g.name.toLowerCase().includes(q) ||
            (g.phone || "").includes(q) ||
            (g.phone2 || "").includes(q)
        );
      }
      guests.sort((a, b) => (b.lastCheckIn || "").localeCompare(a.lastCheckIn || ""));
      const startIndex = typeof startAfterDoc === "number" ? startAfterDoc + 1 : 0;
      const paged = guests.slice(startIndex, startIndex + pageSize);
      return {
        guests: paged,
        lastVisibleDoc: paged.length > 0 ? startIndex + paged.length - 1 : null,
      };
    }

    const guestsRef = collection(db, `businesses/${businessId}/guests`);
    let q: any = query(guestsRef, orderBy("lastCheckIn", "desc"), limit(pageSize));

    if (searchQuery.trim()) {
      const sq = searchQuery.trim();
      q = query(guestsRef, orderBy("name"), startAt(sq), endAt(sq + "\uf8ff"), limit(pageSize));
    }

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const snapshot = await getDocs(q);
    const guests: Guest[] = [];
    snapshot.forEach((d) => guests.push(d.data() as Guest));

    return {
      guests,
      lastVisibleDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
    };
  },

  /**
   * Upsert guest using PHONE as the unique key.
   * If a guest with the same phone already exists → update their info and increment totalStays.
   * If new phone → create a fresh guest record.
   */
  async upsertGuest(
    businessId: string,
    guestData: {
      name: string;
      phone: string;
      phone2?: string | null;
      email?: string | null;
      gender?: string | null;
      idProofType?: string | null;
      idProofNumber?: string | null;
      address?: string | null;
      lastRoom?: string | null;
      lastCheckIn?: string | null;
    }
  ): Promise<Guest> {
    const phone = (guestData.phone || "").trim();
    if (!phone) throw new Error("Phone number is required to upsert a guest.");

    if (!isFirebaseConfigured) {
      const guests = demoDb.getGuests();
      const existingIdx = guests.findIndex((g) => g.phone === phone);

      if (existingIdx !== -1) {
        // Update existing
        const existing = guests[existingIdx];
        const updated: Guest = {
          ...existing,
          name: guestData.name || existing.name,
          phone2: guestData.phone2 ?? existing.phone2,
          email: guestData.email ?? existing.email,
          gender: guestData.gender ?? existing.gender,
          idProofType: guestData.idProofType ?? existing.idProofType,
          idProofNumber: guestData.idProofNumber ?? existing.idProofNumber,
          address: guestData.address ?? existing.address,
          lastRoom: guestData.lastRoom ?? existing.lastRoom,
          lastCheckIn: guestData.lastCheckIn ?? existing.lastCheckIn,
          totalStays: (existing.totalStays || 0) + 1,
          updatedAt: new Date().toISOString(),
        };
        guests[existingIdx] = updated;
        demoDb.setGuests(guests);
        if (typeof window !== "undefined") window.dispatchEvent(new Event("demo-db-update"));
        return updated;
      } else {
        // Create new
        const newGuest: Guest = {
          ...guestData,
          id: `guest-${phone.replace(/\D/g, "")}`,
          totalStays: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        guests.push(newGuest);
        demoDb.setGuests(guests);
        if (typeof window !== "undefined") window.dispatchEvent(new Event("demo-db-update"));
        return newGuest;
      }
    }

    // Firebase path — use phone as document ID for O(1) deduplication
    const guestDocId = `ph-${phone.replace(/\D/g, "")}`;
    const guestDocRef = doc(db, `businesses/${businessId}/guests/${guestDocId}`);
    const snap = await getDoc(guestDocRef);

    if (snap.exists()) {
      // Update existing guest
      const existing = snap.data() as Guest;
      const updatePayload = {
        name: guestData.name || existing.name,
        phone2: guestData.phone2 ?? existing.phone2 ?? null,
        email: guestData.email ?? existing.email ?? null,
        gender: guestData.gender ?? existing.gender ?? null,
        idProofType: guestData.idProofType ?? existing.idProofType ?? null,
        idProofNumber: guestData.idProofNumber ?? existing.idProofNumber ?? null,
        address: guestData.address ?? existing.address ?? null,
        lastRoom: guestData.lastRoom ?? existing.lastRoom ?? null,
        lastCheckIn: guestData.lastCheckIn ?? existing.lastCheckIn ?? null,
        totalStays: (existing.totalStays || 0) + 1,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(guestDocRef, updatePayload);
      return { ...existing, ...updatePayload } as Guest;
    } else {
      // Create new guest
      const newGuest: Guest = {
        ...guestData,
        id: guestDocId,
        totalStays: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(guestDocRef, newGuest);
      return newGuest;
    }
  },
};
