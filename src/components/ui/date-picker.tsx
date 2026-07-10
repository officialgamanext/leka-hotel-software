"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
}

export function CustomDatePicker({
  value,
  onChange,
  className,
  triggerClassName,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMonthSelect, setShowMonthSelect] = useState(false);
  const [showYearSelect, setShowYearSelect] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parseDate = (dStr: string) => {
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const selectedDateObj = parseDate(value);
  const [viewDate, setViewDate] = useState(selectedDateObj);

  useEffect(() => {
    if (isOpen) {
      setViewDate(selectedDateObj);
      setShowMonthSelect(false);
      setShowYearSelect(false);
    }
  }, [isOpen, value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i);
    days.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      dateStr: toISOStringDateOnly(d)
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push({
      day: i,
      isCurrentMonth: true,
      dateStr: toISOStringDateOnly(d)
    });
  }
  const nextMonthDaysToAdd = 42 - days.length;
  for (let i = 1; i <= nextMonthDaysToAdd; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      day: i,
      isCurrentMonth: false,
      dateStr: toISOStringDateOnly(d)
    });
  }

  function toISOStringDateOnly(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const handleDayClick = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const formatLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 bg-white border border-slate-200 text-xs font-bold text-slate-700 px-3.5 py-2.5 rounded-xl transition-all outline-none cursor-pointer hover:bg-slate-50",
          isOpen && "border-blue-500 ring-2 ring-blue-50/50",
          triggerClassName
        )}
      >
        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
        <span>{formatLabel(value)}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-1.5 bg-white border border-slate-150 rounded-2xl shadow-xl p-4 w-72 left-0"
          >
            {/* Header with Custom Month/Year Buttons */}
            <div className="flex items-center justify-between mb-4 gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={showMonthSelect || showYearSelect}
                className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg text-slate-650 transition-colors cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowMonthSelect(!showMonthSelect);
                    setShowYearSelect(false);
                  }}
                  className={cn(
                    "bg-slate-50 border border-slate-200/80 text-[10px] font-black text-slate-850 rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:bg-slate-100 transition-colors uppercase tracking-wider select-none",
                    showMonthSelect && "border-blue-500 bg-blue-50 text-blue-600"
                  )}
                >
                  {monthNames[month].substring(0, 3)}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowYearSelect(!showYearSelect);
                    setShowMonthSelect(false);
                  }}
                  className={cn(
                    "bg-slate-50 border border-slate-200/80 text-[10px] font-black text-slate-850 rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:bg-slate-100 transition-colors select-none",
                    showYearSelect && "border-blue-500 bg-blue-50 text-blue-600"
                  )}
                >
                  {year}
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                disabled={showMonthSelect || showYearSelect}
                className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg text-slate-650 transition-colors cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Custom Interactive Selection grids */}
            {showMonthSelect ? (
              <div className="grid grid-cols-3 gap-2 py-1">
                {monthNames.map((name, index) => {
                  const isSelected = index === month;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setViewDate(new Date(year, index, 1));
                        setShowMonthSelect(false);
                      }}
                      className={cn(
                        "py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer",
                        isSelected
                          ? "bg-blue-600 text-white font-extrabold shadow-sm"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      {name.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            ) : showYearSelect ? (
              <div className="grid grid-cols-4 gap-2 py-1">
                {Array.from({ length: 16 }, (_, i) => new Date().getFullYear() - 8 + i).map((y) => {
                  const isSelected = y === year;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setViewDate(new Date(y, month, 1));
                        setShowYearSelect(false);
                      }}
                      className={cn(
                        "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                        isSelected
                          ? "bg-blue-600 text-white font-extrabold shadow-sm"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
                    <span key={dayName} className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                      {dayName}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {days.map((dObj, idx) => {
                    const isSelected = dObj.dateStr === value;
                    return (
                      <button
                        key={`${dObj.dateStr}-${idx}`}
                        type="button"
                        onClick={() => handleDayClick(dObj.dateStr)}
                        className={cn(
                          "aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer",
                          dObj.isCurrentMonth ? "text-slate-850" : "text-slate-300",
                          isSelected
                            ? "bg-blue-600 text-white shadow-sm font-extrabold"
                            : "hover:bg-slate-50"
                        )}
                      >
                        {dObj.day}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CustomDateTimePickerProps {
  value: string; // YYYY-MM-DDTHH:MM
  onChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
}

export function CustomDateTimePicker({
  value,
  onChange,
  className,
  triggerClassName,
}: CustomDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMonthSelect, setShowMonthSelect] = useState(false);
  const [showYearSelect, setShowYearSelect] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parseDateTime = (dtStr: string) => {
    const d = new Date(dtStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const selectedDateObj = parseDateTime(value);
  const [viewDate, setViewDate] = useState(selectedDateObj);

  useEffect(() => {
    if (isOpen) {
      setViewDate(selectedDateObj);
      setShowMonthSelect(false);
      setShowYearSelect(false);
    }
  }, [isOpen, value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    days.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, daysInPrevMonth - i)
    });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    });
  }
  const nextMonthDaysToAdd = 42 - days.length;
  for (let i = 1; i <= nextMonthDaysToAdd; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    });
  }

  const curHours = selectedDateObj.getHours();
  const curMins = selectedDateObj.getMinutes();
  const displayHours = curHours % 12 === 0 ? 12 : curHours % 12;
  const ampm = curHours >= 12 ? "PM" : "AM";

  const handleDaySelect = (dayDate: Date) => {
    const newDate = new Date(dayDate);
    newDate.setHours(curHours);
    newDate.setMinutes(curMins);
    onChange(toLocalISOString(newDate));
  };

  const handleTimeChange = (hours12: number, mins: number, newAmpm: "AM" | "PM") => {
    let finalHours = hours12 % 12;
    if (newAmpm === "PM") finalHours += 12;
    
    const newDate = new Date(selectedDateObj);
    newDate.setHours(finalHours);
    newDate.setMinutes(mins);
    onChange(toLocalISOString(newDate));
  };

  const toLocalISOString = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const formatLabel = (dtStr: string) => {
    if (!dtStr) return "Select date & time";
    const d = new Date(dtStr);
    if (isNaN(d.getTime())) return dtStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dd = d.getDate();
    const monthStr = months[d.getMonth()];
    const yyyy = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const meridiem = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 === 0 ? 12 : hours % 12;
    const minutesStr = String(minutes).padStart(2, '0');
    return `${dd} ${monthStr} ${yyyy} ${hours}:${minutesStr} ${meridiem}`;
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between bg-white border border-slate-200 text-xs font-bold text-slate-700 px-3.5 py-2.5 rounded-xl transition-all outline-none text-left cursor-pointer hover:bg-slate-50",
          isOpen && "border-blue-500 ring-2 ring-blue-50/50",
          triggerClassName
        )}
      >
        <span className="truncate">{formatLabel(value)}</span>
        <Calendar className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-1.5 bg-white border border-slate-150 rounded-2xl shadow-xl p-4 w-[292px] right-0"
          >
            {/* Header with Custom Month/Year Buttons */}
            <div className="flex items-center justify-between mb-4 gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={showMonthSelect || showYearSelect}
                className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg text-slate-650 transition-colors cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowMonthSelect(!showMonthSelect);
                    setShowYearSelect(false);
                  }}
                  className={cn(
                    "bg-slate-50 border border-slate-200/80 text-[10px] font-black text-slate-850 rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:bg-slate-100 transition-colors uppercase tracking-wider select-none",
                    showMonthSelect && "border-blue-500 bg-blue-50 text-blue-600"
                  )}
                >
                  {monthNames[month].substring(0, 3)}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowYearSelect(!showYearSelect);
                    setShowMonthSelect(false);
                  }}
                  className={cn(
                    "bg-slate-50 border border-slate-200/80 text-[10px] font-black text-slate-850 rounded-lg px-2.5 py-1 outline-none cursor-pointer hover:bg-slate-100 transition-colors select-none",
                    showYearSelect && "border-blue-500 bg-blue-50 text-blue-600"
                  )}
                >
                  {year}
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                disabled={showMonthSelect || showYearSelect}
                className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg text-slate-650 transition-colors cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Custom Interactive Selection grids */}
            {showMonthSelect ? (
              <div className="grid grid-cols-3 gap-2 py-1 mb-[90px]">
                {monthNames.map((name, index) => {
                  const isSelected = index === month;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setViewDate(new Date(year, index, 1));
                        setShowMonthSelect(false);
                      }}
                      className={cn(
                        "py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer",
                        isSelected
                          ? "bg-blue-600 text-white font-extrabold shadow-sm"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      {name.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            ) : showYearSelect ? (
              <div className="grid grid-cols-4 gap-2 py-1 mb-[95px]">
                {Array.from({ length: 16 }, (_, i) => new Date().getFullYear() - 8 + i).map((y) => {
                  const isSelected = y === year;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => {
                        setViewDate(new Date(y, month, 1));
                        setShowYearSelect(false);
                      }}
                      className={cn(
                        "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                        isSelected
                          ? "bg-blue-600 text-white font-extrabold shadow-sm"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                      )}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
                    <span key={dayName} className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                      {dayName}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 mb-4 border-b border-slate-100 pb-3">
                  {days.map((dObj, idx) => {
                    const isSelected = 
                      dObj.date.getFullYear() === selectedDateObj.getFullYear() &&
                      dObj.date.getMonth() === selectedDateObj.getMonth() &&
                      dObj.date.getDate() === selectedDateObj.getDate();
                    return (
                      <button
                        key={`${dObj.date.getTime()}-${idx}`}
                        type="button"
                        onClick={() => handleDaySelect(dObj.date)}
                        className={cn(
                          "aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer",
                          dObj.isCurrentMonth ? "text-slate-850" : "text-slate-300",
                          isSelected
                            ? "bg-blue-600 text-white shadow-sm font-extrabold"
                            : "hover:bg-slate-50"
                        )}
                      >
                        {dObj.date.getDate()}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 p-2 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Time</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <select
                      value={displayHours}
                      onChange={(e) => handleTimeChange(Number(e.target.value), curMins, ampm)}
                      className="bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-1.5 py-1 outline-none cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                      ))}
                    </select>

                    <span className="text-slate-400 font-extrabold">:</span>

                    <select
                      value={curMins}
                      onChange={(e) => handleTimeChange(displayHours, Number(e.target.value), ampm)}
                      className="bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-1.5 py-1 outline-none cursor-pointer"
                    >
                      {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                      ))}
                    </select>

                    <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 ml-1">
                      {(["AM", "PM"] as const).map((ap) => (
                        <button
                          key={ap}
                          type="button"
                          onClick={() => handleTimeChange(displayHours, curMins, ap)}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider transition-all cursor-pointer",
                            ampm === ap ? "bg-blue-600 text-white shadow-xs" : "text-slate-450 hover:text-slate-800"
                          )}
                        >
                          {ap}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-1.5 mt-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                  >
                    Confirm Time
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
