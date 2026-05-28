"use client";

import React from "react";

export default function MedicalClearanceCard({ data }) {
  const { status, title, expires, progress } = data || {
    status: "VIGENTE",
    title: "Apto Físico 2024",
    expires: "15 de Noviembre, 2024",
    progress: 85,
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-b-4 border-b-emerald-500 flex flex-col justify-between h-full min-h-[220px]">
      <div>
        {/* Card Header with Icon (Green Bag) and Badge (VIGENTE) */}
        <div className="flex items-center justify-between">
          
          {/* Green Medical Briefcase Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              {/* Suitcase/Briefcase/First-Aid Bag */}
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 18.4V14.15m16.5 0c0-1.268-.63-2.39-1.593-3.068a3.745 3.745 0 01-1.043-3.296 3.745 3.745 0 01-3.296-1.043A3.745 3.745 0 0112 3c-1.268 0-2.39.63-3.068 1.593a3.746 3.746 0 01-3.296 1.043 3.745 3.745 0 01-1.043 3.296A3.745 3.745 0 013 14.15m17.25 0a3.745 3.745 0 01-1.043 3.296M3 14.15a3.745 3.745 0 001.043 3.296M9 10.5V12m6-1.5V12M12 9v4.5" />
            </svg>
          </div>

          {/* VIGENTE Status Badge */}
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold tracking-wider">
            {status}
          </span>
        </div>

        {/* Title & Expiry Text */}
        <div className="mt-4">
          <h3 className="font-extrabold text-slate-800 text-base tracking-tight leading-snug">
            {title}
          </h3>
          <p className="text-xs font-semibold text-slate-400 mt-1">
            Vence el {expires}
          </p>
        </div>

        {/* Dark Blue Progress Bar */}
        <div className="mt-4">
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#002F87] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Footer Link: Ver certificado -> */}
      <div className="mt-4 pt-3 border-t border-slate-100/80">
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="flex items-center text-xs font-black text-blue-900 hover:text-blue-950 transition-colors group cursor-pointer"
        >
          Ver certificado
          <svg className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
