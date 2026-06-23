"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

// MOCK DATA (PARTIDOS Y TABLA DE POSICIONES)
const mockMatches = [
  {
    id: 1,
    category: "PRIMERA MASCULINO",
    location: "Polideportivo Municipal",
    status: "live", // live, finished
    statusText: "EN VIVO",
    team1: {
      name: "Club Huracán",
      logo: "/images/logos/clubhuracan.jpg",
      setsWon: 2,
      setPoints: [25, 22, 18],
    },
    team2: {
      name: "Rivadavia",
      logo: "/images/logos/rivadavia.png",
      setsWon: 1,
      setPoints: [21, 25, 15],
    },
    progressLabel: "Set 3 Progress",
    progressPercent: 65, // porcentaje de avance del set actual (ej: puntos sumados / total promedio)
  },
  {
    id: 2,
    category: "PRIMERA MASCULINO",
    location: "Polideportivo Municipal",
    status: "finished",
    statusText: "Finalizado",
    team1: {
      name: "Vóley Necochea",
      initials: "VNK",
      setsWon: 0,
      setPoints: [18, 21, 15],
    },
    team2: {
      name: "Club Lobería",
      initials: "CL",
      setsWon: 3,
      setPoints: [25, 25, 25],
    },
  },
];

const mockStandings = [
  { pos: 1, name: "Club Lobería", initials: "CL", pts: 15, pj: 5, pg: 5, pp: 0 },
  { pos: 2, name: "Club Huracán", logo: "/images/logos/clubhuracan.jpg", pts: 12, pj: 5, pg: 4, pp: 1 },
  { pos: 3, name: "Rivadavia", logo: "/images/logos/rivadavia.png", pts: 9, pj: 4, pg: 3, pp: 1 },
  { pos: 4, name: "Vóley Necochea", initials: "VNK", pts: 6, pj: 5, pg: 2, pp: 3 },
];

