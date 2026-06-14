"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// MOCK DATA (CATEGORÍA DE TARJETA 1 CAMBIADA A FEMENINO)
const mockTournaments = [
  {
    id: 1,
    badgeText: "EN VIVO",
    badgeType: "live", // bg-orange-500 text-white
    category: "PRIMERA DIVISIÓN FEMENINO", // Cambiado a FEMENINO según especificación
    title: "Torneo Apertura 2026",
    dateInfo: "Marzo - Julio 2025", // Nota: el diseño dice 2025, mantener textual
    locationInfo: "Múltiples Sedes",
    buttonText: "Ver Fixture Completo",
    image: "/images/inicio/torneo-apertura.jpg",
    href: "/resultados"
  },
  {
    id: 2,
    badgeText: "PRÓXIMAMENTE",
    badgeType: "upcoming", // bg-white text-slate-700
    category: "SUB-18 FEMENINO",
    title: "Torneo Clausura 2026",
    dateInfo: "Inicia: 15 de Agosto",
    locationInfo: "Inscripciones Abiertas",
    buttonText: "Información e Inscripción",
    image: "/images/inicio/torneo_clausura.jpg",
    href: "/contacto"
  },
  {
    id: 3,
    badgeText: "EN DISPUTA",
    badgeType: "ongoing", // bg-[#001F54] text-white
    category: "SUB-16 MIXTO",
    title: "Liga Promocional Formativa",
    dateInfo: "Abril - Noviembre 2026",
    locationInfo: "Fase Regular: Fecha 8",
    buttonText: "Ver Posiciones",
    image: "/images/inicio/fecha-formativa.jpg",
    href: "/resultados"
  }
];

