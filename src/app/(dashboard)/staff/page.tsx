"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { staffService } from "@/services/staff.service";
import { Staff, StaffPermissions, UserRole } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  Shield, Plus, UserPlus, Eye, Edit2, Trash2, X, Check,
  Loader2, Key, Phone, User, Mail, ShieldAlert, CheckSquare, Square
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/context/ConfirmContext";

const DEFAULT_PERMISSIONS: StaffPermissions = {
  dashboard: { view: false, edit: false },
  rooms: { view: false, edit: false },
  bookings: { view: false, edit: false },
  reports: { view: false, edit: false },
  guests: { view: false, edit: false },
  investments: { view: false, edit: false },
  settings: { view: false, edit: false },
  support: { view: false, edit: false },
  staff: { view: false, edit: false },
};

const PRESETS: Record<UserRole, StaffPermissions> = {
  owner: {
    dashboard: { view: true, edit: true },
    rooms: { view: true, edit: true },
    bookings: { view: true, edit: true },
    reports: { view: true, edit: true },
    guests: { view: true, edit: true },
    investments: { view: true, edit: true },
    settings: { view: true, edit: true },
    support: { view: true, edit: true },
    staff: { view: true, edit: true },
  },
  admin: {
    dashboard: { view: true, edit: true },
    rooms: { view: true, edit: true },
    bookings: { view: true, edit: true },
    reports: { view: true, edit: true },
    guests: { view: true, edit: true },
    investments: { view: true, edit: true },
    settings: { view: true, edit: true },
    support: { view: true, edit: true },
    staff: { view: true, edit: true },
  },
  receptionist: {
    dashboard: { view: true, edit: false },
    rooms: { view: true, edit: true },
    bookings: { view: true, edit: true },
    reports: { view: false, edit: false },
    guests: { view: true, edit: true },
    investments: { view: false, edit: false },
    settings: { view: false, edit: false },
    support: { view: true, edit: true },
    staff: { view: false, edit: false },
  },
  housekeeper: {
    dashboard: { view: true, edit: false },
    rooms: { view: true, edit: true },
    bookings: { view: false, edit: false },
    reports: { view: false, edit: false },
    guests: { view: false, edit: false },
    investments: { view: false, edit: false },
    settings: { view: false, edit: false },
    support: { view: true, edit: true },
    staff: { view: false, edit: false },
  },
};

