"use client";
import SiteFooter from "../../../components/SiteFooter";
import { getPlatformLoginUrl } from '../../../utils/platformUrl';
import { getPublicApiBase } from '../../../utils/publicApi';
import { formatStatus } from '../../../utils/labels';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

const adaptMatchesForUI = (apiMatches) => {
  return apiMatches.map(match => {
    let localSetsWon = 0;
    let visitorSetsWon = 0;
    const localSetPoints = [];
    const visitorSetPoints = [];
    
    const sets = match.sets_data?.sets || [];
    sets.sort((a, b) => a.set_number - b.set_number);
    
    sets.forEach(set => {
      const lScore = set.local_score || 0;
      const vScore = set.visitor_score || 0;
      localSetPoints.push(lScore);
      visitorSetPoints.push(vScore);
      if (lScore > vScore) {
        localSetsWon += 1;
      } else if (vScore > lScore) {
        visitorSetsWon += 1;
      }
    });
    
    return {
      id: match.id || crypto.randomUUID(),
      category: match.tournament_stage_name || "Fase Regular",
      location: "Sede a confirmar",
      status: match.status === "IN_PROGRESS" ? "live" : match.status.toLowerCase(),
      statusText: formatStatus(match.status),
      team1: {
        name: match.local_team_name,
        logo: match.local_club_logo_url,
        initials: match.local_team_name.substring(0,3).toUpperCase(),
        setsWon: localSetsWon,
        setPoints: localSetPoints
      },
      team2: {
        name: match.visitor_team_name,
        logo: match.visitor_club_logo_url,
        initials: match.visitor_team_name.substring(0,3).toUpperCase(),
        setsWon: visitorSetsWon,
        setPoints: visitorSetPoints
      },
      progressLabel: "Set Progress",
      progressPercent: 50
    };
  });
};

const adaptStandingsForUI = (apiStandings) => {
  return apiStandings.map((team, index) => ({
    pos: index + 1,
    name: team.team_name,
    logo: team.club_logo_url,
    initials: team.team_name.substring(0,3).toUpperCase(),
    pts: team.puntos,
    pj: team.pj,
    pg: team.pg,
    pp: team.pp
  }));
};

