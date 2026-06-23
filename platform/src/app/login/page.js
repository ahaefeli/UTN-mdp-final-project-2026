"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState("JUGADOR");
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Input validation
    if (!dni.trim() || !password.trim()) {
      setError("Por favor, ingresa tus credenciales completas.");
      return;
    }

    setIsLoading(true);

    try {
      // Iniciar sesión real a través de apiClient y actualizar el AuthContext
      const response = await apiClient.post("auth/login/", { email: dni.trim(), password });
      const { token, user } = response.data;
      
      login(token, user);
      
      // Redirigir al dashboard real (ruta raíz)
      router.push("/");
    } catch (err) {
      console.error("Login failure:", err);
      let errorMsg = "Credenciales inválidas o error de conexión con el backend.";
      if (err && err.response && err.response.data && err.response.data.error) {
        errorMsg = err.response.data.error;
      }
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen bg-slate-50 font-sans">
      
      {/* LEFT COLUMN: Institutional Section */}
      <section className="hidden md:flex flex-col justify-between p-12 lg:p-16 bg-[#002F87] text-white relative overflow-hidden">
        
        {/* Volleyball sphere SVG background watermark */}
        <div className="absolute right-0 bottom-0 w-80 h-80 opacity-10 pointer-events-none translate-x-20 translate-y-20 select-none">
          <svg
            viewBox="0 0 100 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="w-full h-full"
          >
            <circle cx="50" cy="50" r="48" />
            <path d="M 50,2 Q 40,40 50,98" />
            <path d="M 2,50 Q 40,40 98,50" />
            <path d="M 15,15 Q 40,40 85,85" />
            <path d="M 15,85 Q 40,40 85,15" />
            <path d="M 50,50 C 30,30 20,20 15,15" />
            <path d="M 50,50 C 70,70 80,80 85,85" />
          </svg>
        </div>

        {/* Branding Logo: "VOLEYHUB" */}
        <div className="relative z-10">
          <div className="italic font-black tracking-wider text-3xl md:text-5xl uppercase relative inline-block select-none leading-none">
            <span className="relative inline-block pb-1.5">
              <span className="text-white">VOLEY</span><span className="text-[#F97316]">HUB</span>
              <span className="absolute left-0 bottom-0 w-full h-[4px] bg-orange-500 rounded" />
            </span>
          </div>
        </div>

        {/* Center Title and Subtitle */}
        <div className="relative z-10 max-w-md my-auto space-y-4">
          <h1 className="text-4xl lg:text-5xl font-light text-white tracking-tight leading-tight">
            Comunidad VOLEYHUB
          </h1>
          <p className="text-sm font-semibold text-slate-200/80 leading-relaxed max-w-sm">
            Accedé al corazón del voley regional. Gestioná tus estadísticas, torneos y vinculación oficial.
          </p>
        </div>

        {/* Bottom Glassmorphic Badge */}
        <div className="relative z-10 self-start">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-xl shadow-black/10">
            {/* Orange Shield Icon */}
            <svg
              className="w-5 h-5 text-orange-400 animate-pulse"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            <span className="text-[10px] font-black uppercase text-white tracking-widest leading-none select-none">
              PORTAL OFICIAL DE GESTIÓN
            </span>
          </div>
        </div>

      </section>

      {/* RIGHT COLUMN: Form Section */}
      <section className="flex flex-col items-center justify-center p-6 md:p-12 bg-white w-full">
        
        {/* Mobile Header Logo (Visible only on tiny screens) */}
        <div className="md:hidden mb-8 self-center">
          <div className="italic font-black tracking-wider text-2xl sm:text-3xl uppercase relative leading-none">
            <span className="relative inline-block pb-1">
              <span className="text-[#001F54]">VOLEY</span><span className="text-[#F97316]">HUB</span>
              <span className="absolute left-0 bottom-0 w-full h-[3.5px] bg-orange-500 rounded" />
            </span>
          </div>
        </div>

        {/* Main centered container */}
        <div className="w-full max-w-md space-y-6">
          
          {/* Header Texts */}
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#002F87] tracking-tight leading-none">
              Bienvenido de nuevo
            </h2>
            <p className="text-xs md:text-sm font-semibold text-slate-400 mt-2">
              Selecciona tu perfil e ingresa tus credenciales.
            </p>
          </div>

          {/* Selector of Profiles (Tabs) */}
          {/* <div className="bg-slate-100/80 border border-slate-200/30 p-1 rounded-2xl flex items-center justify-between">
            {["JUGADOR", "ENTRENADOR", "ÁRBITRO"].map((role) => {
              const isActive = selectedRole === role;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`flex-1 text-center py-2.5 text-[10px] font-black uppercase tracking-wider transition-all duration-200 rounded-xl cursor-pointer ${
                    isActive
                      ? "bg-white text-[#002F87] shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div> */}

          {/* Form Credentials */}
          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            
            {/* Input DOCUMENTO / EMAIL */}
            <div>
              <label className="text-[9px] font-black text-slate-400 tracking-wider mb-2 block uppercase">
                DOCUMENTO / EMAIL
              </label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="Ej: 35.123.456"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#002F87] transition-all duration-200"
              />
            </div>

            {/* Input CONTRASEÑA */}
            <div>
              {/* <div className="flex items-center justify-between mb-2">
                <label className="text-[9px] font-black text-slate-400 tracking-wider block uppercase">
                  CONTRASEÑA
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-[9px] font-black text-orange-500 hover:text-orange-600 hover:underline transition-colors tracking-wider uppercase"
                >
                  ¿OLVIDASTE TU CLAVE?
                </a>
              </div> */}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#002F87] transition-all duration-200"
              />
            </div>

            {/* Error Message Section */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5 text-xs font-bold text-rose-600 animate-shake">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-xl font-extrabold text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-md shadow-blue-900/10 cursor-pointer transition-all duration-200 ${
                isLoading
                  ? "bg-slate-400 cursor-not-allowed shadow-none"
                  : "bg-[#002F87] hover:bg-[#00246B] hover:-translate-y-0.5 active:translate-y-0"
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  Ingresar al Panel
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>

          </form>

          {/* Form Footer link: ¿No tienes cuenta? Registra tu club aquí */}
          <div className="pt-2 text-center text-xs font-bold text-slate-400">
            ¿No tienes cuenta?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert("Simulación de registro");
              }}
              className="text-[#002F87] font-extrabold hover:underline"
            >
              Registra tu club aquí
            </a>
          </div>

        </div>
      </section>

    </div>
  );
}
