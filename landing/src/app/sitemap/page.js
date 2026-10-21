"use client";
import SiteFooter from "../../components/SiteFooter";
import { getPlatformLoginUrl } from '../../utils/platformUrl';

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Lock, Building, ChevronRight } from "lucide-react";

export default function SitemapPage() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

        {/* Center: Navigation Links (Todos Inactivos en Ruta /sitemap) */}
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
        style={{ backgroundImage: "url('/images/sitemap/sitemap.jpg')" }}
        className="relative w-full h-[220px] md:h-[250px] overflow-hidden flex items-center justify-center bg-cover bg-center"
      >
        {/* Capa Superpuesta (Overlay) */}
        <div className="absolute inset-0 w-full h-full bg-slate-50/85"></div>

        {/* Posición del Texto */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 w-full">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#001F54] uppercase tracking-tight leading-none mb-4">
            Mapa del Sitio
          </h1>
          <p className="text-slate-800 text-sm sm:text-base font-medium max-w-2xl leading-relaxed">
            Explora la estructura completa de la plataforma de la VOLEYHUB.
          </p>
        </div>
      </section>

      {/* 3. MAIN CONTENT (GRILLA DE ENLACES) */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Tarjeta 1: Plataforma Pública */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Globe className="w-6 h-6" />
              </div>
              <h2 className="text-[#001F54] font-bold text-xl">
                Plataforma Pública
              </h2>
            </div>
            
            <ul className="flex flex-col gap-3.5">
              <li>
                <Link href="/" className="group flex items-center gap-1.5 text-slate-600 hover:text-[#001F54] hover:translate-x-1 transition-all text-sm font-bold">
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                  <span>Inicio</span>
                </Link>
              </li>
              <li>
                <Link href="/torneos" className="group flex items-center gap-1.5 text-slate-600 hover:text-[#001F54] hover:translate-x-1 transition-all text-sm font-bold">
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                  <span>Torneos</span>
                </Link>
              </li>
              <li>
                <Link href="/resultados" className="group flex items-center gap-1.5 text-slate-600 hover:text-[#001F54] hover:translate-x-1 transition-all text-sm font-bold">
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                  <span>Resultados</span>
                </Link>
              </li>
              <li>
                <Link href="/equipos" className="group flex items-center gap-1.5 text-slate-600 hover:text-[#001F54] hover:translate-x-1 transition-all text-sm font-bold">
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                  <span>Equipos</span>
                </Link>
              </li>
              <li>
                <Link href="/reglamento" className="group flex items-center gap-1.5 text-slate-600 hover:text-[#001F54] hover:translate-x-1 transition-all text-sm font-bold">
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                  <span>Reglamento y Documentación</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Tarjeta 2: Portal de Gestión */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-[#001F54] font-bold text-xl">
                Portal de Gestión
              </h2>
            </div>
            
            <ul className="flex flex-col gap-3.5">
              <li>
                <Link href={getPlatformLoginUrl()} className="group flex items-center justify-between text-slate-600 hover:text-[#001F54] hover:translate-x-0.5 transition-all text-sm font-bold">
                  <div className="flex items-center gap-1.5">
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                    <span>Acceso Comunidad / Login</span>
                  </div>
                  <span className="bg-slate-100 text-slate-500 text-[9px] font-black tracking-wider px-2 py-0.5 rounded uppercase flex-shrink-0 select-none">
                    Requiere acceso
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/torneos" className="group flex items-center justify-between text-slate-600 hover:text-[#001F54] hover:translate-x-0.5 transition-all text-sm font-bold">
                  <div className="flex items-center gap-1.5">
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                    <span>Torneos</span>
                  </div>
                </Link>
              </li>
              <li>
                <Link href="/resultados" className="group flex items-center justify-between text-slate-600 hover:text-[#001F54] hover:translate-x-0.5 transition-all text-sm font-bold">
                  <div className="flex items-center gap-1.5">
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                    <span>Resultados</span>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          {/* Tarjeta 3: Institucional */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
              <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                <Building className="w-6 h-6" />
              </div>
              <h2 className="text-[#001F54] font-bold text-xl">
                Institucional
              </h2>
            </div>
            
            <ul className="flex flex-col gap-3.5">
              <li>
                <Link href="/contacto" className="group flex items-center gap-1.5 text-slate-600 hover:text-[#001F54] hover:translate-x-1 transition-all text-sm font-bold">
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                  <span>Contacto</span>
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="group flex items-center gap-1.5 text-slate-600 hover:text-[#001F54] hover:translate-x-1 transition-all text-sm font-bold">
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                  <span>Políticas de Privacidad</span>
                </Link>
              </li>
              <li>
                <a 
                  href="https://feva.org.ar/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group flex items-center gap-1.5 text-slate-600 hover:text-[#001F54] hover:translate-x-1 transition-all text-sm font-bold"
                >
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500" />
                  <span>FEVA</span>
                </a>
              </li>
            </ul>
          </div>

        </div>
      </main>

      {/* 5. FOOTER PÚBLICO */}
      <SiteFooter />

    </div>
  );
}
