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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowLogoutConfirm(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setMenuOpen(false);
    setShowLogoutConfirm(false);
  }, [pathname]);

  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path) => pathname === path;

  return (
    <>
      <nav className={styles.navbar}>
        <Link href="/" className={styles.brand}>
          <h1 className={styles.brandText}>
            Voley<span className={styles.brandTextHighlight}>Hub</span>
          </h1>
        </Link>

        <button
          type="button"
          className={styles.menuToggle}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
        </button>

        <div className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ''}`}>
          <Link
            href="/"
            className={`${styles.navLink} ${isActive('/') ? styles.navLinkActive : ''}`}
          >
            {(role === 'REFEREE' || role === 'SCORER') ? 'Mis partidos' : 'Inicio'}
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

          {role !== 'ADMIN' && (
            <Link
              href="/mis-datos"
              className={`${styles.navLink} ${isActive('/mis-datos') ? styles.navLinkActive : ''}`}
            >
              Mis Datos
            </Link>
          )}

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

        <div className={styles.profileArea}>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{user?.name || user?.username}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
            className={styles.btnLogout}
            aria-label="Cerrar sesión"
          >
            <i className="bi bi-door-open"></i>
          </button>

          {showLogoutConfirm && (
            <div className={styles.logoutPopup}>
              <p className={styles.popupText}>¿Estás seguro de que deseas cerrar sesión?</p>
              <div className={styles.popupActions}>
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className={styles.btnCancelExit}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    logout();
                  }}
                  className={styles.btnConfirmExit}
                >
                  Sí, salir
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
      {menuOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}
