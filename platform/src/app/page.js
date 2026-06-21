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
      {/* Sección scrolleable de contenidos */}
      <div className={styles.scrollContent} style={{ width: '100%' }}>
        <div className={styles.dashboardLayout}>
          {/* Banner superior */}
          <div className={styles.banner}>
            <h2 className={styles.bannerTitle}>¡Hola, {user?.name || user?.username}!</h2>
            <p className={styles.bannerText}>
              ¡Te damos la bienvenida a VoleyHub! Aquí puedes ver el resumen de tu actividad y los próximos partidos.
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
          </div>
        </div>
      </div>
    </div>
  );
}
