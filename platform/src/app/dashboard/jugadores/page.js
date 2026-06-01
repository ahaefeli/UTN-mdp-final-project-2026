"use client";

import React, { useState } from "react";

// MOCK DATA (ESTRICTO CON IMÁGENES Y AVATARES PERSONALIZADOS)
const mockPlayers = [
  { 
    id: 1, 
    name: "Martín Echeverría", 
    dni: "40.123.456", 
    category: "Primera Div.", 
    role: "Armador", 
    medicalStatus: "vigente", 
    medicalText: "Vigente (12/24)", 
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80" 
  },
  { 
    id: 2, 
    name: "Lucas Ramírez", 
    dni: "42.987.654", 
    category: "Sub-21", 
    role: "Punta Receptor", 
    medicalStatus: "warning", 
    medicalText: "Vence en 15 días", 
    avatar: "LR" 
  },
  { 
    id: 3, 
    name: "Tomás Silva", 
    dni: "39.444.555", 
    category: "Primera Div.", 
    role: "Líbero", 
    medicalStatus: "expired", 
    medicalText: "Vencido", 
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80" 
  },
  { 
    id: 4, 
    name: "Facundo Gómez", 
    dni: "44.111.222", 
    category: "Sub-18", 
    role: "Central", 
    medicalStatus: "vigente", 
    medicalText: "Vigente (05/25)", 
    avatar: "FG" 
  }
];

export default function PlayersPage() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const categories = [
    { id: "Todos", label: "Todos" },
    { id: "Primera Div.", label: "Primera Div." },
    { id: "Sub-21", label: "Sub-21" },
    { id: "Sub-18", label: "Sub-18" },
    { id: "Sub-16", label: "Sub-16" }
  ];

  // Dynamically filter mock players based on active category tab selection
  const filteredPlayers = mockPlayers.filter((player) => {
    if (selectedCategory === "Todos") return true;
    return player.category.toUpperCase() === selectedCategory.toUpperCase();
  });

  // Auxiliary Component for Apto Físico Badges
  const MedicalBadge = ({ status, text }) => {
    switch (status) {
      case "vigente":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 text-xs font-bold leading-none select-none">
            {/* Checkmark Icon */}
            <svg className="w-4 h-4 text-blue-800" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {text}
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold leading-none select-none shadow-sm shadow-orange-500/10">
            {/* Warning triangle icon */}
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
            </svg>
            {text}
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold leading-none select-none">
            {/* Cross/Alert icon */}
            <svg className="w-4 h-4 text-rose-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {text}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto md:pt-2">
      
      {/* Selector de Categorías (Tabs Capitalizados sin todo en mayúsculas) */}
      <div className="flex flex-wrap gap-2 items-center">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 text-xs font-black tracking-wider rounded-full transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[#002F87] text-white shadow-sm shadow-blue-950/15"
                  : "bg-white hover:bg-slate-50 text-slate-500 border border-slate-200/50"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Lista de Jugadores (Estilo Tarjetas Flotantes sin Borde Duro) */}
      <div className="w-full">
        
        {/* Column Headers (Visible only on desktop screens) */}
        <div className="hidden md:grid grid-cols-12 px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-3 select-none">
          <div className="col-span-4">JUGADOR</div>
          <div className="col-span-3">CATEGORÍA & ROL</div>
          <div className="col-span-3">APTO FÍSICO</div>
          <div className="col-span-2 text-right">ACCIONES</div>
        </div>

        {/* Dynamic Card Rows */}
        <div className="space-y-3">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => {
              const isImage = player.avatar.startsWith("http");
              
              // Custom styles for avatars matching specifications
              let avatarClass = "";
              if (isImage) {
                avatarClass = "";
              } else if (player.avatar === "LR") {
                avatarClass = "bg-[#E0F2FE] text-[#002F87]"; // Lucas: celeste claro (bg-sky-100), dark blue text
              } else if (player.avatar === "FG") {
                avatarClass = "bg-[#F3F4F6] text-[#1F2937]"; // Facundo: gris claro (bg-slate-100), text negro/gris oscuro
              } else {
                avatarClass = "bg-slate-100 text-slate-700 font-bold";
              }

              return (
                <div
                  key={player.id}
                  className="grid grid-cols-12 items-center gap-4 bg-white p-4 md:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Column 1: Player Profile Details */}
                  <div className="col-span-12 md:col-span-4 flex items-center gap-3.5">
                    
                    {/* Circle Avatar (Real image Unsplash or custom color background) */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-xs flex-shrink-0 overflow-hidden shadow-inner ${avatarClass}`}>
                      {isImage ? (
                        <img 
                          src={player.avatar} 
                          alt={player.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        player.avatar
                      )}
                    </div>
                    
                    {/* Name and DNI */}
                    <div className="space-y-0.5">
                      <p className="text-sm font-black text-[#002F87] hover:text-blue-950 transition-colors">
                        {player.name}
                      </p>
                      <p className="text-xs text-slate-400 font-semibold">
                        DNI: {player.dni}
                      </p>
                    </div>
                  </div>

                  {/* Column 2: Category & Role */}
                  <div className="col-span-12 md:col-span-3 flex flex-col items-start gap-1">
                    <span className="text-[9px] font-black tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-[4px] select-none">
                      {player.category}
                    </span>
                    <span className="text-xs text-slate-500 font-medium md:pl-0.5">
                      {player.role}
                    </span>
                  </div>

                  {/* Column 3: Medical Clearance Badge */}
                  <div className="col-span-12 md:col-span-3 flex items-center">
                    <MedicalBadge status={player.medicalStatus} text={player.medicalText} />
                  </div>

                  {/* Column 4: Minimal Action Buttons */}
                  <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2.5">
                    {/* View Action (Eye) */}
                    <button
                      title="Ver Detalles"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`Visualizando detalles de ${player.name}`);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-[#002F87] hover:bg-slate-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-slate-150"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    
                    {/* Edit Action (Pencil) */}
                    <button
                      title="Editar Jugador"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`Editando jugador ${player.name}`);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-[#002F87] hover:bg-slate-50 transition-all duration-200 cursor-pointer border border-transparent hover:border-slate-150"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center gap-3">
              <svg className="w-12 h-12 text-slate-350" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197" />
              </svg>
              <p className="text-sm font-semibold select-none">
                No se encontraron jugadores en la categoría "{selectedCategory}".
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Paginación (Footer) */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200/50 pt-5 gap-4">
        
        {/* Left Info: Mostrando 1-4 de 48 jugadores */}
        <span className="text-xs font-semibold text-slate-400 select-none">
          Mostrando 1-{filteredPlayers.length} de 48 jugadores
        </span>

        {/* Right Arrow Controls */}
        <div className="flex items-center gap-2">
          
          {/* Previous Button */}
          <button
            title="Anterior"
            onClick={(e) => e.preventDefault()}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors duration-200 cursor-pointer shadow-sm"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          
          {/* Next Button */}
          <button
            title="Siguiente"
            onClick={(e) => e.preventDefault()}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors duration-200 cursor-pointer shadow-sm"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

        </div>

      </div>

    </div>
  );
}
