"use client";
import SiteFooter from "../../components/SiteFooter";
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
            Última actualización: 21 de octubre de 2026
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
              <li><strong>Información de los jugadores:</strong> Datos necesarios para el fichaje y las listas de buena fe, tales como nombre completo, Documento Nacional de Identidad (DNI), fecha de nacimiento, categoría competitiva y estado de aptitud médica. En Sub-14 y Sub-16 esos datos corresponden a personas menores de edad.</li>
              <li><strong>Datos de uso:</strong> Información técnica sobre la interacción con el portal público y el portal de gestión con el fin de optimizar el rendimiento y la seguridad del sistema.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#001F54] text-2xl font-bold mb-4">
              2. Ley 25.326
            </h2>
            <p className="text-slate-700 leading-relaxed">
              El tratamiento de datos personales se rige por la Ley 25.326 de Protección de los Datos Personales y sus normas complementarias. El DNI, la fecha de nacimiento y la aptitud médica se usan para fichar jugadores, ubicarlos en su categoría y controlar que puedan competir. No se venden ni se usan para otra finalidad.
            </p>
            <p className="text-slate-700 leading-relaxed mt-3">
              Quien figure en la plataforma puede pedir acceso, rectificación, actualización o supresión de sus datos, en los términos de esa ley. El órgano de control es la Agencia de Acceso a la Información Pública. El pedido también puede hacerse por el canal de contacto de VoleyHub.
            </p>
          </section>

          <section>
            <h2 className="text-[#001F54] text-2xl font-bold mb-4">
              3. Datos de menores
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Las categorías Sub-14 y Sub-16 están integradas por niñas, niños y adolescentes. Para inscribirlos el club carga nombre, DNI y fecha de nacimiento. Ese alta requiere el consentimiento del padre, la madre o el tutor legal, que el club debe tener antes de cargar al jugador.
            </p>
            <p className="text-slate-700 leading-relaxed mt-3">
              El DNI y la fecha de nacimiento no se publican en el sitio abierto. Los derechos de acceso, rectificación y supresión de esos datos los ejercen el padre, la madre o el tutor, o el adolescente cuando la ley se lo permite. La aptitud médica es un dato de salud y se trata solo para habilitar la participación en la competencia.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-[#001F54] text-2xl font-bold mb-4">
              4. Uso de la información
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
              5. Protección de datos
            </h2>
            <p className="text-slate-700 leading-relaxed">
              La seguridad de la información de nuestros usuarios es una prioridad absoluta. Por ello, implementamos una serie de medidas organizativas, administrativas y técnicas diseñadas para proteger sus datos personales contra el acceso no autorizado, la alteración, divulgación o destrucción no autorizada:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2 text-slate-700 leading-relaxed">
              <li>Cifrado de datos en tránsito y almacenamiento de contraseñas de acceso mediante métodos criptográficos seguros.</li>
              <li>Restricciones de acceso para asegurar que únicamente los administradores autorizados de VoleyHub y delegados de cada club tengan ingreso al panel interno.</li>
              <li>Revisiones y auditorías periódicas del software de la plataforma para mitigar posibles vulnerabilidades informáticas.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-[#001F54] text-2xl font-bold mb-4">
              6. Compartir información
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
              7. Derechos del usuario
            </h2>
            <p className="text-slate-700 leading-relaxed">
              De acuerdo con la Ley 25.326, los titulares de los datos —y, si son menores, su padre, madre o tutor— pueden ejercer estos derechos a través del club o escribiendo a la administración de la liga:
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
      <SiteFooter />

    </div>
  );
}
