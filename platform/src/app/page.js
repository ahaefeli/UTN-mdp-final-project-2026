'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import authService from '../services/authService';
import matchService from '../services/matchService';

export default function RootDashboardPage() {
  const router = useRouter();
  
  // Estados reactivos
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  
  // Estados de carga y error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Validación de la sesión en el cliente
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      setUser(authService.getCurrentUser());
      loadMatches();
    }
  }, [router]);

  // Carga de partidos desde el servicio
  const loadMatches = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await matchService.getMatches();
      setMatches(response.data || []);
    } catch (err) {
      console.error('Error al cargar partidos en Dashboard raíz:', err);
      setError('Error al sincronizar con el backend de partidos.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cierre de sesión y limpieza de JWT
  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Sidebar Lateral */}
      <aside className={styles.sidebar}>
        <div className={styles.brandHeader}>
          <div className={styles.brandLogo}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div className={styles.brandTitle}>
            Gestión de Club
            <span className={styles.brandSubtitle}>TEMPORADA 2026</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <a href="/" className={`${styles.navLink} ${styles.navLinkActive}`}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Panel Principal
          </a>
          <a href="/mis-jugadores" className={styles.navLink}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            Mis Jugadores
          </a>
          <a href="/inscripciones" className={styles.navLink}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Inscripciones
          </a>
        </nav>
      </aside>

      {/* Cuerpo principal */}
      <div className={styles.mainArea}>
        {/* Cabecera superior */}
        <header className={styles.header}>
          <div className={styles.headerTitle}>Dashboard Central</div>
          
          <div className={styles.headerActions}>
            <div className={styles.profileButton}>
              <div className={styles.avatar}>
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'VH'}
              </div>
              <span className={styles.profileName}>{user?.name || user?.username}</span>
            </div>
            <button onClick={handleLogout} className={styles.btnLogout}>
              Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Sección scrolleable de contenidos */}
        <div className={styles.scrollContent}>
          <div className={styles.dashboardLayout}>
            {/* Banner superior */}
            <div className={styles.banner}>
              <h2 className={styles.bannerTitle}>¡Hola, {user?.name || user?.username}!</h2>
              <p className={styles.bannerText}>
                Tu sesión está conectada correctamente al backend Django. Abajo puedes ver el estado y los partidos oficiales registrados.
              </p>
            </div>

            {/* Grid */}
            <div className={styles.grid}>
              {/* Sección de Partidos */}
              <section className={styles.card}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Partidos Oficiales</h3>
                  <button onClick={loadMatches} className={styles.refreshButton} disabled={isLoading}>
                    {isLoading ? 'Sincronizando...' : 'Sincronizar'}
                  </button>
                </div>

                {isLoading && <div className={styles.spinner} />}

                {error && <div className={styles.errorBox}>{error}</div>}

                {!isLoading && !error && matches.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
                    No hay partidos programados disponibles en el sistema.
                  </div>
                )}

                {!isLoading && !error && matches.length > 0 && (
                  <div className={styles.matchList}>
                    {matches.map((match) => (
                      <div key={match.id} className={styles.matchItem}>
                        <div className={styles.matchMeta}>
                          <span>ID: {match.id.substring(0, 8)}...</span>
                          <span>{match.match_datetime ? new Date(match.match_datetime).toLocaleString() : 'Fecha a confirmar'}</span>
                        </div>
                        
                        <div className={styles.matchTeams}>
                          <span className={`${styles.team} ${styles.localTeam}`}>{match.local_team_name}</span>
                          <div className={styles.scoreArea}>
                            <span className={styles.vsBadge}>VS</span>
                            {match.score_summary && <span className={styles.scoreText}>{match.score_summary}</span>}
                          </div>
                          <span className={`${styles.team} ${styles.visitorTeam}`}>{match.visitor_team_name}</span>
                        </div>

                        <div className={styles.matchFooter}>
                          <span>Árbitro: {match.referee_name || 'Sin asignar'}</span>
                          <span className={`${styles.statusBadge} ${
                            match.status === 'FINISHED' ? styles.badgeFinished : styles.badgePending
                          }`}>
                            {match.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Perfil Técnico */}
              <section className={styles.card}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Estado de la Conexión</h3>
                </div>
                
                <div className={styles.techInfoList}>
                  <div className={styles.techItem}>
                    <span className={styles.techLabel}>Rol Asignado</span>
                    <span className={styles.techValue} style={{ color: '#FF8A00' }}>{user?.role}</span>
                  </div>
                  <div className={styles.techItem}>
                    <span className={styles.techLabel}>DNI Asociado</span>
                    <span className={styles.techValue}>{user?.dni || 'No provisto'}</span>
                  </div>
                  <div className={styles.techItem}>
                    <span className={styles.techLabel}>Autenticación</span>
                    <span className={styles.techValue}>Bearer JWT Header</span>
                  </div>
                  <div className={styles.techItem}>
                    <span className={styles.techLabel}>Servidor API</span>
                    <span className={styles.techValue} style={{ fontFamily: 'monospace' }}>127.0.0.1:8000</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
