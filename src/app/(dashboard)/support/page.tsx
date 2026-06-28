"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { businessService } from "@/services/business.service";
import { db } from "@/firebase/client";
import { collection, addDoc } from "firebase/firestore";
import { 
  Phone, Mail, MapPin, User, Building, FileText, 
  Send, Loader2, Clock, HelpCircle, 
  Wrench, CreditCard, ShieldCheck, Lightbulb, ChevronRight, Lock
} from "lucide-react";

const SupportIllustration = () => (
  <svg viewBox="0 0 200 200" className="w-20 h-20 sm:w-24 sm:h-24 text-blue-600 shrink-0" fill="none">
    {/* Soft primary background circle */}
    <circle cx="100" cy="100" r="80" fill="#f1effd" />
    
    {/* Decorative leaves/dots */}
    <path d="M45 110c-5-5-10 0-10 10s10 15 15 5c5-5 5-20-5-15z" fill="#e4dffa" />
    <path d="M35 85c-3-6-9-3-11 5s3 15 10 9c7-6 4-20 1-14z" fill="#e4dffa" />
    <path d="M155 110c5-5 10 0 10 10s-10 15-15 5c-5-5-5-20 5-15z" fill="#e4dffa" />
    <path d="M165 85c3-6 9-3 11 5s-3 15-10 9c-7-6-4-20-1-14z" fill="#e4dffa" />
    
    {/* Headset Arc */}
    <path d="M60 100c0-22 18-40 40-40s40 18 40 40" stroke="#6646e2" strokeWidth="6" strokeLinecap="round" />
    
    {/* Left Earpad */}
    <rect x="52" y="90" width="16" height="28" rx="8" fill="#4427a3" />
    <rect x="46" y="95" width="6" height="18" rx="3" fill="#7756f7" />
    
    {/* Right Earpad */}
    <rect x="132" y="90" width="16" height="28" rx="8" fill="#4427a3" />
    <rect x="148" y="95" width="6" height="18" rx="3" fill="#7756f7" />
    
    {/* Microphone Arm */}
    <path d="M140 110c0 15-15 25-30 25" stroke="#6646e2" strokeWidth="4" strokeLinecap="round" fill="none" />
    <circle cx="110" cy="135" r="5" fill="#4427a3" />
    
    {/* Chat Bubble overlay */}
    <path d="M90 85h20c5.5 0 10 4.5 10 10v10c0 5.5-4.5 10-10 10h-5l-8 8v-8h-7c-5.5 0-10-4.5-10-10V95c0-5.5 4.5-10 10-10z" fill="#6646e2" />
    {/* Three dots in chat bubble */}
    <circle cx="95" cy="95" r="2" fill="white" />
    <circle cx="100" cy="95" r="2" fill="white" />
    <circle cx="105" cy="95" r="2" fill="white" />
  </svg>
);

