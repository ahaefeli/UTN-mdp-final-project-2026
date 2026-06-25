"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";



export default function TorneosPage() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRama, setSelectedRama] = useState("Todas");
  const [selectedCategoria, setSelectedCategoria] = useState("Todas");
  const [selectedLiga, setSelectedLiga] = useState("Todas");

  // Estados para la API
  const [tournaments, setTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Conexión con el Backend (useEffect)
  useEffect(() => {
    let active = true;

    const fetchTournaments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/internal';
        const params = new URLSearchParams();

        if (searchTerm) {
          params.append("search", searchTerm);
        }
        if (selectedLiga !== "Todas") {
          params.append("liga", selectedLiga);
        }
        if (selectedRama !== "Todas") {
          params.append("rama", selectedRama);
        }
        if (selectedCategoria !== "Todas") {
          params.append("categoria", selectedCategoria);
        }

        const queryString = params.toString();
        const url = `${baseUrl}/torneos/${queryString ? `?${queryString}` : ""}`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Error de servidor (${res.status})`);
        }

        const json = await res.json();

        if (active) {
          const mapped = (json.data || []).map((t) => {
            let badgeText = "Próximamente";
            let badgeType = "upcoming";

            if (t.status === "IN_PROGRESS") {
              badgeText = "EN DISPUTA";
              badgeType = "live";
            } else if (t.status === "FINISHED") {
              badgeText = "FINALIZADO";
              badgeType = "default";
            } else if (t.status === "CANCELLED") {
              badgeText = "CANCELADO";
              badgeType = "default";
            }

            const ramaFormatted = t.branch === "MALE" ? "Masculino" : t.branch === "FEMALE" ? "Femenino" : t.branch;
            const catFormatted = t.category ? t.category.replace("_", " ") : "";
            const categoryText = `${catFormatted.charAt(0).toUpperCase() + catFormatted.slice(1).toLowerCase()} - ${ramaFormatted}`;

            let dateInfo = "A definir";
            if (t.start_date) {
              try {
                const d = new Date(t.start_date + "T00:00:00");
                dateInfo = d.toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
              } catch (e) {
                dateInfo = `Inicio: ${t.start_date}`;
              }
            }

            return {
              id: t.id,
              title: t.name || "Sin título",
              category: categoryText,
              badgeText,
              badgeType,
              dateInfo,
              locationInfo: t.organization_name || "Sede a confirmar",
              buttonText: "VER DETALLES",
              image: "/images/inicio/torneo-apertura.jpg",
              href: `/torneos/${t.id}`,
            };
          });

          setTournaments(mapped);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Error al conectar con la API.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchTournaments();

    return () => {
      active = false;
    };
  }, [searchTerm, selectedLiga, selectedRama, selectedCategoria]);

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
          <div className="flex items-center gap-3 flex-1 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
            <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar torneo..."
              className="w-full text-sm font-semibold text-slate-700 placeholder-slate-400 outline-none bg-transparent"
            />
          </div>

          {/* Filtros (Ligas, Rama y Categoría) */}
          <div className="flex gap-4 items-center flex-wrap">
            {/* Select de Ligas */}
            <select
              value={selectedLiga}
              onChange={(e) => setSelectedLiga(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2.5 outline-none font-semibold cursor-pointer"
            >
              <option value="Todas">Todas las Ligas</option>
              <option value="Liga Necochense">Liga Necochense</option>
              <option value="Liga Marplatense">Liga Marplatense</option>
            </select>

            {/* Select de Rama */}
            <select
              value={selectedRama}
              onChange={(e) => setSelectedRama(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2.5 outline-none font-semibold cursor-pointer"
            >
              <option value="Todas">Todas las Ramas</option>
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
            </select>

            {/* Select de Categoría */}
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2.5 outline-none font-semibold cursor-pointer"
            >
              <option value="Todas">Todas las Categorías</option>
              <option value="Minis">Minis</option>
              <option value="Sub-14">Sub-14</option>
              <option value="Sub-16">Sub-16</option>
              <option value="Sub-18">Sub-18</option>
              <option value="Sub-21">Sub-21</option>
              <option value="Primera">Primera</option>
              <option value="Maxi">Maxi</option>
            </select>
          </div>

        </div>
      </div>

      {/* 4. GRILLA DE TORNEOS (TARJETAS) */}
      <main className="py-20 px-6 lg:px-16 max-w-7xl mx-auto w-full flex-grow flex flex-col gap-10">
        
        {isLoading ? (
          <div className="text-center py-16 flex flex-col items-center justify-center gap-4 w-full">
            <span className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
            <p className="text-slate-500 font-bold text-sm">Cargando torneos...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center select-none shadow-sm flex flex-col items-center justify-center gap-3">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-700 font-bold text-sm">
              Hubo un error al cargar los torneos.
            </p>
            <p className="text-red-500 text-xs">{error}</p>
          </div>
        ) : tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full group"
              >
                
                {/* Imagen Superior */}
                <div className="relative w-full h-52 overflow-hidden bg-slate-900">
                  <img
                    src={tournament.image}
                    alt={tournament.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102 object-center"
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
          <div className="col-span-full w-full py-20 flex flex-col items-center justify-center text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <h3 className="text-lg font-semibold text-slate-700">No se encontraron torneos</h3>
            <p className="text-slate-500 mt-2">No hay competencias disponibles para los filtros seleccionados en este momento.</p>
          </div>
        )}

      </main>

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