export default function StaffPage() {
  const selectedBusinessId = useAppStore((state) => state.selectedBusinessId) || "";
  const currentStaffProfile = useAppStore((state) => state.currentStaff);
  const toast = useToast();
  const confirm = useConfirm();

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("receptionist");
  const [permissions, setPermissions] = useState<StaffPermissions>(DEFAULT_PERMISSIONS);

  // Check if current user is owner or admin to manage staff
  const hasManagementAccess = !currentStaffProfile || currentStaffProfile.role === "owner" || currentStaffProfile.role === "admin";

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await staffService.getStaffMembers(selectedBusinessId);
      setStaffList(data);
    } catch (err) {
      console.error("Failed to load staff list:", err);
      toast.error("Failed to fetch staff list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBusinessId) {
      fetchStaff();
    }
  }, [selectedBusinessId]);

  const handleApplyPreset = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setPermissions(PRESETS[selectedRole]);
  };

  const handleTogglePermission = (page: keyof StaffPermissions, type: "view" | "edit") => {
    setPermissions((prev) => {
      const updatedPage = { ...prev[page] };
      updatedPage[type] = !updatedPage[type];

      // view access is required if edit access is true
      if (type === "edit" && updatedPage.edit) {
        updatedPage.view = true;
      }
      // If view is deselected, edit must also be deselected
      if (type === "view" && !updatedPage.view) {
        updatedPage.edit = false;
      }

      return {
        ...prev,
        [page]: updatedPage,
      };
    });
  };

  const handleOpenAddModal = () => {
    setEditingStaffId(null);
    setName("");
    setMobileNumber("");
    setEmail("");
    setPassword("");
    setRole("receptionist");
    setPermissions(PRESETS.receptionist);
    setShowModal(true);
  };

  const handleOpenEditModal = (staff: Staff) => {
    setEditingStaffId(staff.uid);
    setName(staff.name);
    setMobileNumber(staff.mobileNumber || "");
    setEmail(staff.email);
    setPassword(""); // Keep password empty unless changing
    setRole(staff.role);
    setPermissions(staff.permissions || PRESETS[staff.role]);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || (editingStaffId === null && !password.trim())) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingStaffId) {
        // Edit staff member profile
        const updates: Partial<Staff> = {
          name: name.trim(),
          mobileNumber: mobileNumber.trim(),
          role,
          permissions,
        };
        // Firebase Auth passwords can only be updated on user account level,
        // so for safety we update Firestore document and let password changes go through normal flow
        if (password.trim()) {
          updates.password = password.trim();
        }
        await staffService.updateStaffMember(selectedBusinessId, editingStaffId, updates);
        toast.success("Staff member updated successfully.");
      } else {
        // Create new staff member
        await staffService.createStaffMember(selectedBusinessId, {
          name: name.trim(),
          email: email.trim(),
          mobileNumber: mobileNumber.trim(),
          role,
          active: true,
          permissions,
          password: password.trim(),
          businessId: selectedBusinessId,
        });
        toast.success("Staff account created successfully.");
      }
      setShowModal(false);
      fetchStaff();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save staff member details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (staff: Staff) => {
    const nextActive = !staff.active;
    try {
      await staffService.updateStaffMember(selectedBusinessId, staff.uid, { active: nextActive });
      toast.success(`Staff member ${nextActive ? "activated" : "deactivated"} successfully.`);
      fetchStaff();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (staff: Staff) => {
    if (staff.uid === currentStaffProfile?.uid) {
      toast.error("Access Denied: You cannot delete your own account.");
      return;
    }

    if (!await confirm({
      title: "Delete Staff Account",
      message: `Are you sure you want to permanently delete the staff profile for ${staff.name}? This action is irreversible.`,
      variant: "danger",
      confirmText: "Delete Account"
    })) return;

    try {
      await staffService.deleteStaffMember(selectedBusinessId, staff.uid);
      toast.success("Staff account deleted permanently.");
      fetchStaff();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete staff account.");
    }
  };

  if (!hasManagementAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white border border-slate-200 rounded-3xl shadow-sm min-h-[50vh]">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-xs">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
        </div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Unauthorized Access</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed font-semibold">
          Only hotel administrators and owners have authorization to manage staff credentials and access lists.
        </p>
      </div>
    );
  }

  const pageKeys: { key: keyof StaffPermissions; label: string; desc: string }[] = [
    { key: "dashboard", label: "Dashboard Page", desc: "Access the overview stats, logs, and activity metrics." },
    { key: "rooms", label: "Rooms Page", desc: "Manage room logs, occupant detail cards, check-in & check-out actions." },
    { key: "bookings", label: "Requests (Bookings) Page", desc: "Handle guest maintenance, room service, or reservation bookings." },
    { key: "reports", label: "Payments (Reports) Page", desc: "Review revenue sheets, print invoices, export ledger lists." },
    { key: "guests", label: "Guests Directory", desc: "Browse guest stay history, check identities, edit mobile records." },
    { key: "investments", label: "Investments Page", desc: "Add or inspect capital records and monthly asset balances." },
    { key: "settings", label: "Settings Page", desc: "Modify hotel business tax settings, domain URL, or currencies." },
    { key: "support", label: "Support Desk", desc: "Submit tickets, contact support team, review service channels." },
    { key: "staff", label: "Staff Access Page", desc: "Register other workers and adjust security level view/edit switches." },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans relative">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">Staff Accounts</h1>
          <p className="text-slate-500 text-xs mt-1.5 font-semibold">Manage system operator profiles, credentials, and page permission switches.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 rounded-xl text-xs flex items-center gap-2 shadow-md hover:shadow-blue-600/10 active:scale-[0.99] transition-all cursor-pointer border-none"
        >
          <UserPlus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      {/* Staff list view */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden p-6 sm:p-8 space-y-5">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 leading-tight">Registered Staff List</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Review active staff members and configuration profile roles.</p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-16 text-slate-400 space-y-1.5 border border-dashed border-slate-200 rounded-2xl">
            <Shield className="w-8 h-8 mx-auto text-slate-350" />
            <p className="text-[10px] font-bold">No custom staff profiles registered yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[750px] text-left text-xs font-semibold">
              <thead>
                <tr className="text-slate-450 border-b border-slate-100 uppercase tracking-wide text-[9px]">
                  <th className="pb-3 font-bold">Name</th>
                  <th className="pb-3 font-bold">Username/Email</th>
                  <th className="pb-3 font-bold">Phone Number</th>
                  <th className="pb-3 font-bold">System Role</th>
                  <th className="pb-3 font-bold text-center">Status</th>
                  <th className="pb-3 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70 text-slate-700">
                {staffList.map((staff) => (
                  <tr key={staff.uid} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-black text-xs flex items-center justify-center">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-extrabold text-slate-900">{staff.name}</span>
                      </div>
                    </td>
                    <td className="py-4 font-medium text-slate-550">{staff.email}</td>
                    <td className="py-4 font-mono text-slate-650">{staff.mobileNumber || "—"}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[9px] ${
                        staff.role === "owner" || staff.role === "admin" 
                          ? "bg-purple-50 text-purple-650 border border-purple-100" 
                          : "bg-slate-50 text-slate-600 border border-slate-200"
                      }`}>
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(staff)}
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase transition-all ${
                          staff.active 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                            : "bg-rose-50 text-rose-600 border border-rose-100"
                        }`}
                      >
                        {staff.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(staff)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                          title="Edit Permissions"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(staff)}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                          title="Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FULL SCREEN EDIT ACCESS MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col h-screen overflow-y-auto">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full">
              
              {/* Header Navbar */}
              <div className="h-16 bg-white border-b border-slate-200/80 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-10 shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Shield className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                      {editingStaffId ? "Edit Staff Access Configurations" : "Add New Staff Member"}
                    </h2>
                    <p className="text-[10px] text-slate-450 mt-0.5">
                      {editingStaffId ? "Update permissions and profile credentials" : "Create custom operator accounts with direct page control limits"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="h-9 px-4 border border-slate-200 hover:bg-slate-50 text-slate-650 font-bold rounded-xl text-xs transition-colors shrink-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.99] shrink-0 border-none cursor-pointer"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingStaffId ? "Save Changes" : "Create Staff Account"}
                  </button>
                </div>
              </div>

              {/* Main content grid split */}
              <div className="flex-1 max-w-[1440px] w-full mx-auto p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto">
                
                {/* Left side: Credentials form */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white border border-slate-200/85 p-6 rounded-2xl shadow-sm space-y-5">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                      <User className="w-4 h-4 text-blue-600" /> Account Profile
                    </h3>

                    {/* Staff Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Staff Full Name *</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <User className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Siva Krishna"
                          className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 pl-9 py-2 rounded-xl text-xs outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Mobile number */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Mobile Number</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Phone className="w-4 h-4" />
                        </span>
                        <input
                          type="tel"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          placeholder="e.g. +91 9999999999"
                          className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 pl-9 py-2 rounded-xl text-xs outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Username/Email */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Username / Email *</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="email"
                          required
                          disabled={editingStaffId !== null}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. staff@hotel.com"
                          className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 px-3 pl-9 py-2 rounded-xl text-xs outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">
                        {editingStaffId ? "New Password (Optional)" : "Password *"}
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Key className="w-4 h-4" />
                        </span>
                        <input
                          type="password"
                          required={editingStaffId === null}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={editingStaffId ? "Leave blank to keep old" : "Enter account password"}
                          className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 px-3 pl-9 py-2 rounded-xl text-xs outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Preset Role Selector */}
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Select Role Preset *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["receptionist", "housekeeper", "admin"] as UserRole[]).map((presetRole) => (
                          <button
                            key={presetRole}
                            type="button"
                            onClick={() => handleApplyPreset(presetRole)}
                            className={`h-9 font-bold text-[10px] rounded-xl border transition-all active:scale-[0.97] uppercase ${
                              role === presetRole
                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10"
                                : "bg-white border-slate-300 text-slate-650 hover:border-blue-400 hover:text-blue-650 hover:bg-blue-50"
                            }`}
                          >
                            {presetRole}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right side: Permissions matrix grid */}
                <div className="lg:col-span-8 bg-white border border-slate-200/85 p-6 rounded-2xl shadow-sm flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                      <Shield className="w-4.5 h-4.5 text-blue-600" /> Fine-Grained Page Access Controls
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-normal font-semibold -mt-2">
                      Assign custom viewing and editing capabilities for each system section. Owners and admins always possess full editing control.
                    </p>

                    {/* Permission table rows */}
                    <div className="border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-200">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-wider py-3 px-4">
                        <div className="col-span-6">System Module</div>
                        <div className="col-span-3 text-center">View Access</div>
                        <div className="col-span-3 text-center">Edit Access</div>
                      </div>

                      {/* Map rows */}
                      {pageKeys.map(({ key, label, desc }) => {
                        const hasView = permissions[key]?.view ?? false;
                        const hasEdit = permissions[key]?.edit ?? false;

                        return (
                          <div key={key} className="grid grid-cols-12 items-center py-4.5 px-4 hover:bg-slate-50/40 transition-colors">
                            <div className="col-span-6 space-y-0.5">
                              <span className="text-[11px] font-extrabold text-slate-800 uppercase block">{label}</span>
                              <span className="text-[9.5px] text-slate-400 font-medium block leading-normal">{desc}</span>
                            </div>
                            
                            {/* View Switch */}
                            <div className="col-span-3 flex justify-center">
                              <button
                                type="button"
                                onClick={() => handleTogglePermission(key, "view")}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                                  hasView 
                                    ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm" 
                                    : "bg-white border-slate-250 text-slate-400 hover:border-slate-350"
                                }`}
                              >
                                {hasView ? <CheckSquare className="w-4.5 h-4.5" /> : <Square className="w-4.5 h-4.5" />}
                              </button>
                            </div>

                            {/* Edit Switch */}
                            <div className="col-span-3 flex justify-center">
                              <button
                                type="button"
                                onClick={() => handleTogglePermission(key, "edit")}
                                disabled={!hasView}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-40 disabled:pointer-events-none ${
                                  hasEdit 
                                    ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm" 
                                    : "bg-white border-slate-250 text-slate-400 hover:border-slate-350"
                                }`}
                              >
                                {hasEdit ? <CheckSquare className="w-4.5 h-4.5" /> : <Square className="w-4.5 h-4.5" />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>

            </form>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
