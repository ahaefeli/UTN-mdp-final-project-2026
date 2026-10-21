import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-slate-950 text-white pt-16 pb-8 px-6 lg:px-16 w-full select-none border-t border-slate-900/60 relative overflow-hidden">
      <div className="absolute left-[-10%] bottom-[-10%] w-96 h-96 rounded-full bg-blue-900/10 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full flex flex-col gap-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex flex-col gap-4 items-start">
            <span className="font-black text-2xl tracking-tight leading-none select-none">
              <span className="text-white">VOLEY</span><span className="text-[#F97316]">HUB</span>
            </span>
            <p className="text-xs text-blue-200/50 leading-relaxed font-semibold max-w-xs">
              El software de gestión deportiva que conecta a ligas, clubes y jugadores de vóley en un solo lugar. Simplificá la administración y viví el torneo punto a punto.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-black tracking-widest text-[#FF8A00] uppercase">
              Navegación
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-blue-200/60 font-bold">
              <li><Link href="/torneos" className="hover:text-white transition-colors duration-200">TORNEOS</Link></li>
              <li><Link href="/resultados" className="hover:text-white transition-colors duration-200">RESULTADOS</Link></li>
              <li><Link href="/sitemap" className="hover:text-white transition-colors duration-200">SITEMAP</Link></li>
              <li><Link href="/privacidad" className="hover:text-white transition-colors duration-200">POLÍTICAS DE PRIVACIDAD</Link></li>
              <li><Link href="/contacto" className="hover:text-white transition-colors duration-200">CONTACTO</Link></li>
              <li><a href="https://feva.org.ar/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200">FEVA</a></li>
            </ul>
          </div>

          <div className="flex flex-col items-start gap-4">
            <h4 className="text-xs font-black tracking-widest text-[#FF8A00] uppercase">
              REDES
            </h4>
            <a
              href="https://www.instagram.com/voley_hub/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 hover:text-orange-500 text-blue-200 transition-all duration-200"
              title="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>
        </div>

        <hr className="border-slate-900/60 my-2" />

        <span className="text-xs text-blue-200/35 select-none font-semibold">
          © 2026 VOLEYHUB
        </span>
      </div>
    </footer>
  );
}
