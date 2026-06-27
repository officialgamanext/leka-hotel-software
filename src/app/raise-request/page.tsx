"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { requestService } from "@/services/request.service";
import { businessService } from "@/services/business.service";
import { ServiceType } from "@/services/demoDb";
import { motion } from "framer-motion";
import { 
  Hotel, BellRing, ChevronDown, CheckCircle, 
  Loader2, Sparkles, AlertCircle
} from "lucide-react";

function RaiseRequestContent() {
  const searchParams = useSearchParams();
  const hotelId = searchParams.get("hotelId") || "demo-hotel-id";
  const initialRoomNumber = searchParams.get("roomNumber") || "";

  const [hotelName, setHotelName] = useState("Leka Hotel");
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [roomNumber, setRoomNumber] = useState(initialRoomNumber);
  const [selectedService, setSelectedService] = useState("");
  const [detailedIssue, setDetailedIssue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadHotelAndServices() {
      try {
        if (hotelId) {
          const biz = await businessService.getBusiness(hotelId);
          if (biz) setHotelName(biz.name);
          
          const list = await requestService.getServices(hotelId);
          setServices(list);
          if (list.length > 0) {
            setSelectedService(list[0].name);
          }
        }
      } catch (err) {
        console.error("Failed to load request metadata:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHotelAndServices();
  }, [hotelId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim() || !selectedService || !detailedIssue.trim()) {
      alert("Please fill out all fields.");
      return;
    }

    setSubmitting(true);
    try {
      await requestService.createRequest(hotelId, {
        roomNumber: roomNumber.trim(),
        serviceName: selectedService,
        issue: detailedIssue.trim(),
        status: "pending"
      });
      setSuccess(true);
      setDetailedIssue("");
    } catch (err) {
      console.error("Failed to submit guest request:", err);
      alert("Failed to submit request. Please try again or call reception.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center font-sans p-6">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-wider">Syncing Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-100 via-slate-50 to-slate-100 text-slate-800 flex flex-col font-sans relative overflow-hidden">
      
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-blue-100/50 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-50/50 blur-[100px] rounded-full pointer-events-none" />

      {/* Main card */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white border border-slate-200/80 p-8 rounded-3xl shadow-xl relative"
        >
          {/* Logo Header */}
          <div className="flex flex-col items-center text-center gap-1.5 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100 shrink-0">
              <Hotel className="w-6 h-6" />
            </div>
            <div className="mt-1">
              <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">{hotelName}</h1>
              <span className="text-[9px] uppercase font-extrabold text-amber-600 tracking-widest block mt-0.5">Guest Service Portal</span>
            </div>
          </div>

          {success ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6 space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-extrabold text-slate-900">Request Sent!</h2>
                <p className="text-xs text-slate-500 leading-relaxed px-4">
                  Your request for <span className="font-extrabold text-slate-800">{selectedService}</span> has been dispatched. A staff member will be sent to Room <span className="font-extrabold text-slate-800">{roomNumber}</span> shortly.
                </p>
              </div>
              
              <button
                onClick={() => setSuccess(false)}
                className="mt-6 w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Raise Another Request
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Room Number field (auto-filled if provided) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide">Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 101"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-400 px-4 py-3 rounded-xl text-xs outline-none transition-all font-bold"
                />
              </div>

              {/* Service selection dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide">Select Service</label>
                <div className="relative">
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full appearance-none bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-4 py-3 rounded-xl text-xs outline-none transition-all cursor-pointer font-bold"
                  >
                    {services.length === 0 ? (
                      <option value="">-- No services configured --</option>
                    ) : (
                      services.map((srv) => (
                        <option key={srv.id} value={srv.name}>{srv.name}</option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Issue details text area */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wide">Describe your Request / Issue</label>
                <textarea
                  required
                  rows={4}
                  value={detailedIssue}
                  onChange={(e) => setDetailedIssue(e.target.value)}
                  placeholder="Please tell us what you need (e.g. Need extra towels, AC is not cooling, order room food...)"
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 placeholder-slate-400 px-4 py-3 rounded-xl text-xs outline-none transition-all resize-none font-medium leading-relaxed"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting || services.length === 0}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-55 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/5 active:scale-[0.99] transition-all mt-6"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
                <span>Dispatched Request</span>
              </button>

            </form>
          )}

        </motion.div>
      </main>

    </div>
  );
}

export default function RaiseRequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <RaiseRequestContent />
    </Suspense>
  );
}
