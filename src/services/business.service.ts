import { db, isFirebaseConfigured } from "@/firebase/client";
import { doc, getDoc, setDoc, updateDoc, collection } from "firebase/firestore";
import { Business, Staff, HotelSettings, DashboardSummary } from "@/types";
import { demoDb } from "./demoDb";

export const businessService = {
  /**
   * Create a new business (hotel), initialize its default settings,
   * add the owner to staff subcollection, and create initial dashboard summary document.
   * STRICT SUBSCRIPTION RULE: subscriptionEndDate is initialized to NULL (inactive by default).
   */
  async createBusiness(
    name: string,
    ownerUid: string,
    ownerEmail: string,
    adminName: string,
    mobileNumber: string,
    location: string,
    domain: string
  ): Promise<Business> {
    const defaultSettings: HotelSettings = {
      currency: "USD",
      checkInTime: "14:00",
      checkOutTime: "11:00",
      taxRate: 10,
    };

    if (!isFirebaseConfigured) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const businessData: Business = {
        id: `demo-hotel-${Math.random().toString(36).substring(2, 9)}`,
        name,
        ownerUid,
        adminName,
        mobileNumber,
        domain,
        location,
        subscriptionStatus: "inactive", // Inactive by default
        subscriptionPlan: "basic",
        subscriptionEndDate: null, // Null by default
        createdAt: new Date().toISOString(),
        settings: defaultSettings,
      };

      // Save to demo list
      const list = demoDb.getBusinesses();
      list.push(businessData);
      demoDb.setBusinesses(list);

      return businessData;
    }

    const businessRef = doc(collection(db, "businesses"));
    const businessId = businessRef.id;

    const businessData: Business = {
      id: businessId,
      name,
      ownerUid,
      adminName,
      mobileNumber,
      domain,
      location,
      subscriptionStatus: "inactive", // Inactive by default
      subscriptionPlan: "basic",
      subscriptionEndDate: null, // Null by default
      createdAt: new Date().toISOString(),
      settings: defaultSettings,
    };

    // 1. Save business document
    await setDoc(businessRef, businessData);

    // 2. Add owner to staff subcollection
    const staffRef = doc(db, `businesses/${businessId}/staff/${ownerUid}`);
    const staffData: Staff = {
      uid: ownerUid,
      name: adminName,
      email: ownerEmail,
      role: "owner",
      businessId,
      active: true,
      createdAt: new Date().toISOString(),
    };
    await setDoc(staffRef, staffData);

    // 3. Initialize dashboard summary document
    const dashboardRef = doc(db, `businesses/${businessId}/dashboard/summary`);
    const initialSummary: DashboardSummary = {
      occupiedRooms: 0,
      availableRooms: 0,
      dirtyRooms: 0,
      maintenanceRooms: 0,
      todayRevenue: 0,
      pendingRequests: 0,
      todayCheckIns: 0,
      todayCheckOuts: 0,
      lastUpdated: new Date().toISOString(),
    };
    await setDoc(dashboardRef, initialSummary);

    return businessData;
  },

  /**
   * Fetch business details by ID
   */
  async getBusiness(businessId: string): Promise<Business | null> {
    if (!isFirebaseConfigured) {
      const list = demoDb.getBusinesses();
      const bus = list.find((b) => b.id === businessId);
      return bus || null;
    }

    const docRef = doc(db, "businesses", businessId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as Business;
  },

  /**
   * Update business general settings
   */
  async updateBusinessSettings(
    businessId: string,
    settings: Partial<HotelSettings>
  ): Promise<void> {
    if (!isFirebaseConfigured) {
      const list = demoDb.getBusinesses();
      const idx = list.findIndex((b) => b.id === businessId);
      if (idx !== -1) {
        list[idx].settings = { ...list[idx].settings, ...settings };
        demoDb.setBusinesses(list);
      }
      return;
    }

    const docRef = doc(db, "businesses", businessId);
    await updateDoc(docRef, {
      "settings": settings
    });
  },

  /**
   * Admin Utility: Update business subscription parameters
   */
  async updateBusinessSubscription(
    businessId: string,
    status: "active" | "inactive",
    endDate: string | null
  ): Promise<void> {
    if (!isFirebaseConfigured) {
      const list = demoDb.getBusinesses();
      const idx = list.findIndex((b) => b.id === businessId);
      if (idx !== -1) {
        list[idx].subscriptionStatus = status;
        list[idx].subscriptionEndDate = endDate;
        demoDb.setBusinesses(list);
      }
      return;
    }

    const docRef = doc(db, "businesses", businessId);
    await updateDoc(docRef, {
      subscriptionStatus: status,
      subscriptionEndDate: endDate
    });
  },

  /**
   * Fetch dashboard summary document
   */
  async getDashboardSummary(businessId: string): Promise<DashboardSummary | null> {
    if (!isFirebaseConfigured) {
      return demoDb.getDashboard();
    }

    const docRef = doc(db, `businesses/${businessId}/dashboard/summary`);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docSnap.data() as DashboardSummary;
  }
};
