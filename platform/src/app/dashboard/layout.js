"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Panel Principal",
      href: "/dashboard",
      icon: (
        <svg
          className="w-5 h-5 mr-3 transition-colors"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      ),
    },
    {
      name: "Mis Jugadores",
      href: "/dashboard/jugadores",
      icon: (
        <svg
          className="w-5 h-5 mr-3 transition-colors"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
      ),
    },
    {
      name: "Inscripciones",
      href: "/dashboard/inscripciones",
      icon: (
        <svg
          className="w-5 h-5 mr-3 transition-colors"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      ),
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#F4F5F7] text-slate-800">
      {/* Brand Logo Header: "Gestión de Club | TEMPORADA 2026" */}
      <div className="flex items-center px-6 py-5 border-b border-slate-200/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-[#002F87] to-indigo-900 text-white shadow-md shadow-blue-900/10">
            {/* Shield/Club Logo */}
            <svg
              className="w-6.5 h-6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <div>
            <h2 className="font-extrabold text-[#002F87] text-sm leading-tight tracking-tight">
              Gestión de Club
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              TEMPORADA 2026
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <div key={item.name} className="px-3">
              <a
                href={item.href}
                onClick={item.href === "#" ? (e) => e.preventDefault() : undefined}
                className={`flex items-center px-4 py-3 text-sm font-bold rounded-r-none transition-all duration-200 group ${
                  isActive
                    ? "bg-white text-blue-950 border-l-[5px] border-orange-500 shadow-sm rounded-lg"
                    : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 rounded-lg"
                }`}
              >
                <span
                  className={`transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? "text-[#002F87]" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                >
                  {item.icon}
                </span>
                {item.name}
              </a>
            </div>
          );
        })}
      </nav>

    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden overflow-x-hidden font-sans w-full">
      {/* Desktop Sidebar (Left) */}
      <aside className="hidden md:flex md:flex-col md:fixed md:top-0 md:left-0 md:h-screen md:w-64 flex-shrink-0 border-r border-slate-200/50 shadow-sm z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer (Left) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-full max-w-xs h-full bg-[#F4F5F7] shadow-2xl transition-transform duration-300">
            <div className="absolute top-4 right-4 z-55">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-200 text-slate-600 hover:text-slate-900"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-full overflow-y-auto">
              <SidebarContent />
            </div>
          </div>
        </div>
      )}

      {/* Main Right Area */}
      <div className="flex flex-col flex-1 min-w-0 md:ml-64 overflow-y-auto overflow-x-hidden bg-slate-50">
        {/* Header (Top) */}
        <header className={`sticky top-0 z-30 flex items-center justify-between transition-all duration-200 ${
          pathname?.startsWith("/dashboard/jugadores") || pathname?.startsWith("/dashboard/inscripciones")
            ? "bg-slate-50/90 backdrop-blur-md border-b border-slate-200/30 py-4 md:py-5 px-4 md:px-8 mx-auto max-w-7xl w-full"
            : "bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-sm py-4 md:py-5 px-4 lg:px-8 mx-4 lg:mx-8 my-4"
        }`}>
          {/* Left: Mobile Menu Button + Title "DASHBOARD CENTRAL" in Italic, Bold, Dark Blue */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 md:hidden cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            {pathname?.startsWith("/dashboard/jugadores") ? (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-orange-500 tracking-widest uppercase select-none leading-none">
                  PLANTEL ACTIVO
                </span>
                <h1 className="text-blue-950 font-black tracking-tight text-xl md:text-3xl select-none leading-none">
                  Mis Jugadores
                </h1>
              </div>
            ) : pathname?.startsWith("/dashboard/inscripciones") ? (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-orange-500 tracking-widest uppercase select-none leading-none">
                  PROCESO DE REGISTRO
                </span>
                <h1 className="text-blue-950 font-black tracking-tight text-xl md:text-3xl select-none leading-none">
                  Nueva Inscripción
                </h1>
              </div>
            ) : (
              <h1 className="text-[#002F87] font-extrabold italic tracking-wider text-sm sm:text-lg md:text-xl lg:text-3xl uppercase leading-none select-none">
                DASHBOARD CENTRAL
              </h1>
            )}
          </div>

          {/* Right: Search, Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
            {/* Search Input Bar */}
            <div className="relative hidden lg:block lg:w-64 xl:w-80">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar torneos, jugadores..."
                className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200/80 bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#002F87] focus:bg-white transition-all duration-200"
              />
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer relative group">
                <svg className="w-6 h-6 transition-transform duration-200 group-hover:rotate-12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a9.049 9.049 0 01-5.186 0m5.186 0a9 9 0 00-11.968-4.75M14.857 17.082a9 9 0 00-11.968-4.75M9.186 17.082a9 9 0 00.186-1.503v-1.833A5.992 5.992 0 0112 4.5v0a5.992 5.992 0 016 5.917v1.833a9.07 9.07 0 00.186 1.503m-16.372 0h16.372" />
                </svg>
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-orange-500"></span>
              </button>
            </div>

            {/* Profile Dropdown */}
            <div className="relative border-l border-slate-200 pl-4 py-1 flex items-center">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 rounded-xl hover:bg-slate-55 transition-colors text-left cursor-pointer"
              >
                {/* User Avatar Circle */}
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500 font-extrabold text-white text-sm shadow-md shadow-orange-500/10">
                  MV
                </div>
                {/* User Name & Chevron */}
                <div className="hidden lg:block">
                  <p className="text-sm font-black text-slate-800 leading-none">
                    Marcos Valenzuela
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 hidden lg:block ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 top-10 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsProfileOpen(false);
                    }}
                    className="flex items-center px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-950 transition-colors"
                  >
                    Ver perfil
                  </a>
                  <hr className="my-1.5 border-slate-100" />
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsProfileOpen(false);
                    }}
                    className="flex items-center px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  >
                    Cerrar Sesión
                  </a>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Main Content Area */}
        <main className="flex-1 p-4 md:p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
