"use client";
import SiteFooter from "../../components/SiteFooter";
import { getPlatformLoginUrl } from '../../utils/platformUrl';

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ClipboardList, Download, ExternalLink } from "lucide-react";

// MOCK DATA (DOCUMENTOS Y REGLAMENTOS)
const mockDocuments = {
  reglamentos: [
    {
      id: 1,
      title: "Reglamento Oficial de Juego 2026",
      description: "Normativa vigente para todas las categorías competitivas.",
      updatedDate: "Actualizado: 1 de enero de 2026",
      href: "/docs/reglamento_juego_2026.pdf",
    },
    {
      id: 2,
      title: "Código de Penas y Disciplina",
      description: "Sanciones, procedimientos disciplinarios y tribunal de disciplina.",
      updatedDate: "ACTUALIZADO: 1 DE JUNIO DE 2023",
      href: "/docs/codigo_penas_2023.pdf",
    },
  ],
  formularios: [
    {
      id: 1,
      title: "Lista de Buena Fe",
      description: "Formato oficial para inscripción de jugadores por categoría.",
      href: "/docs/lista_buena_fe.pdf",
    },
    {
      id: 2,
      title: "Pase de Jugador",
      description: "Solicitud de transferencia entre clubes afiliados.",
      href: "/docs/pase_jugador.pdf",
    },
    {
      id: 3,
      title: "Planilla de Partido",
      description: "Modelo oficial para uso en mesa de control.",
      href: "/docs/planilla_partido.pdf",
    },
  ],
};

export default function ReglamentoPage() {
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
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-10">
        
        <section className="mb-12 select-none">
          <h1 className="text-4xl md:text-5xl font-black text-[#001F54] tracking-tight mb-3">
            Documentación Oficial
          </h1>
          <p className="text-slate-600 text-sm sm:text-base font-semibold max-w-2xl leading-relaxed">
            Accedé a los reglamentos, normativas y formularios para participar en los torneos oficiales de VoleyHub.
          </p>
        </section>

        {/* 3. MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-8">
          
          {/* COLUMNA IZQUIERDA: REGLAMENTOS GENERALES (2/3) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Título Sección */}
            <div className="flex items-center gap-2.5 text-[#001F54] select-none">
              <BookOpen className="w-6 h-6 text-[#F97316]" />
              <h2 className="text-2xl font-black tracking-tight">
                Reglamentos Generales
              </h2>
            </div>

            {/* Listado de Reglamentos */}
            <div className="flex flex-col gap-6">
              {mockDocuments.reglamentos.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-6 hover:shadow-md transition-all duration-300"
                >
                  {/* Detalles Documento */}
                  <div className="flex flex-col gap-2 select-none">
                    <h3 className="text-lg md:text-xl font-bold text-[#001F54]">
                      {doc.title}
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm font-semibold max-w-md leading-relaxed">
                      {doc.description}
                    </p>
                    <span className="text-[10px] font-black text-slate-400 tracking-wider mt-1 block">
                      {doc.updatedDate}
                    </span>
                  </div>

                  {/* Botón Descargar */}
                  <a
                    href={doc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.99] text-center"
                  >
                    <Download className="w-4 h-4 text-[#F97316] flex-shrink-0" />
                    Descargar PDF
                  </a>
                </div>
              ))}
            </div>

          </div>

          {/* COLUMNA DERECHA: FORMULARIOS OFICIALES (1/3) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Título Sección */}
            <div className="flex items-center gap-2.5 text-[#001F54] select-none lg:invisible lg:h-0 overflow-hidden">
              <ClipboardList className="w-6 h-6 text-[#F97316]" />
              <h2 className="text-2xl font-black tracking-tight">
                Formularios Oficiales
              </h2>
            </div>

            {/* Contenedor Lateral Gris */}
            <div className="bg-slate-100/40 border border-slate-200/50 rounded-3xl p-6 flex flex-col gap-6">
              
              {/* Encabezado Interno */}
              <div className="flex items-center gap-2 select-none">
                <ClipboardList className="w-5 h-5 text-[#F97316]" />
                <h3 className="font-black text-[#001F54] text-lg">
                  Formularios Oficiales
                </h3>
              </div>

              {/* Lista de Formularios */}
              <div className="flex flex-col gap-4">
                {mockDocuments.formularios.map((form) => (
                  <a
                    key={form.id}
                    href={form.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-2xl border border-slate-100/80 shadow-sm p-5 flex items-start justify-between gap-4 cursor-pointer hover:border-slate-200 transition-all duration-200 group block"
                  >
                    <div className="flex flex-col gap-1 select-none">
                      <h4 className="font-bold text-[#001F54] group-hover:text-blue-950 text-sm md:text-base leading-snug">
                        {form.title}
                      </h4>
                      <p className="text-slate-600 text-xs font-semibold leading-relaxed max-w-[200px]">
                        {form.description}
                      </p>
                    </div>

                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#F97316] transition-colors mt-0.5 flex-shrink-0" />
                  </a>
                ))}
              </div>

            </div>

          </div>

        </div>



      </main>

      {/* 5. FOOTER PÚBLICO */}
      <SiteFooter />

    </div>
  );
}
