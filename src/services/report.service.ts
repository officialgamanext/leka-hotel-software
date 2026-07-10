import { db, isFirebaseConfigured } from "@/firebase/client";
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  setDoc,
  where
} from "firebase/firestore";
import { Invoice, InvoiceItem } from "@/types";
import { demoDb } from "./demoDb";
import { businessService } from "./business.service";

export const reportService = {
  /**
   * Fetch recent invoices for a business.
   */
  async getRecentInvoices(businessId: string, limitCount: number = 10): Promise<Invoice[]> {
    if (!isFirebaseConfigured) {
      const invoices = demoDb.getInvoices();
      // Sort desc by exact checkout timestamp (createdAt)
      invoices.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return invoices.slice(0, limitCount);
    }

    const invoicesRef = collection(db, `businesses/${businessId}/invoices`);
    const q = query(invoicesRef, orderBy("createdAt", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);
    const invoices: Invoice[] = [];
    snapshot.forEach((docSnap) => {
      invoices.push(docSnap.data() as Invoice);
    });
    return invoices;
  },

  /**
   * Create an invoice for a booking.
   */
  async createInvoice(
    businessId: string,
    invoiceData: Omit<Invoice, "id" | "createdAt" | "subtotal" | "taxAmount" | "total">
  ): Promise<Invoice> {
    const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.amount * item.quantity), 0);
    
    let gstEnabled = false;
    let gstRate = 0;
    try {
      const business = await businessService.getBusiness(businessId);
      if (business) {
        gstEnabled = business.settings?.gstEnabled ?? false;
        gstRate = business.settings?.gstRate ?? 0;
      }
    } catch (err) {
      console.error("Failed to load business GST settings for invoice creation:", err);
    }

    const taxAmount = gstEnabled ? Math.round(subtotal * (gstRate / 100) * 100) / 100 : 0;
    const total = Math.round((subtotal + taxAmount) * 100) / 100;
    const gstRateVal = gstEnabled ? gstRate : null;
    const gstNumVal = invoiceData.gstNumber || null;

    if (!isFirebaseConfigured) {
      const invoices = demoDb.getInvoices();
      const newInvoice: Invoice = {
        ...invoiceData,
        id: `demo-inv-${Math.random().toString(36).substring(2, 9)}`,
        subtotal,
        taxAmount,
        total,
        gstRate: gstRateVal,
        gstNumber: gstNumVal,
        createdAt: new Date().toISOString(),
      };
      invoices.push(newInvoice);
      demoDb.setInvoices(invoices);
      
      // Trigger synthetic updates
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("demo-db-update"));
      }
      return newInvoice;
    }

    const invoicesRef = collection(db, `businesses/${businessId}/invoices`);
    const newInvoiceDoc = doc(invoicesRef);
    const invoiceId = newInvoiceDoc.id;

    const invoice: Invoice = {
      ...invoiceData,
      id: invoiceId,
      subtotal,
      taxAmount,
      total,
      gstRate: gstRateVal,
      gstNumber: gstNumVal,
      createdAt: new Date().toISOString(),
    };

    await setDoc(newInvoiceDoc, invoice);
    return invoice;
  },

  /**
   * Load analytical data for charts, grouping paid invoices by day.
   */
  async getRevenueReportData(businessId: string): Promise<{ date: string; revenue: number }[]> {
    if (!isFirebaseConfigured) {
      const invoices = demoDb.getInvoices();
      const paidInvoices = invoices.filter((i) => i.status === "paid");
      
      const revenueMap: Record<string, number> = {};
      paidInvoices.forEach((invoice) => {
        const date = invoice.invoiceDate; // YYYY-MM-DD
        revenueMap[date] = (revenueMap[date] || 0) + invoice.total;
      });

      // If map is empty, create some default mock dates for a beautiful dashboard chart
      if (Object.keys(revenueMap).length === 0) {
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const dateStr = date.toISOString().split("T")[0];
          revenueMap[dateStr] = Math.floor(Math.random() * 800) + 200;
        }
      }

      const chartData = Object.entries(revenueMap).map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue * 100) / 100,
      }));

      return chartData.sort((a, b) => a.date.localeCompare(b.date));
    }

    const invoicesRef = collection(db, `businesses/${businessId}/invoices`);
    const q = query(invoicesRef, where("status", "==", "paid"), limit(50));
    const snapshot = await getDocs(q);
    
    const revenueMap: Record<string, number> = {};
    snapshot.forEach((docSnap) => {
      const invoice = docSnap.data() as Invoice;
      const date = invoice.invoiceDate;
      revenueMap[date] = (revenueMap[date] || 0) + invoice.total;
    });

    const chartData = Object.entries(revenueMap).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    return chartData.sort((a, b) => a.date.localeCompare(b.date));
  }
};
