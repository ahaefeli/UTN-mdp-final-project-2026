"use client";

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
    bgImage: "/images/inicio/festejo_masculino.avif",
    href: "/torneos",
    isActive: true
  },
  {
    id: 2,
    title: "Asociación Marplatense",
    subtitle: "Suma tu liga y digitaliza tu gestión",
    statusTag: "PRÓXIMAMENTE",
    bgImage: "/images/inicio/liderazgo.png",
    href: null,
    isActive: false
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

  const navigateToLogin = (e) => {
    e.preventDefault();
    window.location.href = "http://192.168.1.226:3001/login";
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
      <section className="relative w-full min-h-[580px] lg:min-h-[640px] flex items-center bg-[#002068] text-white select-none overflow-hidden py-16 px-6 lg:px-16">
        
        {/* Background Image of Volleyball Blocking spiked scene with smooth fade overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/inicio/img_bloqueo.png"
            alt="Volleyball game block spike"
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
            Todo el voley en un solo lugar. Formación, competencia y oportunidades para impulsar el talento y llevar la pasión por este deporte al siguiente nivel.
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
                {assoc.isActive ? (
                  <Link
                    href={assoc.href}
                    className="mt-3.5 text-xs font-black text-white group-hover:text-[#FF8A00] transition-colors uppercase tracking-widest flex items-center gap-2 cursor-pointer"
                  >
                    INGRESAR AL PORTAL
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                ) : (
                  <div className="mt-3.5 text-xs font-black text-white/50 uppercase tracking-widest flex items-center gap-2 cursor-not-allowed">
                    PRÓXIMAMENTE
                  </div>
                )}
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
              Gracias a su compromiso, impulsamos el deporte en todas la regións.
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
        
        {/* Soft background giant typography details */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none select-none opacity-5">
          <span className="font-black text-[22vw] leading-none text-white tracking-widest">
            LIGA VOLEY
          </span>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto w-full text-center flex flex-col items-center gap-6">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight uppercase">
            ¿Representas a una liga o asociación?
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-blue-200/80 leading-relaxed font-semibold max-w-2xl">
            Forma parte de la red de VoleyHub. Accede a torneos oficiales y gestión centralizada para tus deportistas. Inicia el proceso de vinculación oficial.
          </p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert("Solicitando proceso de afiliación oficial");
            }}
            className="mt-2 bg-white hover:bg-slate-50 text-[#001F54] font-black text-xs uppercase tracking-wider py-4.5 px-8 rounded-xl transition-all duration-200 shadow-xl shadow-slate-950/20 active:scale-[0.99] border-2 border-transparent"
          >
            SOLICITAR AFILIACIÓN
          </a>
        </div>

      </section>

      {/* 7. FOOTER PÚBLICO */}
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
