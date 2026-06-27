import { db, isFirebaseConfigured } from "@/firebase/client";
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  setDoc,
  where
} from "firebase/firestore";
import { Investment } from "@/types";
import { demoDb } from "./demoDb";

export const investmentService = {
  /**
   * Fetch all investments for a business.
   */
  async getInvestments(businessId: string): Promise<Investment[]> {
    if (!isFirebaseConfigured) {
      const investments = demoDb.getInvestments();
      // Sort desc by date
      investments.sort((a, b) => b.date.localeCompare(a.date));
      return investments;
    }

    const investmentsRef = collection(db, `businesses/${businessId}/investments`);
    const q = query(investmentsRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    const investments: Investment[] = [];
    snapshot.forEach((docSnap) => {
      investments.push(docSnap.data() as Investment);
    });
    return investments;
  },

  /**
   * Add a new investment.
   */
  async addInvestment(
    businessId: string,
    investmentData: { name: string; amount: number; date: string }
  ): Promise<Investment> {
    if (!isFirebaseConfigured) {
      const investments = demoDb.getInvestments();
      const newInvestment: Investment = {
        id: `demo-inv-${Math.random().toString(36).substring(2, 9)}`,
        name: investmentData.name,
        amount: investmentData.amount,
        date: investmentData.date,
        createdAt: new Date().toISOString(),
      };
      investments.push(newInvestment);
      demoDb.setInvestments(investments);
      
      // Dispatch event to update components if listening
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }
      return newInvestment;
    }

    const investmentsRef = collection(db, `businesses/${businessId}/investments`);
    const newDoc = doc(investmentsRef);
    const id = newDoc.id;

    const newInvestment: Investment = {
      id,
      name: investmentData.name,
      amount: investmentData.amount,
      date: investmentData.date,
      createdAt: new Date().toISOString(),
    };

    await setDoc(newDoc, newInvestment);
    return newInvestment;
  }
};
