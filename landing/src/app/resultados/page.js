"use client";
import SiteFooter from "../../components/SiteFooter";
import { getPlatformLoginUrl } from '../../utils/platformUrl';
import { getPublicApiBase } from '../../utils/publicApi';
import { formatBranch, formatCategory, formatStatus } from '../../utils/labels';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ResultadosPage() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setError("");
        const res = await fetch(`${getPublicApiBase()}/torneos/`);
        if (!res.ok) throw new Error("Error de servidor");
        const json = await res.json();
        if (active) setTournaments(json.data || []);
      } catch {
        if (active) setError("No pudimos cargar los resultados. Intentá de nuevo.");
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
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-100 h-20 w-full flex items-center justify-between px-4 md:px-8 lg:px-16 select-none relative">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="font-black italic text-2xl md:text-3xl leading-tight tracking-tight select-none max-w-[200px] sm:max-w-none cursor-pointer"><span className="text-[#001F54]">VOLEY</span><span className="text-[#F97316]">HUB</span></span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 lg:gap-10">
          <Link href="/torneos" className="text-sm font-semibold pb-1 text-slate-600 border-b-2 border-transparent hover:text-[#001F54]">
            Torneos
          </Link>
          <Link href="/resultados" className={`text-sm font-semibold pb-1 transition-colors duration-200 border-b-2 ${pathname === '/resultados' ? 'text-[#001F54] border-orange-500 font-bold' : 'text-slate-600 border-transparent hover:text-[#001F54]'}`}>
            Resultados
          </Link>
          <Link href="/equipos" className="text-sm font-semibold pb-1 text-slate-600 border-b-2 border-transparent hover:text-[#001F54]">
            Equipos
          </Link>
          <Link href="/reglamento" className="text-sm font-semibold pb-1 text-slate-600 border-b-2 border-transparent hover:text-[#001F54]">
            Reglamento
          </Link>
          <Link href="/plataforma" className="text-sm font-semibold pb-1 text-slate-600 border-b-2 border-transparent hover:text-[#001F54]">
            La Plataforma
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <a href={getPlatformLoginUrl()} className="bg-[#001F54] hover:bg-blue-950 text-white font-semibold text-[11px] md:text-sm py-2 px-3 md:py-2.5 md:px-5 rounded-lg transition-all duration-200 cursor-pointer shadow-sm shadow-blue-950/10 whitespace-nowrap hidden sm:flex">
            Ingresar
          </a>
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

        {isMobileMenuOpen && (
          <div className="absolute top-20 left-0 w-full bg-white shadow-lg p-6 z-40 flex flex-col gap-4">
            <Link href="/torneos" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#001F54]">Torneos</Link>
            <Link href="/resultados" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#001F54]">Resultados</Link>
            <Link href="/equipos" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#001F54]">Equipos</Link>
            <Link href="/reglamento" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#001F54]">Reglamento</Link>
            <Link href="/plataforma" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#001F54]">La Plataforma</Link>
            <a href={getPlatformLoginUrl()} className="w-full bg-[#001F54] text-white font-semibold text-center py-3 rounded-lg text-sm">Ingresar</a>
          </div>
        )}
      </header>

      <section
        style={{ backgroundImage: "url('/images/equipos/clubesafiliados.jpg')" }}
        className="relative w-full h-[220px] md:h-[250px] overflow-hidden flex items-center justify-center bg-cover bg-center"
      >
        <div className="absolute inset-0 w-full h-full bg-slate-50/85"></div>
        <div className="relative z-10 flex flex-col items-center text-center px-4 w-full">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#001F54] uppercase tracking-tight leading-none mb-4">
            Resultados
          </h1>
          <p className="text-slate-800 text-sm sm:text-base font-medium max-w-2xl leading-relaxed">
            Elegí una competencia para ver el fixture, los resultados y la tabla de posiciones.
          </p>
        </div>
      </section>

      <main className="py-10 px-6 lg:px-16 max-w-7xl mx-auto w-full flex-grow">
        {isLoading ? (
          <p className="text-slate-600 font-semibold">Cargando resultados…</p>
        ) : error ? (
          <p className="text-slate-700 font-semibold">{error}</p>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl">
            <p className="text-slate-700 font-black text-lg">Todavía no hay resultados publicados.</p>
            <Link href="/torneos" className="inline-block mt-4 bg-[#F97316] text-[#001F54] font-bold py-3 px-6 rounded-lg">
              Ver competencias
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/torneos/${tournament.id}`}
                className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:border-[#F97316] transition-colors flex flex-col gap-2"
              >
                <span className="text-[10px] font-black tracking-widest text-[#F97316] uppercase">
                  {formatStatus(tournament.status)}
                </span>
                <h2 className="text-2xl font-black text-[#001F54]">{tournament.name}</h2>
                <p className="text-sm text-slate-500 font-semibold">
                  {formatCategory(tournament.category)} · {formatBranch(tournament.branch)}
                </p>
                <span className="mt-2 text-xs font-black tracking-widest text-[#001F54] uppercase">
                  Ver resultados y posiciones
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
