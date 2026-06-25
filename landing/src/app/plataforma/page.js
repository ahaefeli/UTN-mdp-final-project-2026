"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Building, Activity } from 'lucide-react';

export default function PlataformaPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigateToLogin = (e) => {
    e.preventDefault();
    window.location.href = "/login";
  };

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
            Conocenos
          </Link>
        </nav>

        {/* Right: Acceso Clubes Button & User Icon & Mobile Hamburger */}
        <div className="flex items-center gap-4">
          <a
            href="http://192.168.1.226:3001/login"
            onClick={navigateToLogin}
            className="bg-[#001F54] hover:bg-blue-950 text-white font-semibold text-[11px] md:text-sm py-2 px-3 md:py-2.5 md:px-5 rounded-lg transition-all duration-200 cursor-pointer shadow-sm shadow-blue-950/10 whitespace-nowrap hidden sm:flex"
          >
            Acceso Clubes
          </a>
          <a href="http://192.168.1.226:3001/login" onClick={navigateToLogin} className="hidden sm:block flex-shrink-0">
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

            <Link href="/reglamento" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold text-[#001F54] hover:opacity-80 transition-opacity">
              Reglamento
            </Link>
            <Link 
              href="/plataforma" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="text-xl font-bold text-[#001F54] hover:opacity-80 transition-opacity"
            >
              Conocenos
            </Link>
            <hr />
            <a
              href="http://192.168.1.226:3001/login"
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

      {/* 2. HERO SECTION */}
      <section className="bg-[#f4f7f9] w-full min-h-[300px] md:min-h-[350px] overflow-hidden select-none border-b border-slate-200/50 flex items-center py-12">
        <div className="max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-20 text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase leading-tight tracking-tight mb-6">
            <span className="text-[#001F54]">Transformando el Vóley</span> <br className="hidden sm:inline" />
            <span className="text-[#F97316]">Punto a Punto</span>
          </h1>
          <p className="text-slate-800 text-lg md:text-xl font-semibold max-w-3xl mx-auto leading-relaxed">
            VOLEYHUB nace para resolver el caos administrativo del deporte federado y amateur. No somos solo un software; somos el nexo que une a ligas, clubes y apasionados del vóley en un ecosistema ágil, transparente y conectado en tiempo real.
          </p>
        </div>
      </section>

      {/* 3. CONTENIDO PRINCIPAL */}
      <main className="py-12 px-6 lg:px-16 max-w-7xl mx-auto w-full flex-grow flex flex-col gap-12">
        
        {/* Bloque de Soluciones */}
        <section className="flex flex-col gap-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-black text-[#001F54] uppercase tracking-tight">¿Qué resolvemos?</h2>
            <p className="text-slate-500 font-bold text-sm mt-2">Soluciones integrales diseñadas para potenciar cada rol del ecosistema deportivo</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Tarjeta 1 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col gap-4">
              <div className="w-14 h-14 bg-orange-50 text-[#F97316] rounded-full flex items-center justify-center flex-shrink-0">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#001F54]">Para las Ligas</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Automatización total de fixtures, gestión de actas digitales y control de sanciones sin planillas de papel.
              </p>
            </div>

            {/* Tarjeta 2 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col gap-4">
              <div className="w-14 h-14 bg-orange-50 text-[#F97316] rounded-full flex items-center justify-center flex-shrink-0">
                <Building className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#001F54]">Para los Clubes</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Control centralizado de pases, fichajes de buena fe y legajos digitales de cada jugador en un solo clic.
              </p>
            </div>

            {/* Tarjeta 3 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col gap-4">
              <div className="w-14 h-14 bg-orange-50 text-[#F97316] rounded-full flex items-center justify-center flex-shrink-0">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#001F54]">Para los Jugadores</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Estadísticas en vivo, seguimiento de posiciones del torneo y notificaciones al instante de sus próximos partidos.
              </p>
            </div>

          </div>
        </section>

        {/* Misión y Visión */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-200/50 pt-12">
          
          {/* Misión */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
            <h3 className="text-2xl font-bold text-[#001F54]">Nuestra Misión</h3>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              Digitalizar y simplificar la gestión deportiva del vóley, eliminando la burocracia para que las organizaciones puedan enfocarse en lo que de verdad importa: hacer crecer el deporte.
            </p>
          </div>

          {/* Visión */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
            <h3 className="text-2xl font-bold text-[#001F54]">Nuestra Visión</h3>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              Convertirnos en la plataforma de gestión y comunidad de vóley referente en toda la región, impulsando la profesionalización de los torneos mediante innovación tecnológica y datos accesibles.
            </p>
          </div>

        </section>

      </main>

      {/* Call to Action Final */}
      <section className="w-full bg-[#001F54]/5 border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center py-16 px-4">
          <h2 className="text-3xl font-black text-[#001F54] mb-4">
            ¿Listo para llevar tu liga al siguiente nivel?
          </h2>
          <p className="text-lg text-slate-700 mb-8 max-w-2xl leading-relaxed">
            Unite a la red de VOLEYHUB y empezá a gestionar tus torneos de forma inteligente, rápida y 100% digital.
          </p>
          <Link 
            href="/contacto" 
            className="bg-[#F97316] text-white px-8 py-3 rounded-full font-bold shadow-md hover:scale-105 transition-transform inline-block"
          >
            Contactanos ahora
          </Link>
        </div>
      </section>

      {/* 4. FOOTER PÚBLICO */}
      <footer className="bg-slate-950 text-white pt-16 pb-8 px-6 lg:px-16 w-full select-none border-t border-slate-900/60 relative overflow-hidden">
        
        {/* Soft radial blue glow */}
        <div className="absolute left-[-10%] bottom-[-10%] w-96 h-96 rounded-full bg-blue-900/10 blur-3xl pointer-events-none"></div>
 
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-12 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
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
                
              </div>
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
