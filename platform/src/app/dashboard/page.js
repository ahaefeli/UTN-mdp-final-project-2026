'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Dashboard.module.css';
import authService from '../../services/authService';
import matchService from '../../services/matchService';

export default function DashboardPage() {
  const router = useRouter();
  
  // Estados de Datos
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  
  // Estados de Carga y Error
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Validación de sesión y carga de datos inicial
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      setUser(authService.getCurrentUser());
      fetchMatchesData();
    }
  }, [router]);

  // Cargar lista de partidos
  const fetchMatchesData = async () => {
    setIsLoadingMatches(true);
    setErrorMsg('');
    try {
      const response = await matchService.getMatches();
      setMatches(response.data || []);
    } catch (err) {
      console.error('Error fetching matches in Dashboard:', err);
      setErrorMsg('No se pudieron cargar los partidos del servidor.');
    } finally {
      setIsLoadingMatches(false);
    }
  };

  // Manejar Cierre de Sesión
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
      {/* Sidebar de Navegación Lateral */}
      <aside className={styles.sidebar}>
        <div className={styles.brandArea}>
          <div className={styles.shieldIcon}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div className={styles.brandText}>
            Gestión de Club
            <span>Temporada 2026</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <a href="#" className={`${styles.navLink} ${styles.navLinkActive}`}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Panel Principal
          </a>
          <a href="#" className={styles.navLink}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            Mis Jugadores
          </a>
          <a href="#" className={styles.navLink}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Inscripciones
          </a>
        </nav>
      </aside>

      {/* Área de Contenido Principal */}
      <div className={styles.mainArea}>
        {/* Cabecera Superior */}
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>Panel de Control</h1>
          
          <div className={styles.profileArea}>
            <div className={styles.avatar}>
              {user?.name ? user.name.substring(0,2).toUpperCase() : 'VH'}
            </div>
            <span className={styles.profileName}>{user?.name || user?.username}</span>
            <button onClick={handleLogout} className={styles.btnLogout}>
              Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Contenido Dinámico */}
        <main className={styles.content}>
          {/* Banner de Bienvenida */}
          <div className={styles.banner}>
            <h2 className={styles.bannerTitle}>¡Hola, {user?.name || user?.username}!</h2>
            <p className={styles.bannerText}>
              Tu estado de sesión está activo y verificado mediante JWT. Abajo puedes ver la agenda de partidos actualizada del sistema.
            </p>
          </div>

          {/* Grid de Secciones */}
          <div className={styles.grid}>
            {/* Listado de Partidos */}
            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>
                Partidos Programados
                <button onClick={fetchMatchesData} className={styles.btnRefresh} disabled={isLoadingMatches}>
                  {isLoadingMatches ? 'Cargando...' : 'Sincronizar'}
                </button>
              </h2>

              {isLoadingMatches && <div className={styles.spinner} />}

              {errorMsg && <div className={styles.errorText}>{errorMsg}</div>}

              {!isLoadingMatches && !errorMsg && matches.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No se encontraron partidos programados en el sistema.
                </div>
              )}

              {!isLoadingMatches && !errorMsg && matches.length > 0 && (
                <div className={styles.matchList}>
                  {matches.map((match) => (
                    <div key={match.id} className={styles.matchItem}>
                      
                      <div className={styles.matchTeams}>
                        <span className={`${styles.team} ${styles.local}`}>{match.local_team_name}</span>
                        <div className={styles.scoreArea}>
                          <span className={styles.vsBadge}>VS</span>
                          {match.score_summary && <span className={styles.score}>{match.score_summary}</span>}
                        </div>
                        <span className={`${styles.team} ${styles.visitor}`}>{match.visitor_team_name}</span>
                      </div>

                      <div className={styles.matchFooter}>
                        <span>Árbitro: {match.referee_name || 'Sin asignar'}</span>
                        <span className={`${styles.badge} ${match.status === 'FINISHED' ? styles.badgeFinished : styles.badgePending}`}>
                          {match.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Credenciales Activas */}
            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>Perfil Técnico</h2>
              
              <div className={styles.userCard}>
                <div className={styles.bigAvatar}>
                  {user?.name ? user.name.substring(0,2).toUpperCase() : 'VH'}
                </div>
                <h3 className={styles.userCardName}>{user?.name || user?.username}</h3>
                <p className={styles.userCardRole}>{user?.role || 'Miembro'}</p>
                
                <div className={styles.detailsList}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Identificador</span>
                    <span className={styles.detailValue}>{user?.id?.substring(0,18)}...</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>DNI</span>
                    <span className={styles.detailValue}>{user?.dni || 'No provisto'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Tipo Token</span>
                    <span className={styles.detailValue}>Bearer JWT</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
