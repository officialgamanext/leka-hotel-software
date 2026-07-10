"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { requestService } from "@/services/request.service";
import { roomService } from "@/services/room.service";
import { ServiceType, ServiceRequest } from "@/services/demoDb";
import { Room } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BellRing, Plus, Loader2, Sparkles, X, Filter, 
  Trash2, Check, Clock, Play, Layers, ChevronDown, ShieldAlert
} from "lucide-react";
import { CustomDropdown } from "@/components/ui/dropdown";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";

// Helper to format timestamps nicely
function formatDateTime(dateTimeStr: string): string {
  if (!dateTimeStr) return "";
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minStr = minutes < 10 ? "0" + minutes : minutes;
    return `${month} ${day}, ${year} ${hours}:${minStr} ${ampm}`;
  } catch {
    return dateTimeStr;
  }
}

export default function RequestsPage() {
  const selectedBusinessId = useAppStore((state) => state.selectedBusinessId) || "";
  const currentStaff = useAppStore((state) => state.currentStaff);
  const canEdit = !currentStaff || currentStaff.role === "owner" || currentStaff.role === "admin" || (currentStaff.permissions?.bookings?.edit ?? false);
  const toast = useToast();
  const confirm = useConfirm();

  // Data State
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Layout Tab
  const [activeTab, setActiveTab] = useState<"requests" | "services">("requests");

  // Modals Visibility
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showAddRequestModal, setShowAddRequestModal] = useState(false);

  // Add Service Form
  const [newServiceName, setNewServiceName] = useState("");
  const [submittingService, setSubmittingService] = useState(false);

  // Add Request Form
  const [selectedRoomNumber, setSelectedRoomNumber] = useState("");
  const [selectedServiceName, setSelectedServiceName] = useState("");
  const [requestIssue, setRequestIssue] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Filter Queue State
  const [queueFilter, setQueueFilter] = useState<string>("all");

  const loadData = async () => {
    if (!selectedBusinessId) return;
    try {
      const sList = await requestService.getServices(selectedBusinessId);
      setServices(sList);
      if (sList.length > 0) {
        setSelectedServiceName(sList[0].name);
      }

      const rList = await roomService.getRooms(selectedBusinessId);
      setRooms(rList);
      if (rList.length > 0) {
        setSelectedRoomNumber(rList[0].roomNumber);
      }
    } catch (err) {
      console.error("Failed to load request metadata:", err);
    }
  };

  useEffect(() => {
    if (!selectedBusinessId) return;

    loadData();
    setLoading(true);

    const unsubscribe = requestService.subscribeRequests(selectedBusinessId, (updatedRequests) => {
      setRequests(updatedRequests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedBusinessId]);

  // Create Service Type Category
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    setSubmittingService(true);
    try {
      await requestService.addService(selectedBusinessId, newServiceName.trim());
      await loadData();
      setNewServiceName("");
      setShowAddServiceModal(false);
      toast.success("Service category added successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add service.");
    } finally {
      setSubmittingService(false);
    }
  };

  // Delete Service Type Category
  const handleDeleteService = async (sId: string) => {
    if (!await confirm({
      title: "Delete Service Category",
      message: "Are you sure you want to delete this service type?",
      variant: "danger"
    })) return;
    try {
      await requestService.deleteService(selectedBusinessId, sId);
      await loadData();
      toast.success("Service category deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete service category.");
    }
  };

  // Create Request log
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomNumber || !selectedServiceName || !requestIssue.trim()) {
      toast.warning("Please enter all details.");
      return;
    }

    setSubmittingRequest(true);
    try {
      await requestService.createRequest(selectedBusinessId, {
        roomNumber: selectedRoomNumber,
        serviceName: selectedServiceName,
        issue: requestIssue.trim(),
        status: "pending"
      });
      setRequestIssue("");
      setShowAddRequestModal(false);
      toast.success("Service request created successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save request.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Toggle Request status
  const handleStatusChange = async (reqId: string, nextStatus: "pending" | "in-progress" | "completed") => {
    try {
      await requestService.updateRequestStatus(selectedBusinessId, reqId, nextStatus);
      toast.success(`Request status updated to ${nextStatus === "in-progress" ? "In Progress" : nextStatus}!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  // Delete Request log
  const handleDeleteRequest = async (reqId: string) => {
    if (!await confirm({
      title: "Delete Request Log",
      message: "Are you sure you want to delete this request record?",
      variant: "danger"
    })) return;
    try {
      await requestService.deleteRequest(selectedBusinessId, reqId);
      toast.success("Request log deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete request.");
    }
  };

  // Filter requests list
  const filteredRequests = requests.filter((req) => {
    if (queueFilter === "all") return true;
    return req.status === queueFilter;
  });

  return (
    <div className="space-y-6 text-slate-800 font-sans">
      
      {/* 1. TITLE HEADER & GENERAL ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Requests</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">Manage hotel room service calls and assistance requests.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          {canEdit && (
            <>
              <button
                onClick={() => setShowAddServiceModal(true)}
                className="h-10 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 text-slate-400" /> Add Service
              </button>
              
              <button
                onClick={() => setShowAddRequestModal(true)}
                className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" /> Add Request
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. TAB TOGGLE NAVIGATION */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-3.5 px-5 text-xs font-bold transition-all relative ${
            activeTab === "requests" ? "text-blue-600 font-extrabold" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          Active Requests Queue ({requests.length})
          {activeTab === "requests" && (
            <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
        
        <button
          onClick={() => setActiveTab("services")}
          className={`pb-3.5 px-5 text-xs font-bold transition-all relative ${
            activeTab === "services" ? "text-blue-600 font-extrabold" : "text-slate-400 hover:text-slate-700"
          }`}
        >
          Services Directory ({services.length})
          {activeTab === "services" && (
            <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      </div>

      {/* 3. ACTIVE VIEWPORT */}
      {activeTab === "requests" ? (
        
        // REQUESTS QUEUE TAB VIEW
        <div className="space-y-5">
          {/* Queue Filter bar */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 pl-2 tracking-wide">Filter Queue:</span>
            {["all", "pending", "in-progress", "completed"].map((st) => (
              <button
                key={st}
                onClick={() => setQueueFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${
                  queueFilter === st
                    ? "bg-blue-50 text-blue-600 border border-blue-100"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent"
                }`}
              >
                {st === "in-progress" ? "In Progress" : st}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <BellRing className="w-12 h-12 text-slate-350 mx-auto mb-3" />
              <h3 className="font-extrabold text-slate-800 text-sm">No Active Requests</h3>
              <p className="text-xs text-slate-450 mt-1">Raise a request or check scanner portals to populate the queue.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRequests.map((req) => {
                
                let borderStyle = "border-slate-100 hover:border-slate-200 bg-white";
                let statusBadge = "";
                let actionBtn = null;

                if (req.status === "pending") {
                  borderStyle = "border-amber-100 hover:border-amber-200/80 bg-white";
                  statusBadge = "bg-amber-50 text-amber-600 border border-amber-100";
                  actionBtn = canEdit ? (
                    <button
                      onClick={() => handleStatusChange(req.id, "in-progress")}
                      className="h-8 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px] uppercase tracking-wide px-3.5 transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Work
                    </button>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-extrabold flex items-center gap-1 px-2.5 uppercase tracking-wide">
                      Pending
                    </span>
                  );
                } 
                else if (req.status === "in-progress") {
                  borderStyle = "border-blue-100 hover:border-blue-200/80 bg-white";
                  statusBadge = "bg-blue-50 text-blue-600 border border-blue-100";
                  actionBtn = canEdit ? (
                    <button
                      onClick={() => handleStatusChange(req.id, "completed")}
                      className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wide px-3.5 transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" /> Complete
                    </button>
                  ) : (
                    <span className="text-[10px] text-blue-600 font-extrabold flex items-center gap-1 px-2.5 uppercase tracking-wide">
                      In Progress
                    </span>
                  );
                } 
                else if (req.status === "completed") {
                  borderStyle = "border-emerald-100 hover:border-emerald-200/80 bg-white";
                  statusBadge = "bg-emerald-50 text-emerald-600 border border-emerald-100";
                  actionBtn = (
                    <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 px-2.5">
                      <Check className="w-4 h-4" /> Resolved
                    </span>
                  );
                }

                return (
                  <div key={req.id} className={`border rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all ${borderStyle}`}>
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] uppercase font-black tracking-widest text-slate-400">Guest Service Call</span>
                          <h3 className="text-xl font-black text-slate-900 mt-0.5">Room {req.roomNumber}</h3>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${statusBadge}`}>
                          {req.status === "in-progress" ? "In Progress" : req.status}
                        </span>
                      </div>

                      <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide block">Service Requested</span>
                          <span className="text-xs font-extrabold text-slate-800">{req.serviceName}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide block">Detailed Issue</span>
                          <p className="text-xs text-slate-550 leading-relaxed font-medium pt-0.5">{req.issue}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[9px] font-semibold text-slate-400">{formatDateTime(req.createdAt)}</span>
                      
                      <div className="flex items-center gap-2">
                        {actionBtn}
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteRequest(req.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Request Log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      ) : (

        // SERVICES CATALOG TAB VIEW
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Block: Add Form */}
          {canEdit && (
            <div className="lg:col-span-5 bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-5 h-5 text-blue-600" /> Create Service Category
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Register a hotel assistance catalog label</p>
              </div>

              <form onSubmit={handleCreateService} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Service Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Laundry Service"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3.5 py-2.5 rounded-xl text-xs outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingService}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  {submittingService ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Service Category"}
                </button>
              </form>
            </div>
          )}

          {/* Right Block: Services Listing */}
          <div className={canEdit ? "lg:col-span-7 bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4" : "lg:col-span-12 bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4"}>
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-3 mb-4">
                Configured Service Options ({services.length})
              </h3>
              
              {services.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-8 text-center">No categories registered.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                  {services.map((srv) => (
                    <div key={srv.id} className="flex justify-between items-center py-2.5 px-3.5 bg-slate-50/50 rounded-xl border border-slate-150 hover:border-slate-250">
                      <span className="text-xs font-bold text-slate-700">{srv.name}</span>
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteService(srv.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Service Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      )}

      {/* Add Service Type Modal */}
      <AnimatePresence>
        {showAddServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddServiceModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white border border-slate-150 p-6 rounded-2xl shadow-2xl relative z-10 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-5 h-5 text-blue-650" /> Add Service Category
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Register a service tag in the hotel menu</p>
                </div>
                <button onClick={() => setShowAddServiceModal(false)} className="text-slate-400 hover:text-slate-650">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateService} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Service Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Toiletries Refill"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3.5 py-2.5 rounded-xl text-xs outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddServiceModal(false)}
                    className="w-1/2 h-10 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-lg text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingService}
                    className="w-1/2 h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-all shadow-sm"
                  >
                    {submittingService ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Service"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Request Modal */}
      <AnimatePresence>
        {showAddRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddRequestModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white border border-slate-150 p-6 rounded-2xl shadow-2xl relative z-10 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <BellRing className="w-5 h-5 text-blue-650" /> Add Request
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Register a new room assistance ticket</p>
                </div>
                <button onClick={() => setShowAddRequestModal(false)} className="text-slate-400 hover:text-slate-650">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {rooms.length === 0 || services.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-100 text-amber-600 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                  <span>Configure Rooms and Services catalogs first!</span>
                </div>
              ) : (
                <form onSubmit={handleCreateRequest} className="space-y-4">
                  
                  {/* Select Room */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Room Number</label>
                    <CustomDropdown
                      value={selectedRoomNumber}
                      onChange={setSelectedRoomNumber}
                      options={rooms.map((rm) => ({ value: rm.roomNumber, label: `Room ${rm.roomNumber} (${rm.type})` }))}
                    />
                  </div>

                  {/* Select Service Type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Service Category</label>
                    <CustomDropdown
                      value={selectedServiceName}
                      onChange={setSelectedServiceName}
                      options={services.map((srv) => ({ value: srv.name, label: srv.name }))}
                    />
                  </div>

                  {/* Text details */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Detailed Issue</label>
                    <textarea
                      required
                      rows={3}
                      value={requestIssue}
                      onChange={(e) => setRequestIssue(e.target.value)}
                      placeholder="e.g. AC remote is not responding, need battery change"
                      className="w-full bg-white border border-slate-200 focus:border-blue-500 text-slate-900 px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddRequestModal(false)}
                      className="w-1/2 h-10 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold rounded-lg text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingRequest}
                      className="w-1/2 h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-all shadow-sm"
                    >
                      {submittingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Request"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