export default function SupportPage() {
  const selectedBusinessId = useAppStore((state) => state.selectedBusinessId) || "";

  // Form States
  const [issueName, setIssueName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [emailId, setEmailId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [detailedIssue, setDetailedIssue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load Active Hotel Name for pre-filling Business Name field
  useEffect(() => {
    async function loadHotelDetails() {
      if (!selectedBusinessId) return;
      try {
        const biz = await businessService.getBusiness(selectedBusinessId);
        if (biz) {
          setBusinessName(biz.name);
        }
      } catch (err) {
        console.error("Failed to load business details on support page:", err);
      }
    }
    loadHotelDetails();
  }, [selectedBusinessId]);

  // Submit Issue to Database
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueName.trim() || !mobileNumber.trim() || !emailId.trim() || !detailedIssue.trim()) {
      alert("Please fill in all required fields marked with *");
      return;
    }

    setSubmitting(true);
    try {
      // Save directly to supportIssues collection under the active hotel context
      await addDoc(collection(db, `businesses/${selectedBusinessId}/supportIssues`), {
        issueName: issueName.trim(),
        mobileNumber: mobileNumber.trim(),
        emailId: emailId.trim(),
        businessName: businessName.trim(),
        detailedIssue: detailedIssue.trim(),
        createdAt: new Date().toISOString(),
        status: "open",
        response: null
      });

      setSubmitSuccess(true);
      // Clear inputs
      setIssueName("");
      setMobileNumber("");
      setEmailId("");
      setDetailedIssue("");
      
      // Auto dismiss success banner after 4 seconds
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to log support issue:", err);
      alert("Failed to submit support issue. Please check network connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      
      {/* 1. SUPPORT PAGE HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <h1 className="text-2.5xl font-black text-slate-900 tracking-tight">Support</h1>
          <p className="text-xs text-slate-500 font-semibold">
            We're here to help! Reach out to us or raise an issue.
          </p>
        </div>
        <SupportIllustration />
      </div>

      {/* 2. CONTACT INFORMATION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Phone Card */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Phone</span>
            <a href="tel:+916281288314" className="text-sm font-extrabold text-blue-600 hover:underline block">
              +91 62812 88314
            </a>
            <span className="text-[10px] text-slate-400 font-bold block">
              Mon - Sat: 9:00 AM - 6:00 PM
            </span>
          </div>
        </div>

        {/* Email Card */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Email</span>
            <a href="mailto:official.gamanext@gmail.com" className="text-sm font-extrabold text-blue-600 hover:underline block truncate max-w-[200px] sm:max-w-none">
              official.gamanext@gmail.com
            </a>
            <span className="text-[10px] text-slate-400 font-bold block">
              We reply within 24 hours
            </span>
          </div>
        </div>

        {/* Address Card */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Address</span>
            <h4 className="text-xs font-black text-slate-800 leading-tight">
              GamaNext Software Solutions
            </h4>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
              CHandra mouli nagar, 2nd Floor,<br />
              Nellore, Andhrapradesh, India
            </p>
          </div>
        </div>

      </div>

      {/* 3. SPLIT CONTENT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Issue Submission Form */}
        <div className="lg:col-span-8 bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 leading-tight">Raise an Issue</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Please fill in the details below to help us resolve your issue faster.
            </p>
          </div>

          {/* Success Banner */}
          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold rounded-2xl animate-fade-in flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Issue logged successfully! Support staff will contact you shortly.</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-5">
            
            {/* Issue Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Issue Name *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={issueName}
                  onChange={(e) => setIssueName(e.target.value)}
                  placeholder="Enter issue name"
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none transition-all font-semibold placeholder-slate-400"
                />
              </div>
            </div>

            {/* Mobile & Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Mobile Number *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="Enter mobile number"
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none transition-all font-semibold placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Email ID */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Email ID *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={emailId}
                    onChange={(e) => setEmailId(e.target.value)}
                    placeholder="Enter email ID"
                    className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none transition-all font-semibold placeholder-slate-400"
                  />
                </div>
              </div>

            </div>

            {/* Business Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Business Name *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                  <Building className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Select your business"
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none transition-all font-semibold placeholder-slate-400"
                />
              </div>
            </div>

            {/* Detailed Issue description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Detailed Issue *</label>
              <div className="relative flex flex-col">
                <span className="absolute left-3.5 top-3 text-slate-400 pointer-events-none">
                  <FileText className="w-4 h-4" />
                </span>
                <textarea
                  required
                  rows={5}
                  maxLength={1000}
                  value={detailedIssue}
                  onChange={(e) => setDetailedIssue(e.target.value)}
                  placeholder="Please describe your issue in detail..."
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900 pl-10 pr-4 py-3 rounded-xl text-xs outline-none transition-all font-semibold placeholder-slate-400 resize-none min-h-[120px]"
                />
                <span className="text-[9.5px] font-bold text-slate-400 self-end mt-1.5 uppercase">
                  {detailedIssue.length} / 1000
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-450 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] select-none"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Save Issue</span>
                </>
              )}
            </button>

            {/* Security note footer */}
            <div className="flex items-center justify-center gap-1.5 text-[9.5px] font-bold text-slate-400 text-center uppercase tracking-wide pt-2">
              <Lock className="w-3.5 h-3.5 text-slate-350" />
              <span>Your information is secure and will not be shared with third parties.</span>
            </div>

          </form>
        </div>

        {/* Right Side: Support Info sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* FAQ/Topic Selector */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">How can we help?</h3>
              <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-1">Common support topics</p>
            </div>

            <div className="space-y-1">
              
              {/* General Inquiries */}
              <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-left transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <HelpCircle className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">General Inquiries</h4>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5 leading-normal">
                      Questions about features, billing, or accounts.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>

              {/* Technical Issues */}
              <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-left transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <Wrench className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Technical Issues</h4>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5 leading-normal">
                      Facing errors or technical glitches in the app?
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </button>

              {/* Billing & Payments */}
              <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-left transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <CreditCard className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Billing & Payments</h4>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5 leading-normal">
                      Need help with payments or subscriptions?
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
              </button>

              {/* Account & Access */}
              <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-left transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Account & Access</h4>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5 leading-normal">
                      Issues logging in or managing staff access?
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
              </button>

              {/* Feature Request */}
              <button className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-left transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0">
                    <Lightbulb className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Feature Request</h4>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5 leading-normal">
                      Have a recommendation to improve our platform?
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors" />
              </button>

            </div>

            {/* Support Hours Card */}
            <div className="bg-blue-50/40 p-4 border border-blue-100/50 rounded-2xl flex items-center gap-3.5">
              <Clock className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-800 font-black tracking-wide uppercase block">Support Hours</span>
                <span className="text-[9.5px] text-blue-650 font-bold block font-sans">
                  Mon - Sat: 9:00 AM - 6:00 PM IST
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
