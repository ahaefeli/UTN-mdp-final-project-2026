"use client";

import React from "react";

export default function WelcomeBanner({ data }) {
  const { title, message, nextMatch, statusRef } = data || {
    title: "¡HOLA, MARCOS!",
    message: "Tu estado administrativo está al día. Tienes 3 partidos programados para este fin de semana en la categoría Sub-18.",
    nextMatch: "Vie, 19:00 hs",
    statusRef: "NIVEL PRO"
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#002F87] text-white p-6 md:p-8 shadow-sm flex flex-col justify-between min-h-[220px]">
      
      {/* Volleyball Watermark SVG on Bottom-Right */}
      <div className="absolute right-0 bottom-0 w-44 h-44 opacity-10 pointer-events-none translate-x-8 translate-y-8 select-none">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="w-full h-full"
        >
          {/* Main sphere outline */}
          <circle cx="50" cy="50" r="48" />
          
          {/* Volleyball panels curves */}
          <path d="M 50,2 Q 40,40 50,98" />
          <path d="M 2,50 Q 40,40 98,50" />
          
          <path d="M 15,15 Q 40,40 85,85" />
          <path d="M 15,85 Q 40,40 85,15" />
          
          <path d="M 50,50 C 30,30 20,20 15,15" />
          <path d="M 50,50 C 70,70 80,80 85,85" />
        </svg>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col justify-between h-full gap-6">
        <div>
          {/* ¡HOLA, MARCOS! title */}
          <h2 className="text-2xl md:text-3xl font-extrabold italic tracking-tight uppercase">
            {title}
          </h2>
          {/* Subtitle */}
          <p className="text-xs md:text-sm font-semibold text-slate-200 mt-2 max-w-xl leading-relaxed">
            {message}
          </p>
        </div>

        {/* Lower Info Blocks */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
          
          {/* Block 1: Próximo Partido */}
          <div className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/5 flex flex-col justify-center min-w-[140px]">
            <span className="text-[9px] font-extrabold text-slate-300 uppercase tracking-widest leading-none">
              PRÓXIMO PARTIDO
            </span>
            <span className="text-sm font-black text-white mt-1 leading-none">
              {nextMatch}
            </span>
          </div>

          {/* Block 2: Status Ref */}
          <div className="px-4 py-2.5 rounded-xl bg-orange-500 flex flex-col justify-center min-w-[140px] shadow-sm">
            <span className="text-[9px] font-extrabold text-orange-100 uppercase tracking-widest leading-none">
              STATUS REF
            </span>
            <span className="text-sm font-black text-white mt-1 leading-none">
              {statusRef}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
