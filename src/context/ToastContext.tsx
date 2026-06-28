"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto close after 1000ms (1 second)
    setTimeout(() => {
      removeToast(id);
    }, 1000);
  }, [removeToast]);

  const toast = React.useMemo(() => ({
    success: (msg: string) => addToast(msg, "success"),
    error: (msg: string) => addToast(msg, "error"),
    warning: (msg: string) => addToast(msg, "warning"),
    info: (msg: string) => addToast(msg, "info"),
  }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      {/* Toast Portal Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none">
        <AnimatePresence>
          {toasts.map((t) => {
            let Icon = Info;
            let iconColor = "text-blue-500";
            let bgClass = "bg-white border-blue-100";
            let textColor = "text-slate-800";

            if (t.type === "success") {
              Icon = CheckCircle2;
              iconColor = "text-emerald-500";
              bgClass = "bg-white border-emerald-100";
            } else if (t.type === "error") {
              Icon = AlertCircle;
              iconColor = "text-rose-500";
              bgClass = "bg-white border-rose-100";
            } else if (t.type === "warning") {
              Icon = AlertTriangle;
              iconColor = "text-amber-500";
              bgClass = "bg-white border-amber-100";
            }

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 15, scale: 0.93 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                layout
                className={`pointer-events-auto flex items-center gap-3 px-4.5 py-3 rounded-2xl border shadow-xl ${bgClass} ${textColor} text-xs font-bold leading-tight`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
                <span className="flex-1">{t.message}</span>
                <button
                  onClick={() => removeToast(t.id)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}
