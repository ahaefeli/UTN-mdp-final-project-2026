'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import authService from '../../services/authService';
import playerService from '../../services/playerService';

export default function MisJugadoresPage() {
  const router = useRouter();
  
  // Estados reactivos
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Validación de la sesión en el cliente
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      loadPlayers();
    }
  }, [router]);

  // Consumir datos de jugadores del backend
  const loadPlayers = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await playerService.getPlayers();
      setPlayers(response.data || []);
    } catch (err) {
      console.error('Error al cargar jugadores:', err);
      let msg = 'Ocurrió un error al obtener la lista de jugadores.';
      if (err.response && err.response.data && err.response.data.error) {
        msg = err.response.data.error;
      } else if (err.request) {
        msg = 'No se pudo conectar al servidor backend.';
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Cabecera del Panel */}
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>
          <span className={styles.headerTitleHighlight}>Mis</span> Jugadores
        </h1>
        
        <div className={styles.actions}>
          <button onClick={loadPlayers} className={styles.btnRefresh} disabled={isLoading}>
            {isLoading ? 'Cargando...' : 'Sincronizar'}
          </button>
          <Link href="/" className={styles.btnBack}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver
          </Link>
        </div>
      </header>

      {/* Alertas de error */}
      {errorMsg && <div className={styles.error}>{errorMsg}</div>}

      {/* Contenedor de la Tabla */}
      <div className={styles.tableWrapper}>
        {isLoading ? (
          <div className={styles.spinner} />
        ) : players.length === 0 ? (
          <div className={styles.emptyState}>
            No se encontraron jugadores registrados en este momento.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Nombre y Apellido</th>
                <th className={styles.th}>DNI</th>
                <th className={styles.th}>Usuario</th>
                <th className={styles.th}>Rol</th>
                <th className={styles.th}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id} className={styles.tr}>
                  <td className={styles.td}>
                    {player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim()}
                  </td>
                  <td className={styles.td}>{player.dni || '-'}</td>
                  <td className={styles.td}>{player.username}</td>
                  <td className={styles.td}>{player.role}</td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${player.enable ? styles.badgeActive : styles.badgeInactive}`}>
                      {player.enable ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
