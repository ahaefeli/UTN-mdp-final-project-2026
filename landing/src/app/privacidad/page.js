"use client";
import { getPlatformLoginUrl } from '../../utils/platformUrl';

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PrivacidadPage() {
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

        {/* Center: Navigation Links (Todos inactivos en esta ruta legal) */}
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
            href={getPlatformLoginUrl()}
            className="bg-[#001F54] hover:bg-blue-950 text-white font-semibold text-[11px] md:text-sm py-2 px-3 md:py-2.5 md:px-5 rounded-lg transition-all duration-200 cursor-pointer shadow-sm shadow-blue-950/10 whitespace-nowrap hidden sm:flex"
          >
            Acceso Clubes
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
              href={getPlatformLoginUrl()}
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full bg-[#001F54] hover:bg-blue-950 text-white font-semibold text-center py-3 rounded-lg transition-all duration-200 cursor-pointer shadow-sm shadow-blue-950/10 text-sm"
            >
              Acceso Clubes
            </a>
          </div>
        )}

      </header>

      {/* 2. HERO SECTION */}
      <section 
        style={{ backgroundImage: "url('/images/sitemap/privacidad.jpg')" }}
        className="relative w-full h-[220px] md:h-[250px] overflow-hidden flex items-center justify-center bg-cover bg-center"
      >
        {/* Capa Superpuesta (Overlay) */}
        <div className="absolute inset-0 w-full h-full bg-slate-50/85"></div>

        {/* Posición del Texto */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 w-full">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#001F54] uppercase tracking-tight leading-none mb-4">
            Políticas de Privacidad
          </h1>
          <p className="text-slate-800 text-sm sm:text-base font-medium max-w-2xl leading-relaxed">
            Última actualización: 14 de Junio de 2026
          </p>
        </div>
      </section>

      {/* 3. MAIN CONTENT (Legal Content Container) */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12">
        <div className="space-y-8">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-[#001F54] text-2xl font-bold mb-4">
              1. Información que recopilamos
            </h2>
            <p className="text-slate-700 leading-relaxed">
              En VOLEYHUB recopilamos y procesamos datos personales necesarios para el correcto funcionamiento de nuestra plataforma deportiva e institucional. Esto incluye:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2 text-slate-700 leading-relaxed">
              <li><strong>Datos de registro de clubes:</strong> Información provista por los delegados de las instituciones afiliadas (nombre de la institución, dirección, contactos del entrenador y personal responsable).</li>
              <li><strong>Información de los jugadores:</strong> Datos necesarios para el fichaje y listas de buena fe, tales como nombre completo, Documento Nacional de Identidad (DNI), fecha de nacimiento, categoría competitiva y estado de aptitud médica.</li>
              <li><strong>Datos de uso:</strong> Información técnica sobre la interacción con el portal público y el portal de gestión con el fin de optimizar el rendimiento y la seguridad del sistema.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-[#001F54] text-2xl font-bold mb-4">
              2. Uso de la información
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Los datos que recolectamos son utilizados exclusivamente con fines de gestión deportiva y organizativa de la Liga:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2 text-slate-700 leading-relaxed">
              <li>Administrar y validar las inscripciones de equipos y jugadores en los torneos oficiales de la temporada.</li>
              <li>Elaborar tablas de posiciones, estadísticas individuales y colectivas, fixture y calendarios de partidos.</li>
              <li>Mantener una vía de comunicación fluida y oficial con los delegados y entrenadores para notificaciones reglamentarias o disciplinarias.</li>
              <li>Garantizar que todos los jugadores cuenten con su aptitud médica vigente para la prevención de riesgos de salud.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-[#001F54] text-2xl font-bold mb-4">
              3. Protección de datos
            </h2>
            <p className="text-slate-700 leading-relaxed">
              La seguridad de la información de nuestros usuarios es una prioridad absoluta. Por ello, implementamos una serie de medidas organizativas, administrativas y técnicas diseñadas para proteger sus datos personales contra el acceso no autorizado, la alteración, divulgación o destrucción no autorizada:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2 text-slate-700 leading-relaxed">
              <li>Cifrado de datos en tránsito y almacenamiento de contraseñas de acceso mediante métodos criptográficos seguros.</li>
              <li>Restricciones de acceso para asegurar que únicamente los administradores autorizados de la LNV y delegados de cada club tengan ingreso al panel interno.</li>
              <li>Revisiones y auditorías periódicas del software de la plataforma para mitigar posibles vulnerabilidades informáticas.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-[#001F54] text-2xl font-bold mb-4">
              4. Compartir información
            </h2>
            <p className="text-slate-700 leading-relaxed">
              VOLEYHUB se compromete a no vender, comercializar ni ceder los datos de los usuarios a terceros bajo ninguna circunstancia mercantil. La información recopilada solo será compartida en los siguientes casos:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2 text-slate-700 leading-relaxed">
              <li><strong>Entidades Oficiales Reguladoras:</strong> Con la Federación del Voleibol Argentino (FeVA) y federaciones provinciales cuando sea un requisito reglamentario para el fichaje y homologación de torneos.</li>
              <li><strong>Requerimiento Legal:</strong> Cuando sea exigido por autoridades competentes o en cumplimiento de una obligación legal vigente en el marco normativo de la República Argentina.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-[#001F54] text-2xl font-bold mb-4">
              5. Derechos del usuario
            </h2>
            <p className="text-slate-700 leading-relaxed">
              De acuerdo con la legislación de protección de datos personales, los usuarios, a través de los delegados y responsables autorizados de sus respectivos clubes, gozan de plenos derechos sobre su información. Estos derechos incluyen:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2 text-slate-700 leading-relaxed">
              <li><strong>Acceso y rectificación:</strong> Consultar la información cargada en el sistema y solicitar la corrección inmediata de cualquier dato incorrecto o desactualizado.</li>
              <li><strong>Eliminación o baja:</strong> Solicitar la baja de los registros del sistema, siempre y cuando no interfiera con compromisos reglamentarios vigentes en los torneos en curso de la Liga.</li>
              <li><strong>Consultas:</strong> Ante cualquier duda o reclamo sobre el tratamiento de sus datos personales, puede ponerse en contacto con la administración oficial de la liga enviando un correo electrónico a nuestro canal de soporte.</li>
            </ul>
          </section>

        </div>
      </main>

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
