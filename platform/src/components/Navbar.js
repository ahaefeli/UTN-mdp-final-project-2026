'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, role, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Si el usuario no está autenticado, no se renderiza la barra de navegación (pantalla de login)
  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path) => pathname === path;

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      {/* Brand / Logo */}
      <Link href="/" className={styles.brand}>
        <div className={styles.logo}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <h1 className={styles.brandText}>
          Voley<span className={styles.brandTextHighlight}>Hub</span>
        </h1>
      </Link>

      {/* Enlaces de Navegación Basados en Roles (RBAC) */}
      <div className={styles.navLinks}>
        <Link 
          href="/" 
          className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}
        >
          Inicio
        </Link>

        {/* Enlace para todos los roles (PLAYER y COACH) */}
        {role !== 'ADMIN' && (
          <Link 
            href="/mis-datos" 
            className={`${styles.navLink} ${isActive('/mis-datos') ? styles.navLinkActive : ''}`}
          >
            Mis Datos
          </Link>
        )}

        {/* Enlaces según el rol */}
        {role === 'COACH' && (
          <Link 
            href="/mis-jugadores" 
            className={`${styles.navLink} ${isActive('/mis-jugadores') ? styles.navLinkActive : ''}`}
          >
            Mis Jugadores
          </Link>
        )}

        {role === 'ADMIN' && (
          <>
            <Link 
              href="/usuarios" 
              className={`${styles.navLink} ${isActive('/usuarios') ? styles.navLinkActive : ''}`}
            >
              Usuarios
            </Link>
            <Link 
              href="/clubes" 
              className={`${styles.navLink} ${isActive('/clubes') ? styles.navLinkActive : ''}`}
            >
              Clubes
            </Link>
            <Link 
              href="/torneos" 
              className={`${styles.navLink} ${isActive('/torneos') ? styles.navLinkActive : ''}`}
            >
              Torneo
            </Link>
          </>
        )}
      </div>

      {/* Perfil y Cierre de Sesión */}
      <div className={styles.profileArea}>
        <div className={styles.profileInfo}>
          <div className={styles.avatar}>
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'VH'}
          </div>
          <span className={styles.profileName}>{user?.name || user?.username}</span>
        </div>
        <button onClick={() => setShowLogoutConfirm(!showLogoutConfirm)} className={styles.btnLogout}>
          <i className="bi bi-door-open"></i>
        </button>

        {showLogoutConfirm && (
          <div className={styles.logoutPopup}>
            <p className={styles.popupText}>¿Estás seguro de que deseas cerrar sesión?</p>
            <div className={styles.popupActions}>
              <button 
                onClick={() => setShowLogoutConfirm(false)} 
                className={styles.btnCancelExit}
              >
                Cancelar
              </button>
              <button 
                onClick={logout} 
                className={styles.btnConfirmExit}
              >
                Sí, salir
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
