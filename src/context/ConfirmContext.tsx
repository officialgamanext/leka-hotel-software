"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "info" | "warning";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions & { resolve?: (val: boolean) => void }>({
    title: "",
    message: "",
  });

  const confirm = useCallback((opts: ConfirmOptions) => {
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setOptions({
        ...opts,
        resolve,
      });
    });
  }, []);

  const handleCancel = () => {
    if (options.resolve) options.resolve(false);
    setIsOpen(false);
  };

  const handleConfirm = () => {
    if (options.resolve) options.resolve(true);
    setIsOpen(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            {/* Backdrop click closes modal */}
            <div className="absolute inset-0" onClick={handleCancel} />

            {/* Dialog Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-sm bg-white border border-slate-150 rounded-2xl shadow-2xl relative z-10 overflow-hidden font-sans"
            >
              {/* Header */}
              <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  {options.variant === "danger" ? (
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-600" />
                  )}
                  <h3 className="text-sm font-black text-slate-900">{options.title}</h3>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message */}
              <div className="p-5">
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  {options.message}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="p-5 pt-3 bg-slate-50/50 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-1/2 h-10 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {options.cancelText || "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={cn(
                    "w-1/2 h-10 text-white font-bold rounded-xl text-xs transition-all active:scale-[0.99] cursor-pointer",
                    options.variant === "danger"
                      ? "bg-rose-500 hover:bg-rose-600"
                      : "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  {options.confirmText || "Confirm"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}
