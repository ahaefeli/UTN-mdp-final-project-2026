"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// MOCK DATA (ESTRICTO SEGÚN ESPECIFICACIÓN Y DISEÑO DE IMAGEN)
const categories = [
  { 
    id: 1, 
    branch: "RAMA MASCULINA", 
    title: "Competencia Elite", 
    description: "Desde categorías formativas hasta Primera División. Descubre el poder y la técnica del vóley masculino necochense.",
    linkText: "EXPLORAR TORNEOS",
    image: "/images/inicio/festejo_masculino.avif" 
  },
  { 
    id: 2, 
    branch: "RAMA FEMENINA", 
    title: "Liderazgo & Garra", 
    description: "Fomentando el desarrollo del vóley femenino en toda la región con torneos de alto nivel y gran competitividad.",
    linkText: "VER TABLAS",
    image: "/images/inicio/liderazgo.png" 
  }
];

const news = [
  { 
    id: 1, 
    tag: "INSTITUCIONAL", 
    date: "27 OCT, 2025", 
    title: "Gran convocatoria para el taller de arbitraje regional", 
    description: "Más de 50 participantes se reunieron en la sede de la Liga para capacitarse en las nuevas regulaciones oficiales.",
    image: "/images/inicio/convocatoria.png" 
  },
  { 
    id: 2, 
    tag: "NOTICIAS", 
    date: "24 OCT, 2025", 
    title: "Definidas las sedes para el Final Four Sub-18", 
    description: "Los mejores cuatro equipos del semestre se enfrentarán en el Microestadio Municipal este fin de semana en busca de la copa.",
    image: "/images/inicio/sedes.png" 
  },
  { 
    id: 3, 
    tag: "RESULTADOS", 
    date: "20 OCT, 2025", 
    title: "Rivadavia se corona campeón de la Copa Apertura", 
    description: "En una final electrizante que llegó al tie-break, el equipo de la calle 59 se quedó con el primer título de la temporada.",
    image: "/images/inicio/campeon.webp" 
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
  const [emailInput, setEmailInput] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        
        {/* Left: Logo LNV - "LIGA NECOCHENSE DE VOLEY" */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="font-black italic text-[#001F54] text-sm md:text-base lg:text-xl leading-tight tracking-tight select-none max-w-[200px] sm:max-w-none cursor-pointer">
              LIGA NECOCHENSE DE VOLEY
            </span>
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
            El epicentro del vóley regional. Formación, competencia y excelencia deportiva en cada saque. Unite a la institución que impulsa el talento de Necochea.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full sm:w-auto">
            <a
              href="#torneos"
              className="bg-[#FF8A00] hover:bg-orange-600 text-blue-950 font-black text-xs uppercase tracking-wider py-4 px-8 rounded-xl transition-all duration-200 cursor-pointer shadow-md shadow-orange-500/10 active:scale-[0.99] text-center w-full sm:w-auto"
            >
              Ver Calendario
            </a>
            <a
              href="#categorias"
              className="bg-white/10 hover:bg-white/15 border-2 border-white/20 text-white font-extrabold text-xs uppercase tracking-wider py-4 px-8 rounded-xl transition-all duration-200 cursor-pointer text-center w-full sm:w-auto"
            >
              Clubes Afiliados
            </a>
          </div>
        </div>

        {/* Floating next match pill on bottom right */}
        <div className="absolute bottom-6 right-6 lg:right-16 z-10 bg-slate-950/70 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl max-w-xs hidden md:flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#FF8A00]/20 text-[#FF8A00] flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[9px] font-black text-[#FF8A00] uppercase tracking-widest leading-none">PRÓXIMO PARTIDO</p>
            <p className="text-xs font-black text-white mt-1 leading-tight">Huracán vs Luz y Fuerza</p>
          </div>
        </div>

      </section>

      {/* 3. NUEVA SECCIÓN: CATEGORÍAS */}
      <section id="categorias" className="py-20 px-6 lg:px-16 max-w-7xl mx-auto w-full flex flex-col gap-10">
        
        {/* Title */}
        <div className="flex flex-col items-start gap-1">
          <div className="w-10 h-1 bg-[#FF8A00] rounded-full mb-1"></div>
          <h2 className="text-[#001F54] font-black tracking-tight text-3xl md:text-4xl uppercase select-none">
            CATEGORÍAS
          </h2>
        </div>

        {/* Grid Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{ backgroundImage: `url(${cat.image})` }}
              className="relative flex flex-col justify-end p-8 rounded-3xl overflow-hidden bg-cover bg-center min-h-[400px] group shadow-sm"
            >
              {/* Dark Overlay Gradient for legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#001F54]/95 via-[#001F54]/60 to-transparent transition-opacity duration-300"></div>

              {/* Content info */}
              <div className="relative z-10 flex flex-col items-start gap-2.5 select-none">
                <span className="text-[10px] font-black text-[#FF8A00] tracking-widest uppercase">
                  {cat.branch}
                </span>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                  {cat.title}
                </h3>
                <p className="text-xs sm:text-sm text-blue-100/70 font-semibold leading-relaxed max-w-md mt-0.5">
                  {cat.description}
                </p>
                <Link
                  href="/torneos"
                  className="mt-3.5 text-xs font-black text-white group-hover:text-[#FF8A00] transition-colors uppercase tracking-widest flex items-center gap-2 cursor-pointer"
                >
                  {cat.linkText}
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>

            </div>
          ))}
        </div>

      </section>

      {/* 4. SECCIÓN ACTUALIDAD */}
      <section id="actualidad" className="py-20 px-6 lg:px-16 bg-white w-full">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-10">
          
          {/* Title row */}
          <div className="flex items-end justify-between border-b border-slate-100 pb-5">
            <div className="flex flex-col items-start gap-1">
              <div className="w-10 h-1 bg-[#FF8A00] rounded-full mb-1"></div>
              <h2 className="text-[#001F54] font-black tracking-tight text-3xl md:text-4xl uppercase select-none">
                ACTUALIDAD
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5 select-none">
                Las últimas novedades de la Liga y nuestros clubes afiliados.
              </p>
            </div>
            
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert("Redirigiendo a todas las novedades");
              }}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-[#001F54] font-black text-xs uppercase tracking-wider rounded-xl border border-slate-200 transition-colors shadow-sm select-none cursor-pointer"
            >
              VER TODAS
            </a>
          </div>

          {/* Grid News Cards (3 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {news.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full group"
              >
                {/* News Image */}
                <div className="relative w-full h-56 overflow-hidden bg-slate-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                  {/* Category Tag Badge */}
                  <span className="absolute top-4 right-4 px-2.5 py-1 text-[9px] font-black tracking-wider text-white bg-[#001F54] rounded-[4px] uppercase select-none leading-none shadow-sm shadow-blue-900/10">
                    {item.tag}
                  </span>
                </div>

                {/* News Content */}
                <div className="p-6 flex flex-col justify-between flex-1 gap-5">
                  <div className="space-y-2 select-none">
                    <span className="text-[10px] font-black text-[#FF8A00] tracking-widest uppercase">
                      {item.date}
                    </span>
                    <h3 className="font-black text-[#001F54] group-hover:text-blue-950 text-base leading-snug transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  </div>

                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`Visualizando detalles del artículo ID: ${item.id}`);
                    }}
                    className="text-[10px] font-black text-[#FF8A00] hover:text-orange-600 transition-colors uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
                  >
                    Leer más
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                </div>

              </div>
            ))}
          </div>

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
              Gracias a su compromiso, impulsamos el deporte en toda la región.
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
            ¿Representas a un club o institución?
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-blue-200/80 leading-relaxed font-semibold max-w-2xl">
            Forma parte de la red de clubes de la Liga Necochense de Voley. Accede a capacitaciones, torneos oficiales y gestión centralizada para tus deportistas. Inicia el proceso de vinculación oficial.
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
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Col 1: Logo & Brief Info */}
            <div className="flex flex-col gap-4 items-start">
              <div className="flex flex-col text-left">
                <span className="font-black tracking-tight text-white text-base leading-none select-none">
                  LIGA NECOCHENSE
                </span>
                <span className="text-[10px] font-black text-[#FF8A00] tracking-widest uppercase mt-1 leading-none select-none">
                  DE VOLEY
                </span>
              </div>
              <p className="text-xs text-blue-200/50 leading-relaxed font-semibold max-w-xs">
                Organización oficial de vóley federado en la ciudad de Necochea. Impulsando competencias y afiliaciones.
              </p>
            </div>

            {/* Col 2: NAVEGACIÓN */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-black tracking-widest text-[#FF8A00] uppercase">
                NAVEGACIÓN
              </h4>
              <ul className="flex flex-col gap-2.5 text-xs text-blue-200/60 font-bold">
                <li><Link href="/sitemap" className="hover:text-white transition-colors duration-200">SITEMAP</Link></li>
                <li><Link href="/privacidad" className="hover:text-white transition-colors duration-200">POLÍTICAS DE PRIVACIDAD</Link></li>
                <li><Link href="/contacto" className="hover:text-white transition-colors duration-200">CONTACTO</Link></li>
                <li><a href="https://feva.org.ar/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200">FEVA</a></li>
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
                <p className="text-[10px] text-blue-200/50 font-semibold leading-normal select-none">
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
              © 2026 LIGA NECOCHENSE DE VOLEY
            </span>
          </div>

        </div>

      </footer>

    </div>
  );
}
