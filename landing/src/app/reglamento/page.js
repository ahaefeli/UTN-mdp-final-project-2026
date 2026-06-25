"use client";

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
      updatedDate: "ACTUALIZADO: 1 DE ENERO DE 2025",
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


  const navigateToLogin = (e) => {
    e.preventDefault();
    window.location.href = "/login";
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
            href="http://192.168.88.24:3001/login"
            onClick={navigateToLogin}
            className="bg-[#001F54] hover:bg-blue-950 text-white font-semibold text-[11px] md:text-sm py-2 px-3 md:py-2.5 md:px-5 rounded-lg transition-all duration-200 cursor-pointer shadow-sm shadow-blue-950/10 whitespace-nowrap hidden sm:flex"
          >
            Acceso Clubes
          </a>
          <a href="http://192.168.88.24:3001/login" onClick={navigateToLogin} className="hidden sm:block flex-shrink-0">
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
              href="http://192.168.88.24:3001/login"
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
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-10">
        
        <section className="mb-12 select-none">
          <h1 className="text-4xl md:text-5xl font-black text-[#001F54] tracking-tight mb-3">
            Documentación Oficial
          </h1>
          <p className="text-slate-600 text-sm sm:text-base font-semibold max-w-2xl leading-relaxed">
            Accede a todos los reglamentos, normativas y formularios necesarios para la participación en los torneos oficiales de VOLEYHUB.
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
                <a href="https://www.instagram.com/voley_hub/" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 hover:text-orange-500 text-blue-200 transition-all duration-200" title="Instagram">
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
