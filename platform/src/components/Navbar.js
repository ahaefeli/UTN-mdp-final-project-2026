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
        
        {role === 'ADMIN' && (
          <Link 
            href="/torneos" 
            className={`${styles.navLink} ${isActive('/torneos') ? styles.navLinkActive : ''}`}
          >
            Torneos
          </Link>
        )}

        <Link 
          href="/resultados" 
          className={`${styles.navLink} ${isActive('/resultados') ? styles.navLinkActive : ''}`}
        >
          Resultados y Posiciones
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

        {role === 'CLUB_ADMIN' && (
          <>
            <Link 
              href="/mis-equipos" 
              className={`${styles.navLink} ${isActive('/mis-equipos') ? styles.navLinkActive : ''}`}
            >
              Mis Equipos
            </Link>
            <Link 
              href="/gestion-club" 
              className={`${styles.navLink} ${isActive('/gestion-club') ? styles.navLinkActive : ''}`}
            >
              Gestión del Club
            </Link>
          </>
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
              href="/arbitros" 
              className={`${styles.navLink} ${isActive('/arbitros') ? styles.navLinkActive : ''}`}
            >
              Árbitros
            </Link>
            <Link 
              href="/planilleros" 
              className={`${styles.navLink} ${isActive('/planilleros') ? styles.navLinkActive : ''}`}
            >
              Planilleros
            </Link>
          </>
        )}
      </div>

      {/* Perfil y Cierre de Sesión */}
      <div className={styles.profileArea}>
        <div className={styles.profileInfo}>
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
