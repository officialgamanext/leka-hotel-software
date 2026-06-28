"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Option {
  value: string | number;
  label: string | React.ReactNode;
  searchText?: string; // Optional custom search text if label is a React Node
}

interface CustomDropdownProps {
  options: Option[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean; // If undefined, search is enabled automatically if options.length > 5
  className?: string;
  triggerClassName?: string;
  align?: "left" | "right";
}

export function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = "Select option",
  disabled = false,
  searchable,
  className,
  triggerClassName,
  align = "left",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && (searchable || (searchable === undefined && options.length > 5))) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
    }
  }, [isOpen, searchable, options.length]);

  const selectedOption = options.find((opt) => opt.value === value);

  // Determine if search should be shown
  const showSearch = searchable !== undefined ? searchable : options.length > 5;

  // Filter options based on search query
  const filteredOptions = options.filter((opt) => {
    const textToSearch = opt.searchText || 
      (typeof opt.label === "string" ? opt.label : String(opt.value));
    return textToSearch.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelect = (val: any) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between bg-white border border-slate-200 text-xs font-bold text-slate-700 px-3.5 py-2.5 rounded-xl transition-all outline-none text-left cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50",
          isOpen && "border-blue-500 ring-2 ring-blue-50/50",
          triggerClassName
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-slate-400 font-medium")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ml-2",
            isOpen && "transform rotate-180 text-blue-500"
          )}
        />
      </button>

      {/* Options Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-50 mt-1.5 w-full bg-white border border-slate-150 rounded-xl shadow-xl overflow-hidden max-h-60 flex flex-col",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {/* Search Input */}
            {showSearch && (
              <div className="p-2 border-b border-slate-100 flex items-center gap-2 sticky top-0 bg-white z-10 shrink-0">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-800 px-2 py-1.5 rounded-lg outline-none focus:border-blue-300 focus:bg-white transition-all placeholder-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Options List */}
            <div className="overflow-y-auto py-1 flex-1 no-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400 italic text-center font-medium">
                  No options found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "w-full text-left px-3.5 py-2.5 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer",
                        isSelected 
                          ? "bg-blue-50 text-blue-600 font-extrabold" 
                          : "text-slate-650 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