export default function TorneosPage() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("TODOS");

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

  // Filtrado de Torneos
  const filteredTournaments = mockTournaments.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeCategory === "TODOS") return matchesSearch;
    return matchesSearch && t.category.toUpperCase().includes(activeCategory.toUpperCase());
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      
      {/* 1. HEADER PÚBLICO */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-100 h-20 w-full flex items-center justify-between px-4 md:px-8 lg:px-16 select-none relative">
        
        {/* Left: Logo LNV */}
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
            <svg className="w-6 h-6 text-[#001F54] cursor-pointer hover:opacity-80 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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

      {/* 2. HERO SECTION (FONDO GRIS bg-[#f4f7f9] Y CORTE DIAGONAL) */}
      <section className="bg-[#f4f7f9] w-full grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0 lg:gap-0 min-h-[350px] md:min-h-[420px] overflow-hidden select-none border-b border-slate-200/50">
        
        {/* Columna Izquierda: Texto */}
        <div className="flex flex-col justify-center px-6 md:px-12 lg:px-20 py-12 md:py-16 gap-4">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#001F54] uppercase leading-[0.95] tracking-tight">
            EXPLORAR <br />
            TORNEOS
          </h1>
          <p className="text-slate-600 text-sm sm:text-base font-semibold max-w-md leading-relaxed">
            Seguí de cerca el fixture, los resultados y las posiciones de todas las categorías oficiales de la temporada.
          </p>
        </div>

        {/* Columna Derecha: Imagen con Corte Diagonal y Alineación object-left-top */}
        <div className="relative w-full h-[280px] md:h-full overflow-hidden">
          <img
            src="/images/inicio/bloqueo_chicas_voley.webp"
            alt="Jugadoras festejando"
            className="w-full h-full object-cover object-left-top" // object-left-top para encuadre ideal sin cortes
            style={{ clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)" }}
          />
        </div>

      </section>

      {/* 3. BUSCADOR Y FILTROS (BARRA CENTRAL SUPERPUESTA) */}
      <div className="max-w-7xl mx-auto w-full px-6 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl border border-slate-150 shadow-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          
          {/* Input de Búsqueda */}
          <div className="flex items-center gap-3 flex-1 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
            <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por equipo o nombre del torneo..."
              className="w-full text-sm font-semibold text-slate-700 placeholder-slate-400 outline-none bg-transparent"
            />
          </div>

          {/* Filtros (Pills) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory("TODOS")}
              className={`px-6 py-2.5 rounded-full text-xs font-black tracking-wider transition-all duration-200 cursor-pointer ${
                activeCategory === "TODOS"
                  ? "bg-[#001F54] text-white shadow-sm shadow-[#001F54]/20"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold"
              }`}
            >
              TODOS
            </button>
            <button
              onClick={() => setActiveCategory("PRIMERA")}
              className={`px-6 py-2.5 rounded-full text-xs font-black tracking-wider transition-all duration-200 cursor-pointer ${
                activeCategory === "PRIMERA"
                  ? "bg-[#001F54] text-white shadow-sm shadow-[#001F54]/20"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold"
              }`}
            >
              PRIMERA
            </button>
            <button
              onClick={() => setActiveCategory("SUB-18")}
              className={`px-6 py-2.5 rounded-full text-xs font-black tracking-wider transition-all duration-200 cursor-pointer ${
                activeCategory === "SUB-18"
                  ? "bg-[#001F54] text-white shadow-sm shadow-[#001F54]/20"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold"
              }`}
            >
              SUB-18
            </button>
          </div>

        </div>
      </div>

      {/* 4. GRILLA DE TORNEOS (TARJETAS) */}
      <main className="py-20 px-6 lg:px-16 max-w-7xl mx-auto w-full flex-grow flex flex-col gap-10">
        
        {filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group"
              >
                
                {/* Imagen Superior */}
                <div className="relative w-full h-52 overflow-hidden bg-slate-900">
                  <img
                    src={tournament.image}
                    alt={tournament.title}
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-102 ${
                      tournament.id === 1 ? "object-[center_15%]" : "object-center" // object-[center_15%] en tarjeta 1 para evitar recorte de cabeza
                    }`}
                  />
                  
                  {/* Badge Absoluto */}
                  <div
                    className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider select-none shadow-sm ${
                      tournament.badgeType === "live"
                        ? "bg-orange-500 text-white"
                        : tournament.badgeType === "upcoming"
                        ? "bg-white text-slate-700 border border-slate-100"
                        : "bg-[#001F54] text-white"
                    }`}
                  >
                    {tournament.badgeType === "live" && (
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    )}
                    {tournament.badgeType === "upcoming" && (
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {tournament.badgeType === "ongoing" && (
                      <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {tournament.badgeText}
                  </div>

                </div>

                {/* Cuerpo de la Tarjeta */}
                <div className="p-6 flex flex-col justify-between flex-1 gap-5">
                  <div className="space-y-2 select-none">
                    <span className="text-[10px] font-black text-[#002F87] tracking-widest uppercase">
                      {tournament.category}
                    </span>
                    <h3 className="font-black text-[#001F54] group-hover:text-blue-950 text-xl leading-snug transition-colors">
                      {tournament.title}
                    </h3>
                    
                    {/* Detalles */}
                    <div className="flex flex-col gap-2 mt-4">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500">
                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{tournament.dateInfo}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500">
                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{tournament.locationInfo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botón Inferior */}
                  <Link
                    href={tournament.href}
                    className="w-full bg-white border border-slate-200 hover:border-slate-300 text-[#001F54] font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all duration-200 cursor-pointer text-center shadow-sm active:scale-[0.99] block"
                  >
                    {tournament.buttonText}
                  </Link>

                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl select-none shadow-sm flex flex-col items-center justify-center gap-4">
            <svg className="w-12 h-12 text-slate-350" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-slate-500 font-bold text-xs">
              No se encontraron torneos que coincidan con la búsqueda.
            </p>
          </div>
        )}

      </main>

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
                <li><a href="#" className="hover:text-white transition-colors duration-200">SITEMAP</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">POLÍTICAS DE PRIVACIDAD</a></li>
                <li><Link href="/contacto" className="hover:text-white transition-colors duration-200">CONTACTO</Link></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200">FEDERACIÓN PROVINCIAL</a></li>
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
