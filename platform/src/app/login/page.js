"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";
import { Button, Alert } from "../../components/ui";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
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
      let errorMsg = "Credenciales inválidas";
      if (err && err.response && err.response.data && err.response.data.error) {
        errorMsg = err.response.data.error;
      }
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.authShell}>
      <div className={styles.authCard}>
        <p className={styles.brand}>VoleyHub</p>

        <div className={styles.header}>
          <h1 className={styles.title}>Bienvenido de nuevo</h1>
          <p className={styles.subtitle}>
            Clubes, entrenadores, árbitros, planilleros y administración usan el mismo ingreso.
          </p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="login-dni">
              Documento, email o usuario
            </label>
            <input
              id="login-dni"
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="DNI, email o usuario"
              disabled={isLoading}
              className={styles.input}
              autoComplete="username"
              required
              onInvalid={(e) => e.target.setCustomValidity('Ingresá tu documento, email o usuario.')}
              onInput={(e) => e.target.setCustomValidity('')}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="login-password">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              disabled={isLoading}
              className={styles.input}
              autoComplete="current-password"
              required
              onInvalid={(e) => e.target.setCustomValidity('Ingresá tu contraseña.')}
              onInput={(e) => e.target.setCustomValidity('')}
            />
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <Button type="submit" block disabled={isLoading}>
            {isLoading ? "Procesando..." : "Ingresar al Panel"}
          </Button>
        </form>

        <div className={styles.footer}>
          ¿Queres ser parte?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert("Simulación de contacto");
            }}
            className={styles.footerLink}
          >
            Contactanos
          </a>
        </div>
      </div>
    </div>
  );
}
