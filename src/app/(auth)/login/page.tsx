"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAppStore } from "@/lib/store";
import { isFirebaseConfigured } from "@/firebase/client";
import { motion } from "framer-motion";
import {
  Lock, User, Eye, EyeOff, Shield, Zap, CheckCircle2,
  Hotel, Loader2, Sparkles, AlertCircle, Download
} from "lucide-react";



function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || 
                               (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPromptEvent(e);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === "accepted") {
      setInstallPromptEvent(null);
    }
  };

  const setCurrentStaff = useAppStore((state) => state.setCurrentStaff);
  const setSelectedBusinessId = useAppStore((state) => state.setSelectedBusinessId);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter username and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.login(email, password);
      const profiles = await authService.getUserStaffProfiles(email);

      if (profiles.length > 0) {
        setCurrentStaff(profiles[0]);
        setSelectedBusinessId(profiles[0].businessId);
        router.push(callbackUrl);
      } else {
        router.push("/select-business");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError(null);
    setEmail("admin@lekahotel.com");
    setPassword("admin123");

    try {
      await authService.login("admin@lekahotel.com", "admin123");
      const profiles = await authService.getUserStaffProfiles("admin@lekahotel.com");

      if (profiles.length > 0) {
        setCurrentStaff(profiles[0]);
        setSelectedBusinessId(profiles[0].businessId);
        setTimeout(() => {
          router.push(callbackUrl);
        }, 300);
      } else {
        router.push("/select-business");
      }
    } catch (err: any) {
      setError(err.message || "Demo login failed.");
      setDemoLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col justify-between min-h-screen p-8 bg-slate-50 text-slate-800 relative">

      {/* Top spacing or quick demo trigger helper */}
      <div className="flex justify-end">
        {!isFirebaseConfigured && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-full text-[10px] font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Sandbox Mode
          </div>
        )}
      </div>

      {/* Centered Form Card */}
      <div className="flex-1 flex items-center justify-center py-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[460px] bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-10 shadow-xl shadow-slate-200/50"
        >
          {/* Card Icon */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100/50 flex items-center justify-center text-blue-600">
                <Hotel className="w-5 h-5" />
              </div>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign In</h2>
            <p className="text-slate-500 text-xs mt-1">
              Enter your credentials to access your account.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 p-3.5 rounded-lg bg-red-500/5 border border-red-500/10 text-red-500 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* PWA Install Button */}
          {!isStandalone && installPromptEvent && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleInstallClick}
              className="w-full h-10 mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/10 active:scale-[0.99] border-none cursor-pointer"
            >
              <Download className="w-4 h-4" /> Install Leka Hotel App
            </motion.button>
          )}

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Username/Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 placeholder-slate-400 pl-10 pr-10 py-2.5 rounded-lg text-sm transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <a href="#" className="text-xs text-blue-600 hover:text-blue-500 transition-colors font-medium">
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full h-11 bg-[#091e3a] hover:bg-[#06152a] text-white font-semibold rounded-lg text-sm flex items-center justify-center shadow active:scale-[0.99] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>



          {/* Footer inside card */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Don't have an account?{" "}
            <a href="#" className="text-blue-600 hover:text-blue-500 transition-colors font-semibold">
              Contact your administrator.
            </a>
          </p>

          {!isFirebaseConfigured && (
            <p className="text-center text-[10px] text-slate-400 mt-2 italic">
              Demo Admin: admin@lekahotel.com / admin123
            </p>
          )}
        </motion.div>
      </div>

      {/* Feature Badges Bottom Footer */}
      <div className="w-full max-w-lg mx-auto grid grid-cols-3 gap-2 border-t border-slate-200/80 pt-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-650 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-900">Secure</h4>
            <span className="text-[9px] text-slate-500 block -mt-0.5">Your data is safe</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-650 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-900">Fast</h4>
            <span className="text-[9px] text-slate-500 block -mt-0.5">Quick and reliable</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-650 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-slate-900">Reliable</h4>
            <span className="text-[9px] text-slate-500 block -mt-0.5">Always available</span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-slate-950 overflow-hidden font-sans">

      {/* Left Column: Background receptionist lobby image & custom LEKA HOTEL details */}
      <div className="hidden lg:block w-[50%] relative h-screen overflow-hidden">
        {/* Background photo */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 hover:scale-105"
          style={{ backgroundImage: `url('/reception.png')` }}
        />
        {/* Soft overlay to make text more readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/50 to-black/30 pointer-events-none" />

        {/* Text & Logo Container */}
        <div className="absolute inset-0 p-12 flex flex-col justify-between z-10">
          <div>
            {/* Custom Hotel Logo matching LEKA HOTEL logo layout */}
            <div className="flex flex-col items-start gap-1">
              {/* <div className="flex items-center gap-0.5 text-amber-500 mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div> */}
              <div className="flex items-center">
                <img
                  src="/logo.png"
                  alt="Leka Hotel Logo"
                  className="h-10 w-auto object-contain"
                />
              </div>
            </div>

            {/* Serif Heading */}
            <h1 className="text-4xl font-extrabold text-[#091e3a] tracking-tight mt-16 font-serif leading-tight">
              Welcome Back
            </h1>
            <p className="text-slate-700 text-sm max-w-md mt-4 font-medium leading-relaxed">
              Sign in to access your hotel dashboard and manage your operations.
            </p>
          </div>

          <div className="text-[#091e3a]/60 text-xs font-semibold">
            © {new Date().getFullYear()} LEKA HOTEL. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Column: Clean white form container */}
      <div className="w-full lg:w-[50%] min-h-screen flex flex-col justify-between bg-slate-50">
        <Suspense fallback={
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#091e3a]" />
            <p className="text-xs text-slate-550 mt-2">Loading authentication panel...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>

    </div>
  );
}