export default function TorneoDetallePage() {
  const pathname = usePathname();
  const params = useParams();
  const id = params.id;

  // Estados
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Estados de Filtros
  const [selectedCategory, setSelectedCategory] = useState("Primera División");
  const [selectedBranch, setSelectedBranch] = useState("Masculino");
  const [selectedFixture, setSelectedFixture] = useState("Fecha 5 (Actual)");

  useEffect(() => {
    if (!id) return;
    const fetchTournamentData = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const baseUrl = getPublicApiBase();
        const [matchesRes, standingsRes] = await Promise.all([
          fetch(`${baseUrl}/partidos/?tournament_id=${id}`),
          fetch(`${baseUrl}/torneos/${id}/posiciones/`)
        ]);
        if (!matchesRes.ok || !standingsRes.ok) throw new Error("Error fetching");
        
        const rawMatchesData = await matchesRes.json();
        const rawStandingsData = await standingsRes.json();
        
        const matchesArray = rawMatchesData.data || [];
        const standingsArray = Array.isArray(rawStandingsData) ? rawStandingsData : [];
        
        setMatches(adaptMatchesForUI(matchesArray));
        setStandings(adaptStandingsForUI(standingsArray));
      } catch (error) {
        console.error("Error Fetching Data:", error);
        setLoadError("No pudimos cargar las competencias. Intentá de nuevo.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTournamentData();
  }, [id]);
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center py-16 flex flex-col items-center justify-center gap-4">
          <span className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-slate-500 font-bold text-sm">Cargando detalles del torneo...</p>
        </div>
      </div>
    );
  }

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
            className={`text-sm font-semibold pb-1 transition-colors duration-200 border-b-2 ${pathname.startsWith('/torneos') ? 'text-[#001F54] border-orange-500 font-bold' : 'text-slate-600 border-transparent hover:text-[#001F54]'}`}
          >
            Torneos
          </Link>
          <Link 
            href="/resultados" 
            className={`text-sm font-semibold pb-1 transition-colors duration-200 border-b-2 ${pathname === '/resultados' ? 'text-[#001F54] border-orange-500 font-bold' : 'text-slate-600 border-transparent hover:text-[#001F54]'}`}
          >
            Resultados
          </Link>
          <Link 
            href="/equipos" 
            className={`text-sm font-semibold pb-1 transition-colors duration-200 border-b-2 ${pathname === '/equipos' ? 'text-[#001F54] border-orange-500 font-bold' : 'text-slate-600 border-transparent hover:text-[#001F54]'}`}
          >
            Equipos
          </Link>
          <Link 
            href="/reglamento" 
            className={`text-sm font-semibold pb-1 transition-colors duration-200 border-b-2 ${pathname === '/reglamento' ? 'text-[#001F54] border-orange-500 font-bold' : 'text-slate-600 border-transparent hover:text-[#001F54]'}`}
          >
            Reglamento
          </Link>
          <Link 
            href="/plataforma" 
            className={`text-sm font-semibold pb-1 transition-colors duration-200 border-b-2 ${
              pathname === '/plataforma' 
                ? 'text-[#001F54] border-orange-500 font-bold' 
                : 'text-slate-600 border-transparent hover:text-[#001F54]'
            }`}
          >
            La Plataforma
          </Link>
        </nav>

        {/* Right: Ingresar Button & User Icon & Mobile Hamburger */}
        <div className="flex items-center gap-4">
          <a
            href={getPlatformLoginUrl()}
            className="bg-[#001F54] hover:bg-blue-950 text-white font-semibold text-[11px] md:text-sm py-2 px-3 md:py-2.5 md:px-5 rounded-lg transition-all duration-200 cursor-pointer shadow-sm shadow-blue-950/10 whitespace-nowrap hidden sm:flex"
          >
            Ingresar
          </a>
          <a href={getPlatformLoginUrl()} className="hidden sm:block flex-shrink-0">
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
            <Link href="/resultados" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#001F54] hover:opacity-80 transition-opacity">
              Resultados
            </Link>
            <Link href="/equipos" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#001F54] hover:opacity-80 transition-opacity">
              Equipos
            </Link>

            <Link href="/reglamento" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#001F54] hover:opacity-80 transition-opacity">
              Reglamento
            </Link>
            <Link 
              href="/plataforma" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="text-xl font-bold text-[#001F54] hover:opacity-80 transition-opacity"
            >
              La Plataforma
            </Link>
            <hr />
            <a
              href={getPlatformLoginUrl()}
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full bg-[#001F54] hover:bg-blue-950 text-white font-semibold text-center py-3 rounded-lg transition-all duration-200 cursor-pointer shadow-sm shadow-blue-950/10 text-sm"
            >
              Ingresar
            </a>
          </div>
        )}

      </header>

      {/* 2. HERO & TITLE */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-10">
        <div className="mb-8 select-none">
          <h1 className="text-4xl font-bold text-[#001F54] tracking-tight">
            Resultados y Posiciones del Torneo
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

            <div className="flex flex-col">
              <label className="text-[11px] font-black text-slate-500 tracking-wider mb-2 uppercase">
                Fecha
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

        {loadError ? (
          <div className="max-w-3xl mx-auto px-6 py-10">
            <p className="bg-red-50 border border-red-200 text-red-700 font-bold text-sm rounded-3xl p-6 text-center">
              {loadError}
            </p>
          </div>
        ) : null}

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
            {matches.length > 0 ? (
              matches.map((match) => {
                const isLive = match.status === "live";
                const setsTeam1 = match.team1.setPoints;
                const setsTeam2 = match.team2.setPoints;

                let p1Percent = 50;
                let p2Percent = 50;
                if (isLive && setsTeam1.length > 0) {
                  const lastIndex = setsTeam1.length - 1;
                  const p1 = setsTeam1[lastIndex] || 0;
                  const p2 = setsTeam2[lastIndex] || 0;
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
                    {/* Status Badge */}
                    <div className="flex flex-col gap-2.5 select-none">
                      <div className="flex justify-start">
                        <span
                          className={`text-[9px] font-black tracking-wider px-2.5 py-1 rounded-md uppercase ${
                            isLive
                              ? "bg-[#F97316] text-white animate-pulse"
                              : "bg-slate-100 text-slate-500 font-bold"
                          }`}
                        >
                          {isLive ? "EN VIVO" : "Finalizado"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                          {match.category || "Primera División"}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {match.location || "Sede oficial"}
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
                            {setsTeam1.map((pts, idx) => {
                              const isLast = idx === setsTeam1.length - 1;
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
                            {setsTeam2.map((pts, idx) => {
                              const isLast = idx === setsTeam2.length - 1;
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

                    {/* Barra de Progreso del Set */}
                    {isLive && (
                      <div className="border-t border-slate-100 pt-4 flex flex-col gap-2 select-none">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          Progreso Set Actual
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
              })
            ) : (
              <div className="text-center py-12 bg-white border border-slate-100 rounded-3xl select-none shadow-sm flex flex-col items-center justify-center gap-3">
                <p className="text-slate-500 font-bold text-sm">No hay partidos registrados en este torneo.</p>
              </div>
            )}

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
                     {standings.length > 0 ? (
                      standings.map((team) => (
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
                                  className="w-6 h-6 rounded-full flex items-center justify-center font-black text-[8px] flex-shrink-0 select-none bg-slate-200 text-slate-700"
                                >
                                  {team.initials}
                                </div>
                              )}
                              <span className="font-bold text-[#001F54] text-xs sm:text-sm whitespace-normal break-words min-w-0">
                                {team.name}
                              </span>
                            </div>
                          </td>
                          {/* PTS */}
                          <td className="py-4 font-black text-[#001F54] text-xs sm:text-sm text-center select-none">
                            {team.pts ?? 0}
                          </td>
                          {/* PJ */}
                          <td className="py-4 font-semibold text-slate-500 text-xs sm:text-sm text-center select-none">
                            {team.pj ?? 0}
                          </td>
                          {/* PG */}
                          <td className="py-4 font-semibold text-slate-500 text-xs sm:text-sm text-center select-none">
                            {team.pg ?? 0}
                          </td>
                          {/* PP */}
                          <td className="py-4 font-semibold text-slate-500 text-xs sm:text-sm text-center select-none">
                            {team.pp ?? 0}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-xs text-slate-400 italic">No hay posiciones registradas.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                3-0 o 3-1: el ganador suma 3 y el perdedor 0. 3-2: el ganador suma 2 y el perdedor 1.
                Si empatan en puntos, se mira partidos ganados y después la diferencia de sets.
              </p>

            </div>

          </div>
              
        </div>

      </main>

      {/* 5. FOOTER PÚBLICO */}
      <SiteFooter />

    </div>
  );
}