export default function ResultadosPage() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  // Estados de Filtros
  const [selectedCategory, setSelectedCategory] = useState("Primera División");
  const [selectedBranch, setSelectedBranch] = useState("Masculino");
  const [selectedFixture, setSelectedFixture] = useState("Fecha 5 (Actual)");

  const navigateToLogin = (e) => {
    e.preventDefault();
    window.location.href = "/login";
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!emailInput) return;
    alert(`¡Gracias por suscribirte con: ${emailInput}!`);
    setEmailInput("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      
      {/* 1. HEADER PÚBLICO */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-100 h-20 w-full flex items-center justify-between px-4 md:px-8 lg:px-16 select-none relative">
        
        {/* Left: Logo LNV */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="font-black italic text-2xl md:text-3xl leading-tight tracking-tight select-none max-w-[200px] sm:max-w-none cursor-pointer"><span className="text-[#001F54]">VOLEY</span><span className="text-[#F97316]">HUB</span></span>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-10">
          <Link 
            href="/torneos" 
            className={`text-sm font-semibold pb-1 transition-colors duration-200 border-b-2 ${pathname === '/torneos' ? 'text-[#001F54] border-orange-500 font-bold' : 'text-slate-600 border-transparent hover:text-[#001F54]'}`}
          >
            Torneos
          </Link>
          <Link 
            href="/equipos" 
            className={`text-sm font-semibold pb-1 transition-colors duration-200 border-b-2 ${pathname === '/equipos' ? 'text-[#001F54] border-orange-500 font-bold' : 'text-slate-600 border-transparent hover:text-[#001F54]'}`}
          >
            Equipos
          </Link>
          <Link 
            href="/resultados" 
            className={`text-sm font-semibold pb-1 transition-colors duration-200 border-b-2 ${pathname === '/resultados' ? 'text-[#001F54] border-orange-500 font-bold' : 'text-slate-600 border-transparent hover:text-[#001F54]'}`}
          >
            Resultados
          </Link>
          <Link 
            href="/reglamento" 
            className={`text-sm font-semibold pb-1 transition-colors duration-200 border-b-2 ${pathname === '/reglamento' ? 'text-[#001F54] border-orange-500 font-bold' : 'text-slate-600 border-transparent hover:text-[#001F54]'}`}
          >
            Reglamento
          </Link>
        </nav>

        {/* Right: Acceso Clubes Button & User Icon & Mobile Hamburger */}
        <div className="flex items-center gap-4">
          <a
            href="/login"
            onClick={navigateToLogin}
            className="bg-[#001F54] hover:bg-blue-950 text-white font-semibold text-[11px] md:text-sm py-2 px-3 md:py-2.5 md:px-5 rounded-lg transition-all duration-200 cursor-pointer shadow-sm shadow-blue-950/10 whitespace-nowrap hidden sm:flex"
          >
            Acceso Clubes
          </a>
          <a href="/login" onClick={navigateToLogin} className="hidden sm:block flex-shrink-0">
            <svg className="w-6 h-6 text-[#001F54] cursor-pointer hover:opacity-80 transition-opacity shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </a>

          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex sm:hidden items-center justify-center p-2 rounded-lg text-[#001F54] hover:bg-slate-50 transition-colors focus:outline-none"
            aria-label="Alternar menú móvil"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-20 left-0 w-full bg-white shadow-lg flex-col p-6 z-40 flex flex-col gap-4">
            <Link href="/torneos" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#001F54] hover:opacity-80 transition-opacity">
              Torneos
            </Link>
            <Link href="/equipos" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#001F54] hover:opacity-80 transition-opacity">
              Equipos
            </Link>
            <Link href="/resultados" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#001F54] hover:opacity-80 transition-opacity">
              Resultados
            </Link>
            <Link href="/reglamento" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#001F54] hover:opacity-80 transition-opacity">
              Reglamento
            </Link>
            <hr />
            <a
              href="/login"
              onClick={(e) => {
                setIsMobileMenuOpen(false);
                navigateToLogin(e);
              }}
              className="w-full bg-[#001F54] hover:bg-blue-950 text-white font-semibold text-center py-3 rounded-lg transition-all duration-200 cursor-pointer shadow-sm shadow-blue-950/10 text-sm"
            >
              Acceso Clubes
            </a>
          </div>
        )}

      </header>

      {/* 2. HERO & TITLE */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-10">
        <div className="mb-8 select-none">
          <h1 className="text-4xl font-bold text-[#001F54] tracking-tight">
            Resultados y Posiciones
          </h1>
        </div>

        {/* 3. BARRA DE FILTROS */}
        <section className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6 mb-10 select-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Categoría Filter */}
            <div className="flex flex-col">
              <label className="text-[11px] font-black text-slate-500 tracking-wider mb-2 uppercase">
                Categoría
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-350 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 appearance-none outline-none focus:border-[#001F54] transition-all pr-10 cursor-pointer shadow-sm"
                >
                  <option value="Primera División">Primera División</option>
                  <option value="Sub-21">Sub-21</option>
                  <option value="Sub-18">Sub-18</option>
                  <option value="Sub-16">Sub-16</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Rama Filter */}
            <div className="flex flex-col">
              <label className="text-[11px] font-black text-slate-500 tracking-wider mb-2 uppercase">
                Rama
              </label>
              <div className="relative">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-350 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 appearance-none outline-none focus:border-[#001F54] transition-all pr-10 cursor-pointer shadow-sm"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Mixto">Mixto</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Jornada Filter */}
            <div className="flex flex-col">
              <label className="text-[11px] font-black text-slate-500 tracking-wider mb-2 uppercase">
                Jornada
              </label>
              <div className="relative">
                <select
                  value={selectedFixture}
                  onChange={(e) => setSelectedFixture(e.target.value)}
                  className="w-full bg-white border border-slate-200 hover:border-slate-350 rounded-2xl px-4 py-3.5 text-sm font-semibold text-slate-700 appearance-none outline-none focus:border-[#001F54] transition-all pr-10 cursor-pointer shadow-sm"
                >
                  <option value="Fecha 5 (Actual)">Fecha 5 (Actual)</option>
                  <option value="Fecha 4">Fecha 4</option>
                  <option value="Fecha 3">Fecha 3</option>
                  <option value="Fecha 2">Fecha 2</option>
                  <option value="Fecha 1">Fecha 1</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 4. GRILLA PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMNA PARTIDOS (8/12) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Cabecera de Columna */}
            <div className="flex items-center justify-between select-none">
              <h2 className="text-2xl font-black text-[#001F54] tracking-tight">
                Últimos Partidos
              </h2>
              <span className="bg-orange-50 border border-orange-100 text-[#F97316] text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg uppercase shadow-sm">
                FECHA 5
              </span>
            </div>

            {/* LISTADO DE TARJETAS */}
            {mockMatches.map((match) => {
              const isLive = match.status === "live";

              // Calculate progress percent for live matches based on current set scores
              let p1Percent = 50;
              let p2Percent = 50;
              if (isLive) {
                const lastIndex = match.team1.setPoints.length - 1;
                const p1 = match.team1.setPoints[lastIndex] || 0;
                const p2 = match.team2.setPoints[lastIndex] || 0;
                const total = p1 + p2;
                if (total > 0) {
                  p1Percent = Math.round((p1 / total) * 100);
                  p2Percent = 100 - p1Percent;
                }
              }

              return (
                <div
                  key={match.id}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden flex flex-col gap-5"
                >
                  {/* Status Badge above the Category/Location row */}
                  <div className="flex flex-col gap-2.5 select-none">
                    <div className="flex justify-start">
                      <span
                        className={`text-[9px] font-black tracking-wider px-2.5 py-1 rounded-md uppercase ${
                          isLive
                            ? "bg-[#F97316] text-white animate-pulse"
                            : "bg-slate-100 text-slate-500 font-bold"
                        }`}
                      >
                        {match.statusText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                        {match.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {match.location}
                      </span>
                    </div>
                  </div>

                  {/* Detalle de los Equipos */}
                  <div className="flex flex-col gap-4">
                    
                    {/* Fila Equipo 1 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        {match.team1.logo ? (
                          <img
                            src={match.team1.logo}
                            alt={match.team1.name}
                            className="w-10 h-10 rounded-full border border-slate-100 object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center flex-shrink-0 select-none">
                            {match.team1.initials}
                          </div>
                        )}
                        <span className="font-bold text-[#001F54] text-base md:text-lg">
                          {match.team1.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-5">
                        {/* Puntos de sets anteriores/actual */}
                        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400 select-none">
                          {match.team1.setPoints.map((pts, idx) => {
                            const isLast = idx === match.team1.setPoints.length - 1;
                            return (
                              <span
                                key={idx}
                                className={
                                  isLive && isLast
                                    ? "text-[#001F54] font-black text-sm"
                                    : "text-slate-400"
                                }
                              >
                                {pts}
                              </span>
                            );
                          })}
                        </div>
                        {/* Sets Ganados */}
                        <span className="text-3xl font-black text-[#001F54] w-6 text-right select-none">
                          {match.team1.setsWon}
                        </span>
                      </div>
                    </div>

                    {/* Fila Equipo 2 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        {match.team2.logo ? (
                          <img
                            src={match.team2.logo}
                            alt={match.team2.name}
                            className="w-10 h-10 rounded-full border border-slate-100 object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#001F54] text-white font-black text-xs flex items-center justify-center flex-shrink-0 select-none">
                            {match.team2.initials}
                          </div>
                        )}
                        <span className="font-bold text-[#001F54] text-base md:text-lg">
                          {match.team2.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-5">
                        {/* Puntos de sets anteriores/actual */}
                        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400 select-none">
                          {match.team2.setPoints.map((pts, idx) => {
                            const isLast = idx === match.team2.setPoints.length - 1;
                            return (
                              <span
                                key={idx}
                                className={
                                  isLive && isLast
                                    ? "text-[#001F54] font-black text-sm"
                                    : "text-slate-400"
                                }
                              >
                                {pts}
                              </span>
                            );
                          })}
                        </div>
                        {/* Sets Ganados */}
                        <span className="text-3xl font-black text-[#001F54] w-6 text-right select-none">
                          {match.team2.setsWon}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Barra de Progreso del Set (Sólo para partidos En Vivo) */}
                  {isLive && (
                    <div className="border-t border-slate-100 pt-4 flex flex-col gap-2 select-none">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        {match.progressLabel}
                      </span>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                        <div
                          className="bg-[#001F54] h-full transition-all duration-500"
                          style={{ width: `${p1Percent}%` }}
                        ></div>
                        <div
                          className="bg-[#F97316] h-full transition-all duration-500"
                          style={{ width: `${p2Percent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}

          </div>

          {/* COLUMNA TABLA DE POSICIONES (4/12) */}
          <div className="lg:col-span-4">
            
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col gap-6">
              
              <h2 className="text-2xl font-black text-[#001F54] tracking-tight select-none">
                Tabla de Posiciones
              </h2>

              {/* Tabla Compacta */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 select-none">
                      <th className="text-[10px] font-black text-slate-400 tracking-wider pb-3 uppercase w-8">
                        POS
                      </th>
                      <th className="text-[10px] font-black text-slate-400 tracking-wider pb-3 uppercase">
                        EQUIPO
                      </th>
                      <th className="text-[10px] font-black text-slate-400 tracking-wider pb-3 uppercase text-center w-10">
                        PTS
                      </th>
                      <th className="text-[10px] font-black text-slate-400 tracking-wider pb-3 uppercase text-center w-8">
                        PJ
                      </th>
                      <th className="text-[10px] font-black text-slate-400 tracking-wider pb-3 uppercase text-center w-8">
                        PG
                      </th>
                      <th className="text-[10px] font-black text-slate-400 tracking-wider pb-3 uppercase text-center w-8">
                        PP
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockStandings.map((team) => (
                      <tr key={team.pos} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                        {/* POS */}
                        <td className="py-4 font-black text-[#001F54] text-xs sm:text-sm select-none">
                          {team.pos}
                        </td>
                        {/* EQUIPO */}
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            {team.logo ? (
                              <img
                                src={team.logo}
                                alt={team.name}
                                className="w-6 h-6 rounded-full border border-slate-100 object-cover flex-shrink-0"
                              />
                            ) : (
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[8px] flex-shrink-0 select-none ${
                                  team.initials === "CL" ? "bg-[#001F54] text-white" : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {team.initials}
                              </div>
                            )}
                            <span className="font-bold text-[#001F54] text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] sm:max-w-none">
                              {team.name}
                            </span>
                          </div>
                        </td>
                        {/* PTS */}
                        <td className="py-4 font-black text-[#001F54] text-xs sm:text-sm text-center select-none">
                          {team.pts}
                        </td>
                        {/* PJ */}
                        <td className="py-4 font-semibold text-slate-500 text-xs sm:text-sm text-center select-none">
                          {team.pj}
                        </td>
                        {/* PG */}
                        <td className="py-4 font-semibold text-slate-500 text-xs sm:text-sm text-center select-none">
                          {team.pg}
                        </td>
                        {/* PP */}
                        <td className="py-4 font-semibold text-slate-500 text-xs sm:text-sm text-center select-none">
                          {team.pp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Botón Ver Tabla Completa */}
              <button
                onClick={() => alert("Mostrando tabla de posiciones completa...")}
                className="w-full bg-transparent border border-slate-200 hover:border-slate-350 text-slate-700 hover:text-slate-900 font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all duration-200 cursor-pointer text-center active:scale-[0.99] select-none"
              >
                Ver Tabla Completa
              </button>

            </div>

          </div>
              


        </div>

      </main>

      {/* 5. FOOTER PÚBLICO */}
      <footer className="bg-slate-950 text-white pt-16 pb-8 px-6 lg:px-16 w-full select-none border-t border-slate-900/60 relative overflow-hidden">
        
        {/* Soft radial blue glow */}
        <div className="absolute left-[-10%] bottom-[-10%] w-96 h-96 rounded-full bg-blue-900/10 blur-3xl pointer-events-none"></div>
 
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-12 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Col 1: Logo & Brief Info */}
            <div className="flex flex-col gap-4 items-start">
              <div className="flex flex-col text-left">
                <span className="font-black text-2xl tracking-tight leading-none select-none">
                  <span className="text-white">VOLEY</span><span className="text-[#F97316]">HUB</span>
                </span>
              </div>
              <p className="text-xs text-blue-200/50 leading-relaxed font-semibold max-w-xs">
                El software de gestión deportiva que conecta a ligas, clubes y jugadores de vóley en un solo lugar. Simplificá la administración y viví el torneo punto a punto.
              </p>
            </div>

            {/* Col 2: NAVEGACIÓN */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-black tracking-widest text-[#FF8A00] uppercase">
                NAVEGACIÓN
              </h4>
              <ul className="flex flex-col gap-2.5 text-xs text-blue-200/60 font-bold">
                <li><Link href="/sitemap" className="text-xs hover:text-white transition-colors duration-200">SITEMAP</Link></li>
                <li><Link href="/privacidad" className="text-xs hover:text-white transition-colors duration-200">POLÍTICAS DE PRIVACIDAD</Link></li>
                <li><Link href="/contacto" className="text-xs hover:text-white transition-colors duration-200">CONTACTO</Link></li>
                <li><a href="https://feva.org.ar/" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-white transition-colors duration-200">FEVA</a></li>
              </ul>
            </div>

            {/* Col 3: REDES */}
            <div className="flex flex-col items-start gap-4">
              <h4 className="text-xs font-black tracking-widest text-[#FF8A00] uppercase">
                REDES
              </h4>
              <div className="flex items-center gap-3">
                {/* Instagram Icon */}
                <a href="#" className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 hover:text-orange-500 text-blue-200 transition-all duration-200" title="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                {/* WhatsApp Icon */}
                <a href="#" className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 hover:text-orange-500 text-blue-200 transition-all duration-200" title="WhatsApp">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.458L0 24zm6.59-4.846c1.666.988 3.311 1.488 4.965 1.489 5.568 0 10.104-4.537 10.107-10.108.002-2.699-1.044-5.237-2.949-7.144C16.865 1.48 14.333.435 11.64.435 6.072.435 1.535 4.973 1.533 10.542c0 1.765.485 3.491 1.456 5.07l-.991 3.618 3.65-.956zm12.38-5.385c-.328-.164-1.942-.958-2.242-1.069-.3-.109-.519-.164-.738.164-.219.328-.847 1.069-1.039 1.288-.192.219-.384.246-.712.082-1.391-.698-2.285-1.161-3.197-2.733-.243-.419.243-.389.697-1.293.076-.153.038-.287-.019-.397-.058-.11-.519-1.251-.712-1.716-.188-.453-.378-.39-.519-.397-.134-.007-.287-.008-.438-.008-.151 0-.397.057-.604.284-.206.227-.788.771-.788 1.881 0 1.11.808 2.183.92 2.336.112.153 1.59 2.428 3.85 3.407.538.232.957.371 1.284.475.54.172 1.03.147 1.417.09.432-.064 1.942-.795 2.216-1.56.274-.766.274-1.423.192-1.56-.082-.138-.3-.219-.628-.383z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Col 4: NEWSLETTER */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-black tracking-widest text-[#FF8A00] uppercase">
                NEWSLETTER
              </h4>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2">
                <p className="text-xs text-blue-200/50 font-semibold leading-normal select-none">
                  Suscribite a nuestro newsletter para recibir las últimas actas y boletines directo en tu mail.
                </p>
                <div className="relative flex items-center mt-1">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Tu correo electrónico..."
                    className="w-full pl-4 pr-12 py-3.5 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#FF8A00] transition-colors"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 bg-[#FF8A00] hover:bg-orange-600 text-blue-950 p-2.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer shadow-sm active:scale-95"
                    title="Suscribirse"
                  >
                    <svg className="w-3.5 h-3.5 text-blue-950" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>

          </div>

          <hr className="border-slate-900/60 my-2" />

          {/* Footer Bottom copyright */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="text-xs text-blue-200/35 select-none font-semibold">
              © 2026 VOLEYHUB
            </span>
          </div>

        </div>

      </footer>

    </div>
  );
}
