"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Phone, Send, CheckCircle2 } from "lucide-react";

export default function ContactoPage() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  // Form States
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [club, setClub] = useState("");
  const [asunto, setAsunto] = useState("Consulta General");
  const [mensaje, setMensaje] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simular envío del formulario
    setIsSubmitted(true);
    
    // Limpiar campos del formulario
    setNombre("");
    setEmail("");
    setClub("");
    setAsunto("Consulta General");
    setMensaje("");

    // Ocultar el mensaje de éxito después de unos segundos si es necesario,
    // pero mantengámoslo en pantalla como confirmación visual hasta el siguiente envío.
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      
      {/* 1. HEADER PÚBLICO */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-100 h-20 w-full flex items-center justify-between px-4 md:px-8 lg:px-16 select-none relative">
        
        {/* Left: Logo LNV */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="font-black italic text-2xl md:text-3xl leading-tight tracking-tight select-none max-w-[200px] sm:max-w-none cursor-pointer">
              <span className="text-[#001F54]">VOLEY</span><span className="text-[#F97316]">HUB</span>
            </span>
          </Link>
        </div>

        {/* Center: Navigation Links (Todos Inactivos en Ruta /contacto) */}
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
      <section 
        style={{ backgroundImage: "url('/images/contacto/saludo.jpg')" }}
        className="relative w-full h-[220px] md:h-[250px] overflow-hidden flex items-center justify-center bg-cover bg-center"
      >
        {/* Capa Superpuesta (Overlay) */}
        <div className="absolute inset-0 w-full h-full bg-slate-50/85"></div>

        {/* Posición del Texto */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 w-full">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#001F54] uppercase tracking-tight leading-none mb-4">
            CONTACTO
          </h1>
          <p className="text-slate-800 text-sm sm:text-base font-medium max-w-2xl leading-relaxed">
            Estamos para ayudarte. Envíanos tu consulta sobre inscripciones, torneos o afiliaciones de forma rápida y sencilla.
          </p>
        </div>
      </section>

      {/* 3. MAIN CONTENT (2 COLUMNS) */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* COLUMNA IZQUIERDA: FORMULARIO */}
          <div className="flex flex-col gap-6">
            
            {/* Tarjeta de Formulario */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
              
              <div className="mb-6 select-none">
                <h2 className="text-2xl font-black text-[#001F54] tracking-tight">
                  Envíanos un Mensaje
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Completa los campos a continuación y te responderemos a la brevedad.
                </p>
              </div>

              {/* Mensaje de Éxito Condicional */}
              {isSubmitted && (
                <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-2xl flex items-start gap-3 select-none">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs font-bold leading-normal">
                    ¡Mensaje enviado con éxito! Nos pondremos en contacto a la brevedad.
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                
                {/* Nombre y Apellido */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-slate-500 tracking-wider mb-2 uppercase select-none">
                    Nombre y Apellido
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#001F54] focus:ring-1 focus:ring-[#001F54] focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>

                {/* Correo Electrónico */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-slate-500 tracking-wider mb-2 uppercase select-none">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej: juan.perez@email.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#001F54] focus:ring-1 focus:ring-[#001F54] focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>

                {/* Club / Institución (Opcional) */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-slate-500 tracking-wider mb-2 uppercase select-none">
                    Club / Institución <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={club}
                    onChange={(e) => setClub(e.target.value)}
                    placeholder="Ej: Club Huracán"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#001F54] focus:ring-1 focus:ring-[#001F54] focus:bg-white transition-all placeholder-slate-400"
                  />
                </div>

                {/* Asunto (Selector) */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-slate-500 tracking-wider mb-2 uppercase select-none">
                    Asunto
                  </label>
                  <div className="relative">
                    <select
                      value={asunto}
                      onChange={(e) => setAsunto(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 appearance-none outline-none focus:border-[#001F54] focus:ring-1 focus:ring-[#001F54] focus:bg-white transition-all pr-10 cursor-pointer"
                    >
                      <option value="Consulta General">Consulta General</option>
                      <option value="Inscripción a Torneo">Inscripción a Torneo</option>
                      <option value="Afiliación de Club">Afiliación de Club</option>
                      <option value="Prensa">Prensa</option>
                    </select>
                    <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Mensaje */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-slate-500 tracking-wider mb-2 uppercase select-none">
                    Mensaje
                  </label>
                  <textarea
                    required
                    rows="5"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Escribe tu mensaje o consulta detallada aquí..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#001F54] focus:ring-1 focus:ring-[#001F54] focus:bg-white transition-all placeholder-slate-400 resize-none"
                  ></textarea>
                </div>

                {/* Botón de Envío */}
                <button
                  type="submit"
                  className="w-full bg-[#001F54] hover:bg-[#002F87] text-white font-bold text-xs uppercase tracking-wider py-4 px-6 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] select-none"
                >
                  <Send className="w-4 h-4" />
                  Enviar Mensaje
                </button>

              </form>

            </div>

          </div>

          {/* COLUMNA DERECHA: INFORMACIÓN */}
          <div className="flex flex-col gap-8">
            
            {/* Bloque de Información de Contacto y Redes */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col gap-8">
              
              <div className="select-none">
                <h2 className="text-2xl font-black text-[#001F54] tracking-tight">
                  Información de Contacto
                </h2>
              </div>

              <div className="flex flex-col gap-6">
                
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50/50 flex items-center justify-center flex-shrink-0 text-[#F97316]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase select-none">
                      Correo Electrónico
                    </span>
                    <a
                      href="mailto:info@voleyhub.com"
                      className="font-bold text-[#001F54] hover:text-[#002F87] text-sm md:text-base transition-colors"
                    >
                      info@voleyhub.com
                    </a>
                  </div>
                </div>

                

              </div>

              <hr className="border-slate-100" />

              {/* Redes Sociales */}
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase select-none">
                  SEGUINOS EN NUESTRAS REDES
                </span>
                <div className="flex items-center gap-3">
                  {/* Instagram button */}
                  <a
                    href="https://www.instagram.com/voley_hub/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:opacity-90 active:scale-[0.99] transition-all"
                    title="Instagram"
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                    Instagram
                  </a>
                  
                  
                </div>
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
                El software de gestión deportiva que conecta a ligas, clubes y jugadores de vóley en un solo lugar. Simplificá la administración y viví el torneo punto a punto.
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
                <a href="https://www.instagram.com/voley_hub/" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 hover:text-orange-500 text-blue-200 transition-all duration-200" title="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
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

// Custom ChevronDown icon since Lucide is fully imported, but let's reuse ChevronDown from the select
function ChevronDown(props) {
  return (
    <svg
      className={props.className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}
