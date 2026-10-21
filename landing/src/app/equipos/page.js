"use client";
import SiteFooter from "../../components/SiteFooter";
import { getPlatformLoginUrl } from '../../utils/platformUrl';
import { getPublicApiBase } from '../../utils/publicApi';
import { formatBranch, formatCategory } from '../../utils/labels';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function EquiposPage() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError("");
        const res = await fetch(`${getPublicApiBase()}/equipos/`);
        if (!res.ok) throw new Error("Error de servidor");
        const json = await res.json();
        if (active) setTeams(json.data || []);
      } catch {
        if (active) setError("No pudimos cargar los equipos. Intentá de nuevo.");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden relative">
      
      {/* 1. HEADER PÚBLICO (ENLACE "EQUIPOS" ACTIVO) */}
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

      {/* 2. HERO SECTION */}
      <section 
        style={{ backgroundImage: "url('/images/equipos/clubesafiliados.jpg')" }}
        className="relative w-full h-[220px] md:h-[250px] overflow-hidden flex items-center justify-center bg-cover bg-center"
      >
        {/* Capa Superpuesta (Overlay) */}
        <div className="absolute inset-0 w-full h-full bg-slate-50/85"></div>

        {/* Posición del Texto */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 w-full">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#001F54] uppercase tracking-tight leading-none mb-4">
            Equipos
          </h1>
          <p className="text-slate-800 text-sm sm:text-base font-medium max-w-2xl leading-relaxed">
            Los equipos que los clubes cargan en la plataforma, con su categoría y rama.
          </p>
        </div>
      </section>

      {/* 4. TARJETAS DE CLUBES (GRID) */}
      <main className="py-8 px-6 lg:px-16 max-w-7xl mx-auto w-full flex-grow flex flex-col gap-10">
        
        {isLoading ? (
          <p className="text-slate-600 font-semibold">Cargando equipos…</p>
        ) : error ? (
          <p className="text-slate-700 font-semibold">{error}</p>
        ) : teams.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl select-none shadow-sm flex flex-col items-center justify-center gap-4">
            <p className="text-slate-700 font-black text-lg">Todavía no hay equipos publicados.</p>
            <Link href="/torneos" className="bg-[#F97316] text-[#001F54] font-bold py-3 px-6 rounded-lg">
              Ver torneos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <article key={team.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {team.club_logo_url ? (
                    <img src={team.club_logo_url} alt="" className="w-12 h-12 rounded-full object-cover bg-slate-100" />
                  ) : (
                    <span className="w-12 h-12 rounded-full bg-slate-100 text-[#001F54] font-black flex items-center justify-center">
                      {team.club_name.slice(0, 1)}
                    </span>
                  )}
                  <div>
                    <h2 className="text-xl font-black text-[#001F54] leading-tight">{team.name}</h2>
                    <p className="text-sm text-slate-500 font-semibold">{team.club_name}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 font-semibold">
                  {formatCategory(team.category)} · {formatBranch(team.branch)}
                </p>
                {team.tournament_id ? (
                  <Link href={`/torneos/${team.tournament_id}`} className="text-xs font-black tracking-widest text-[#001F54] uppercase">
                    {team.tournament_name}
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        )}
        </main>

      {/* 7. FOOTER PÚBLICO */}
      <SiteFooter />

    </div>
  );
}
