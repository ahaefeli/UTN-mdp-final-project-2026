"use client";

import React, { useState } from "react";

export default function AvailabilityCalendarCard() {
  const [selectedDay, setSelectedDay] = useState(9);
  
  // Initial availability states:
  // "blue" = unavailable (dark blue), "orange" = unavailable (orange), "free" = available
  const [availabilityMap, setAvailabilityMap] = useState({
    2: "blue",
    3: "blue",
    9: "orange",
  });

  const monthName = "JUNIO 2024";

  // Days list exactly matching the image:
  // Row 1: 27, 28, 29, 30 (previous month), 1 (active, gray box), 2 (dark blue), 3 (dark blue)
  // Row 2: 4, 5, 6, 7, 8 (standard), 9 (orange), 10 (standard)
  const calendarDays = [
    { number: 27, isCurrentMonth: false },
    { number: 28, isCurrentMonth: false },
    { number: 29, isCurrentMonth: false },
    { number: 30, isCurrentMonth: false },
    { number: 1, isCurrentMonth: true, style: "gray" },
    { number: 2, isCurrentMonth: true, style: "blue" },
    { number: 3, isCurrentMonth: true, style: "blue" },
    { number: 4, isCurrentMonth: true, style: "normal" },
    { number: 5, isCurrentMonth: true, style: "normal" },
    { number: 6, isCurrentMonth: true, style: "normal" },
    { number: 7, isCurrentMonth: true, style: "normal" },
    { number: 8, isCurrentMonth: true, style: "normal" },
    { number: 9, isCurrentMonth: true, style: "orange" },
    { number: 10, isCurrentMonth: true, style: "normal" },
  ];

  const weekdays = [
    { label: "L", isWeekend: false },
    { label: "M", isWeekend: false },
    { label: "M", isWeekend: false },
    { label: "J", isWeekend: false },
    { label: "V", isWeekend: false },
    { label: "S", isWeekend: true },
    { label: "D", isWeekend: true },
  ];

  const handleDayClick = (day) => {
    if (day.isCurrentMonth) {
      setSelectedDay(day.number);
    }
  };

  const toggleAvailability = () => {
    setAvailabilityMap((prev) => {
      const current = prev[selectedDay];
      const nextMap = { ...prev };
      
      if (current === "blue") {
        nextMap[selectedDay] = "orange";
      } else if (current === "orange") {
        delete nextMap[selectedDay];
      } else {
        nextMap[selectedDay] = "blue";
      }
      
      return nextMap;
    });
  };

  const isDayUnavailable = (dayNumber) => {
    return availabilityMap[dayNumber] === "blue" || availabilityMap[dayNumber] === "orange";
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between min-h-[350px]">
      
      {/* Card Header: Title on Left, Month on Right */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase">
          DISPONIBILIDAD ARBITRAL
        </h3>
        
        {/* Month Selector */}
        <div className="flex items-center gap-3 select-none">
          <button className="text-slate-800 hover:text-slate-500 font-extrabold text-xs cursor-pointer px-1">
            &lt;
          </button>
          <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
            {monthName}
          </span>
          <button className="text-slate-800 hover:text-slate-500 font-extrabold text-xs cursor-pointer px-1">
            &gt;
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="flex-1 mt-6">
        
        {/* Weekdays Header */}
        <div className="grid grid-cols-7 gap-3 text-center text-xs font-extrabold text-slate-400">
          {weekdays.map((day, idx) => (
            <div
              key={idx}
              className={`py-1 ${day.isWeekend ? "text-orange-500" : "text-slate-400"}`}
            >
              {day.label}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-3 mt-2 text-center items-center">
          {calendarDays.map((day, idx) => {
            const isSelected = selectedDay === day.number && day.isCurrentMonth;
            const currentStatus = availabilityMap[day.number];
            
            let dayClass = "";
            let textClass = "";

            if (!day.isCurrentMonth) {
              // Previous month days
              dayClass = "bg-transparent";
              textClass = "text-slate-300 font-medium";
            } else {
              // Current month days
              textClass = "text-slate-800 font-bold";
              
              if (currentStatus === "blue") {
                dayClass = "bg-[#002F87] text-white rounded-lg shadow-sm shadow-blue-950/10";
                textClass = "text-white font-bold";
              } else if (currentStatus === "orange") {
                dayClass = "bg-orange-500 text-white rounded-lg shadow-sm shadow-orange-500/10";
                textClass = "text-white font-bold";
              } else if (day.style === "gray") {
                dayClass = "bg-slate-100 rounded-lg";
              } else {
                dayClass = "bg-transparent hover:bg-slate-50 rounded-lg";
              }
            }

            return (
              <button
                key={idx}
                disabled={!day.isCurrentMonth}
                onClick={() => handleDayClick(day)}
                className={`h-12 w-full flex items-center justify-center text-sm font-bold transition-all duration-150 relative ${dayClass} ${textClass} ${
                  day.isCurrentMonth ? "cursor-pointer" : "cursor-default"
                } ${
                  isSelected ? "ring-2 ring-blue-500 ring-offset-1 scale-105" : ""
                }`}
              >
                {day.number}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info and Interactive Toggle Actions */}
      <div className="mt-6 px-4 py-3 bg-[#F4F5F7] rounded-xl flex items-center justify-between gap-4">
        
        {/* Left: Indicator Dot and Description text */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              isDayUnavailable(selectedDay) ? "bg-orange-500" : "bg-emerald-500"
            }`}
          />
          <span className="text-[11px] font-bold text-slate-700">
            {isDayUnavailable(selectedDay)
              ? `Marcado como no disponible para arbitrar (Día ${selectedDay})`
              : `Marcado como disponible para arbitrar (Día ${selectedDay})`}
          </span>
        </div>

        {/* Right: CAMBIAR ESTADO Button */}
        <button
          onClick={toggleAvailability}
          className="text-xs font-black uppercase text-[#002F87] hover:text-[#00246B] transition-colors cursor-pointer"
        >
          CAMBIAR ESTADO
        </button>

      </div>
    </div>
  );
}
