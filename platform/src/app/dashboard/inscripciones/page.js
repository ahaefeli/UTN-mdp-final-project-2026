"use client";

import React, { useState } from "react";

export default function NewInscriptionPage() {
  // MOCK STATES
  const [selectedTournament, setSelectedTournament] = useState("clausura");
  const [selectedCategory, setSelectedCategory] = useState("MASCULINO MAYORES");
  const [teamName, setTeamName] = useState("Neco Voley Club - A");
  const [coachName, setCoachName] = useState("Carlos Mendoza");

  // Inscription Categories Definition
  const categories = [
    { id: "MASCULINO MAYORES", label: "MASCULINO MAYORES" },
    { id: "FEMENINO MAYORES", label: "FEMENINO MAYORES" },
    { id: "MASCULINO SUB-18", label: "MASCULINO SUB-18" },
    { id: "FEMENINO SUB-18", label: "FEMENINO SUB-18" }
  ];

  const handleNextStep = (e) => {
    e.preventDefault();
    alert(
      `Procediendo al Paso 2: Lista de Buena Fe\n\nResumen del equipo:\n- Torneo: ${
        selectedTournament === "clausura" ? "Torneo Clausura 2026" : "Copa Aniversario"
      }\n- Categoría: ${selectedCategory}\n- Equipo: ${teamName}\n- Entrenador: ${coachName}`
    );
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    alert("¡Borrador guardado con éxito!");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto md:pt-2">
      
      {/* 1. Header Descriptive Paragraph */}
      <p className="text-sm font-semibold text-slate-500 -mt-2 leading-relaxed max-w-3xl select-none">
        Completa los datos de tu equipo para participar en la próxima temporada. Asegúrate de tener la lista de jugadores actualizada.
      </p>

      {/* 2. Stepper Component */}
      <div className="w-full bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100/50 my-2">
        <div className="grid grid-cols-3 text-center relative select-none">
          {/* Step 1: Active */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs md:text-sm font-black text-blue-950 transition-colors">
              1. Torneo y Categoría
            </span>
            <div className="w-full h-1 md:h-1.5 rounded-full bg-orange-500 mt-1 transition-all duration-300"></div>
          </div>

          {/* Step 2: Inactive */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs md:text-sm font-bold text-slate-400 transition-colors">
              2. Lista de Buena Fe
            </span>
            <div className="w-full h-1 md:h-1.5 rounded-full bg-slate-100 mt-1 transition-all duration-300"></div>
          </div>

          {/* Step 3: Inactive */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs md:text-sm font-bold text-slate-400 transition-colors">
              3. Confirmación
            </span>
            <div className="w-full h-1 md:h-1.5 rounded-full bg-slate-100 mt-1 transition-all duration-300"></div>
          </div>
        </div>
      </div>

      {/* 3. Main Grid layout (Left: Forms, Right: Sticky Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        
        {/* Left Column (Forms - 8/12 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          {/* Card 1: Selecciona el Torneo */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100/40 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-[#002F87]"></span>
              <h2 className="text-base font-black text-blue-950 select-none">
                Selecciona el Torneo
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Active Clausura */}
              <div
                onClick={() => setSelectedTournament("clausura")}
                className={`group flex flex-col gap-4 p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  selectedTournament === "clausura"
                    ? "border-[#002F87] bg-blue-50/10 shadow-sm"
                    : "border-slate-150 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Badge */}
                  <span className="px-2.5 py-1 text-[9px] font-black tracking-wider text-white bg-orange-500 rounded-md uppercase select-none leading-none shadow-sm shadow-orange-500/10">
                    INSCRIPCIÓN ABIERTA
                  </span>
                  {/* Trophy Icon */}
                  <div className={`p-2 rounded-xl transition-colors ${
                    selectedTournament === "clausura" ? "bg-blue-50 text-[#002F87]" : "bg-slate-100 text-slate-400"
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0V9.75m-5.007 0V9.75m5.007 0a3 3 0 01-3-3m-3.008 3a3 3 0 003 3m0-6V3.75m0 0h1.5m-1.5 0h-1.5" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-1 select-none">
                  <h3 className="font-extrabold text-blue-950 text-sm md:text-base leading-none">
                    Torneo Clausura 2026
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    Inicio: 15 de Agosto
                  </p>
                </div>
              </div>

              {/* Option B: Upcoming Copa */}
              <div
                onClick={() => setSelectedTournament("copa")}
                className={`group flex flex-col gap-4 p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                  selectedTournament === "copa"
                    ? "border-[#002F87] bg-blue-50/10 shadow-sm"
                    : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Badge */}
                  <span className="px-2.5 py-1 text-[9px] font-black tracking-wider text-slate-500 bg-slate-200 rounded-md uppercase select-none leading-none">
                    PRÓXIMAMENTE
                  </span>
                  {/* Ball Icon */}
                  <div className={`p-2 rounded-xl transition-colors ${
                    selectedTournament === "copa" ? "bg-blue-50 text-[#002F87]" : "bg-slate-100 text-slate-400"
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <div className="space-y-1 select-none">
                  <h3 className="font-extrabold text-slate-700 text-sm md:text-base leading-none group-hover:text-blue-955 transition-colors">
                    Copa Aniversario
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    Inicio: Noviembre
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Categoría */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100/40 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-[#002F87]"></span>
              <h2 className="text-base font-black text-blue-950 select-none">
                Categoría
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full py-3.5 px-4 text-xs font-black tracking-wider rounded-xl transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-[#002F87] text-white shadow-sm shadow-blue-900/10"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-transparent"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 3: Datos del Equipo */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100/40 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-[#002F87]"></span>
              <h2 className="text-base font-black text-blue-950 select-none">
                Datos del Equipo
              </h2>
            </div>

            <div className="flex flex-col md:flex-row gap-5">
              {/* Input 1: Nombre del Equipo */}
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase select-none">
                  NOMBRE DEL EQUIPO
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-3 text-sm font-semibold rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 focus:outline-none focus:border-[#002F87] focus:bg-white transition-all duration-200"
                  placeholder="Ej: Neco Voley Club - A"
                />
              </div>

              {/* Input 2: Entrenador Responsable */}
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 tracking-wider uppercase select-none">
                  ENTRENADOR RESPONSABLE
                </label>
                <input
                  type="text"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  className="w-full px-4 py-3 text-sm font-semibold rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 focus:outline-none focus:border-[#002F87] focus:bg-white transition-all duration-200"
                  placeholder="Ej: Carlos Mendoza"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Sticky Panel - 4/12 cols) */}
        <aside className="col-span-12 lg:col-span-4 lg:sticky lg:top-24">
          
          <div className="bg-[#002F87] text-white rounded-2xl p-6 shadow-md shadow-blue-900/10 flex flex-col gap-6 relative overflow-hidden">
            {/* Soft decorative background glow */}
            <div className="absolute -right-20 -bottom-20 w-48 h-48 rounded-full bg-blue-800/30 blur-2xl pointer-events-none"></div>

            {/* Info Icon & Title */}
            <div className="flex flex-col items-start gap-4">
              {/* Orange Info Circle */}
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-500 text-white shadow-md shadow-orange-500/15">
                <svg className="w-6 h-6 text-blue-950 font-black" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black tracking-tight select-none">
                  Requisitos de Inscripción
                </h3>
                <p className="text-xs text-blue-200/80 leading-relaxed font-medium">
                  Asegúrese de contar con la lista de buena fe actualizada antes de continuar al siguiente paso.
                </p>
              </div>
            </div>

            {/* Divider */}
            <hr className="border-blue-850/80" />

            {/* Requirements list */}
            <ul className="flex flex-col gap-3.5 select-none">
              <li className="flex items-center gap-3 text-xs md:text-sm font-semibold text-blue-50">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/20 text-orange-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                Mínimo de 8 jugadores registrados.
              </li>
              <li className="flex items-center gap-3 text-xs md:text-sm font-semibold text-blue-50">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/20 text-orange-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                Certificados médicos al día.
              </li>
              <li className="flex items-center gap-3 text-xs md:text-sm font-semibold text-blue-50">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/20 text-orange-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
                Pago de matrícula institucional.
              </li>
            </ul>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3.5 mt-2">
              <button
                type="submit"
                onClick={handleNextStep}
                className="w-full bg-orange-500 hover:bg-orange-600 text-blue-950 font-black text-xs uppercase tracking-wider py-4 px-6 rounded-xl transition-all duration-200 cursor-pointer shadow-md shadow-orange-500/10 active:scale-[0.99] flex items-center justify-center gap-2"
              >
                Siguiente Paso
                <svg className="w-4 h-4 text-blue-950" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>

              <a
                href="#"
                onClick={handleSaveDraft}
                className="text-center text-xs font-bold text-blue-200 hover:text-white transition-colors duration-200"
              >
                Guardar borrador
              </a>
            </div>

          </div>

        </aside>

      </div>

    </div>
  );
}
