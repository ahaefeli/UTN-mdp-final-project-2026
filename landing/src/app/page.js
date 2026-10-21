"use client";
import SiteFooter from "../components/SiteFooter";
import { getPlatformLoginUrl } from '../utils/platformUrl';

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// MOCK DATA (ESTRICTO SEGÚN ESPECIFICACIÓN Y DISEÑO DE IMAGEN)
const associations = [
  {
    id: 1,
    title: "Liga Necochense de Vóley",
    subtitle: "Competencias oficiales y resultados en vivo",
    statusTag: "ACTIVA",
    bgImage: "/images/inicio/festejo_masculino.avif"
  }
];


// Sponsors Logos Mock Array
const mockSponsors = [
  { name: "Emma Del Rey", logo: "/images/inicio/logo-emmadelrey.jpg" },
  { name: "Gimnasio Fenix", logo: "/images/inicio/logo-gimnasiofenix.jpg" },
  { name: "Puerto Quequén", logo: "/images/inicio/logo-puertoqqn.webp" }
];

export default function LandingPage() {
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      
      {/* 1. HEADER PÚBLICO */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-100 h-20 w-full flex items-center justify-between px-4 md:px-8 lg:px-16 select-none relative">
        
        {/* Left: Logo LNV - "VOLEYHUB" */}
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

        {/* Right: Acceso Clubes Button & User Icon & Mobile Hamburger */}
        <div className="flex items-center gap-4">
          <a
            href={getPlatformLoginUrl()}
            className="bg-[#001F54] hover:bg-blue-950 text-white font-semibold text-[11px] md:text-sm py-2 px-3 md:py-2.5 md:px-5 rounded-lg transition-all duration-200 cursor-pointer shadow-sm shadow-blue-950/10 whitespace-nowrap hidden sm:flex"
          >
            Ingresar
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
      <section className="relative w-full min-h-[580px] lg:min-h-[640px] flex items-center bg-[#002068] text-white select-none overflow-hidden py-16 px-6 lg:px-16">
        
        {/* Background Image of Volleyball Blocking spiked scene with smooth fade overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/inicio/img_bloqueo.png"
            alt="Juego de vóley"
            className="w-full h-full object-cover object-center brightness-[0.55]"
          />
          {/* Elegant horizontal gradient overlay blending with the navy background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#002068] via-[#002068]/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#002068] via-transparent to-transparent"></div>
        </div>

        {/* Content Info (Left Overlay) */}
        <div className="relative z-10 max-w-3xl flex flex-col items-start gap-6">
          {/* Season Badge */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FF8A00] text-blue-950 text-[10px] font-black tracking-widest uppercase leading-none shadow-sm select-none">
            TEMPORADA 2026
          </span>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-[75px] font-black tracking-tight leading-[1.05] uppercase">
            Pasión que <br />
            nos une
          </h1>

          {/* Paragraph */}
          <p className="text-sm sm:text-base lg:text-lg text-blue-200/80 leading-relaxed font-semibold max-w-xl">
            Todo el vóley en un solo lugar. Formación, competencia y oportunidades para impulsar el talento y llevar la pasión por este deporte al siguiente nivel.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full sm:w-auto">
            <Link
              href="/torneos"
              className="bg-[#F97316] text-[#001F54] font-bold py-3 px-8 rounded-lg hover:bg-orange-600 transition-colors inline-block text-center w-full sm:w-auto"
            >
              VER COMPETENCIAS ACTUALES 
            </Link>
          </div>
        </div>

      </section>

      <section id="quien-sos" className="py-20 px-6 lg:px-16 max-w-7xl mx-auto w-full flex flex-col gap-10">
        <div className="flex flex-col items-start gap-2 max-w-2xl">
          <div className="w-10 h-1 bg-[#FF8A00] rounded-full"></div>
          <h2 className="text-[#001F54] font-black tracking-tight text-3xl md:text-4xl uppercase">
            ¿Quién sos?
          </h2>
          <p className="text-sm sm:text-base text-slate-500 font-semibold leading-relaxed">
            El ingreso a la plataforma es uno solo. Después, cada rol ve su panel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Link
            href="/torneos"
            className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:border-[#F97316] transition-colors"
          >
            <span className="text-[10px] font-black tracking-widest text-[#F97316] uppercase">Público</span>
            <h3 className="text-2xl font-black text-[#001F54]">Quiero ver la liga</h3>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed">
              Fixture, resultados y tablas de posiciones. No hace falta cuenta.
            </p>
            <span className="mt-2 text-xs font-black tracking-widest text-[#001F54] uppercase">Ver competencias</span>
          </Link>

          <a
            href={getPlatformLoginUrl()}
            className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:border-[#F97316] transition-colors"
          >
            <span className="text-[10px] font-black tracking-widest text-[#F97316] uppercase">Club</span>
            <h3 className="text-2xl font-black text-[#001F54]">Represento un club</h3>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed">
              Administración del club y entrenadores cargan equipos, jugadores y datos del club.
            </p>
            <span className="mt-2 text-xs font-black tracking-widest text-[#001F54] uppercase">Ingresar</span>
          </a>

          <a
            href={getPlatformLoginUrl()}
            className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:border-[#F97316] transition-colors"
          >
            <span className="text-[10px] font-black tracking-widest text-[#F97316] uppercase">Cancha</span>
            <h3 className="text-2xl font-black text-[#001F54]">Soy árbitro o planillero</h3>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed">
              El mismo ingreso abre los partidos asignados para cargar el resultado.
            </p>
            <span className="mt-2 text-xs font-black tracking-widest text-[#001F54] uppercase">Ingresar</span>
          </a>

          <a
            href={getPlatformLoginUrl()}
            className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm hover:border-[#F97316] transition-colors"
          >
            <span className="text-[10px] font-black tracking-widest text-[#F97316] uppercase">Jugador</span>
            <h3 className="text-2xl font-black text-[#001F54]">Juego en un equipo</h3>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed">
              El mismo ingreso abre tu equipo y los próximos partidos.
            </p>
            <span className="mt-2 text-xs font-black tracking-widest text-[#001F54] uppercase">Ingresar</span>
          </a>
        </div>
      </section>

      {/* 3. NUEVA SECCIÓN: ASOCIACIONES */}
      <section id="asociaciones" className="py-20 px-6 lg:px-16 max-w-7xl mx-auto w-full flex flex-col gap-10">
        
        {/* Title */}
        <div className="flex flex-col items-start gap-1">
          <div className="w-10 h-1 bg-[#FF8A00] rounded-full mb-1"></div>
          <h2 className="text-[#001F54] font-black tracking-tight text-3xl md:text-4xl uppercase select-none">
            ASOCIACIONES ADHERIDAS
          </h2>
        </div>

        {/* Grid Associations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {associations.map((assoc) => (
            <div
              key={assoc.id}
              style={{ backgroundImage: `url(${assoc.bgImage})` }}
              className="relative flex flex-col justify-end p-8 rounded-3xl overflow-hidden bg-cover bg-center min-h-[400px] group shadow-sm"
            >
              {/* Dark Overlay Gradient for legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#001F54]/95 via-[#001F54]/60 to-transparent transition-opacity duration-300"></div>

              {/* Content info */}
              <div className="relative z-10 flex flex-col items-start gap-2.5 select-none">
                <span className="text-[10px] font-black text-[#FF8A00] tracking-widest uppercase">
                  {assoc.statusTag}
                </span>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                  {assoc.title}
                </h3>
                <p className="text-xs sm:text-sm text-blue-100/70 font-semibold leading-relaxed max-w-md mt-0.5">
                  {assoc.subtitle}
                </p>
                <a
                  href={getPlatformLoginUrl()}
                  className="mt-3.5 text-xs font-black text-white group-hover:text-[#FF8A00] transition-colors uppercase tracking-widest flex items-center gap-2 cursor-pointer"
                >
                  INGRESAR AL PORTAL
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              </div>

            </div>
          ))}
        </div>

      </section>


      {/* 5. SECCIÓN SPONSORS */}
      <section id="sponsors" className="py-16 bg-slate-50 border-y border-slate-100/50 w-full">
        <div className="max-w-7xl mx-auto w-full flex flex-col items-center gap-6 px-6">
          
          <div className="text-center select-none space-y-1">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#001F54] uppercase">
              EMPRESAS QUE APOYAN AL VOLEY
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-bold">
              Gracias a su compromiso, impulsamos el deporte en todas las regiones.
            </p>
          </div>

          {/* Grayscale sponsors logo placeholders in row grid */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-20 mt-12 w-full max-w-5xl mx-auto">
            {mockSponsors.map((sp, index) => (
              <img
                key={sp.name}
                src={sp.logo}
                alt={sp.name}
                className={`w-auto object-contain mix-blend-multiply transition-all duration-300 hover:scale-105 select-none ${
                  index < 2 
                    ? "h-28 md:h-40 max-w-[220px] md:max-w-[260px]" 
                    : "h-20 md:h-28 max-w-[240px] md:max-w-[320px]"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 6. NUEVA SECCIÓN: CTA AFILIACIÓN */}
      <section className="relative w-full bg-[#001F54] text-white py-20 px-6 select-none overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto w-full text-center flex flex-col items-center gap-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight uppercase">
            ¿Representás a un club?
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-blue-200/80 leading-relaxed font-semibold max-w-2xl">
            El alta de clubes, árbitros y planilleros es por invitación de la liga. Escribinos y te indicamos cómo pedir el enlace.
          </p>
          <Link
            href="/contacto"
            className="mt-2 bg-white hover:bg-slate-50 text-[#001F54] font-black text-xs uppercase tracking-wider py-4.5 px-8 rounded-xl transition-all duration-200 shadow-xl shadow-slate-950/20 active:scale-[0.99] border-2 border-transparent"
          >
            Escribinos
          </Link>
        </div>

      </section>

      {/* 7. FOOTER PÚBLICO */}
      <SiteFooter />

    </div>
  );
}
