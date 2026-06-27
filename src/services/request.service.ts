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
  deleteDoc
} from "firebase/firestore";
import { demoDb, ServiceType, ServiceRequest } from "./demoDb";

export const requestService = {
  /**
   * Fetch all services configured for a business
   */
  async getServices(businessId: string): Promise<ServiceType[]> {
    if (!isFirebaseConfigured) {
      return demoDb.getServices();
    }

    const servicesRef = collection(db, `businesses/${businessId}/services`);
    const snapshot = await getDocs(servicesRef);
    const services: ServiceType[] = [];
    snapshot.forEach((docSnap) => {
      services.push(docSnap.data() as ServiceType);
    });
    return services;
  },

  async addService(businessId: string, name: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const services = demoDb.getServices();
      const id = `service-${Math.random().toString(36).substring(2, 9)}`;
      services.push({ id, name });
      demoDb.setServices(services);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }
      return;
    }

    const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const serviceDocRef = doc(db, `businesses/${businessId}/services/${id}`);
    await setDoc(serviceDocRef, { id, name });
  },

  async deleteService(businessId: string, serviceId: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const services = demoDb.getServices();
      const filtered = services.filter((s) => s.id !== serviceId);
      demoDb.setServices(filtered);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }
      return;
    }

    const serviceDocRef = doc(db, `businesses/${businessId}/services/${serviceId}`);
    await deleteDoc(serviceDocRef);
  },

  /**
   * Fetch all requests
   */
  async getRequests(businessId: string): Promise<ServiceRequest[]> {
    if (!isFirebaseConfigured) {
      return demoDb.getRequests();
    }

    const requestsRef = collection(db, `businesses/${businessId}/requests`);
    const q = query(requestsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const requests: ServiceRequest[] = [];
    snapshot.forEach((docSnap) => {
      requests.push(docSnap.data() as ServiceRequest);
    });
    return requests;
  },

  subscribeRequests(businessId: string, callback: (requests: ServiceRequest[]) => void) {
    if (!isFirebaseConfigured) {
      callback(demoDb.getRequests());
      const handleStorageChange = () => {
        callback(demoDb.getRequests());
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

    const requestsRef = collection(db, `businesses/${businessId}/requests`);
    const q = query(requestsRef, orderBy("createdAt", "desc"));
    
    return onSnapshot(q, (snapshot) => {
      const requests: ServiceRequest[] = [];
      snapshot.forEach((docSnap) => {
        requests.push(docSnap.data() as ServiceRequest);
      });
      callback(requests);
    }, (error) => {
      console.error("Requests subscription error:", error);
    });
  },

  async createRequest(
    businessId: string,
    requestData: Omit<ServiceRequest, "id" | "createdAt">
  ): Promise<ServiceRequest> {
    if (!isFirebaseConfigured) {
      const requests = demoDb.getRequests();
      const newRequest: ServiceRequest = {
        ...requestData,
        id: `req-${Math.random().toString(36).substring(2, 9)}`,
        createdAt: new Date().toISOString()
      };
      requests.unshift(newRequest); // Add to top
      demoDb.setRequests(requests);
      
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }
      return newRequest;
    }

    const requestsRef = collection(db, `businesses/${businessId}/requests`);
    const newDoc = doc(requestsRef);
    const request: ServiceRequest = {
      ...requestData,
      id: newDoc.id,
      createdAt: new Date().toISOString()
    };
    await setDoc(newDoc, request);
    return request;
  },

  async updateRequestStatus(
    businessId: string,
    requestId: string,
    status: "pending" | "in-progress" | "completed"
  ): Promise<void> {
    if (!isFirebaseConfigured) {
      const requests = demoDb.getRequests();
      const idx = requests.findIndex((r) => r.id === requestId);
      if (idx !== -1) {
        requests[idx].status = status;
        demoDb.setRequests(requests);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("demo-db-update"));
        }
      }
      return;
    }

    const docRef = doc(db, `businesses/${businessId}/requests/${requestId}`);
    await updateDoc(docRef, { status });
  },

  async deleteRequest(businessId: string, requestId: string): Promise<void> {
    if (!isFirebaseConfigured) {
      const requests = demoDb.getRequests();
      const filtered = requests.filter((r) => r.id !== requestId);
      demoDb.setRequests(filtered);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }
      return;
    }

    const docRef = doc(db, `businesses/${businessId}/requests/${requestId}`);
    await deleteDoc(docRef);
  }
};
