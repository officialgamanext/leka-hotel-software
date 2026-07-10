import { db, isFirebaseConfigured } from "@/firebase/client";
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where
} from "firebase/firestore";
import { Staff } from "@/types";
import { demoDb } from "./demoDb";

export const staffService = {
  /**
   * Fetch all staff members for a business.
   */
  async getStaffMembers(businessId: string): Promise<Staff[]> {
    if (!isFirebaseConfigured) {
      const allStaff = demoDb.getStaff();
      return allStaff.filter((s) => s.businessId === businessId);
    }

    const staffRef = collection(db, `businesses/${businessId}/staff`);
    const snapshot = await getDocs(staffRef);
    const list: Staff[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Staff);
    });
    return list;
  },

  /**
   * Create a new staff member.
   * If in live mode, calls the backend API to create in Firebase Auth and Firestore.
   */
  async createStaffMember(
    businessId: string,
    staffData: Omit<Staff, "uid" | "createdAt">
  ): Promise<Staff> {
    if (!isFirebaseConfigured) {
      const allStaff = demoDb.getStaff();
      const newStaff: Staff = {
        ...staffData,
        uid: `demo-staff-${Math.random().toString(36).substring(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      allStaff.push(newStaff);
      demoDb.setStaff(allStaff);
      
      // Trigger synthetic updates
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }
      return newStaff;
    }

    const response = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staffData),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Failed to create staff member.");
    }

    const result = await response.json();
    return result.staff as Staff;
  },

  /**
   * Update an existing staff member.
   */
  async updateStaffMember(
    businessId: string,
    staffUid: string,
    updates: Partial<Staff>
  ): Promise<void> {
    if (!isFirebaseConfigured) {
      const allStaff = demoDb.getStaff();
      const idx = allStaff.findIndex((s) => s.uid === staffUid);
      if (idx !== -1) {
        allStaff[idx] = { ...allStaff[idx], ...updates };
        demoDb.setStaff(allStaff);
        
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("demo-db-update"));
        }
      }
      return;
    }

    const staffDocRef = doc(db, `businesses/${businessId}/staff/${staffUid}`);
    await updateDoc(staffDocRef, updates as any);
  },

  /**
   * Delete a staff member.
   */
  async deleteStaffMember(businessId: string, staffUid: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const allStaff = demoDb.getStaff();
      const filtered = allStaff.filter((s) => s.uid !== staffUid);
      demoDb.setStaff(filtered);
      
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }
      return;
    }

    const staffDocRef = doc(db, `businesses/${businessId}/staff/${staffUid}`);
    await deleteDoc(staffDocRef);
  }
};
