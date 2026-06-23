'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import authService from '../services/authService';
import matchService from '../services/matchService';
import userService from '../services/userService';
import apiClient from '../services/apiClient';
import { ROLE_TRANSLATIONS } from '../utils/roles';
import { STATUS_TRANSLATIONS } from '../utils/status';

// Componentes del Dashboard de Administración
import InfoCard from '../components/InfoCard/InfoCard';
import QuickActions from '../components/QuickActions/QuickActions';
import PendingAlerts from '../components/PendingAlerts/PendingAlerts';

// Iconos Lucide
import { Shield, Users, Trophy, CalendarCheck } from 'lucide-react';

export default function RootDashboardPage() {
  const router = useRouter();
  
  // Estados reactivos
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const role = user?.role;
  const [userDetails, setUserDetails] = useState(null);
  const [matches, setMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  
  // Estados de carga y error
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(false);
  const [error, setError] = useState('');

  // Estados para el panel de administración
  const [metrics, setMetrics] = useState(null);
  const [pendingActions, setPendingActions] = useState([]);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);

  // Carga de datos para el dashboard de administración
  const loadAdminDashboard = async () => {
    setIsLoadingAdmin(true);
    setError('');
    try {
      const response = await apiClient.get('internal/dashboard/admin/');
      const data = response.data || {};
      
      // Actualizar el estado de métricas mapeando la raíz
      setMetrics({
        total_clubs: data.total_clubs || 0,
        federated_players: data.federated_players || { total: 0, masculino: 0, femenino: 0 },
        active_tournaments: data.active_tournaments || 0,
        matches_without_referee: data.matches_without_referee || 0
      });

      // Actualizar las alertas con fallback a array vacío
      setPendingActions(data.pending_actions || []);
    } catch (err) {
      console.error('Error al cargar datos del dashboard de administrador:', err);
      setError('Error al sincronizar con el backend de administración.');
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  // Validación de la sesión en el cliente
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    } else {
      const currentUser = authService.getCurrentUser();
      setIsAuthenticated(true);
      setUser(currentUser);
      if (currentUser && currentUser.role === 'ADMIN') {
        loadAdminDashboard();
      } else {
        loadMatches();
        if (currentUser && currentUser.id) {
          loadUserDetails(currentUser.id);
        }
      }
    }
  }, [router]);

  // Carga de perfil completo de usuario para obtener team_id y club_name
  const loadUserDetails = async (userId) => {
    try {
      const response = await userService.getUserById(userId);
      const details = response.data || null;
      setUserDetails(details);
      if (details) {
        if (details.role === 'ADMIN') {
          loadUpcomingMatches();
        } else if (details.team_id) {
          loadUpcomingMatches(details.team_id);
        }
      }
    } catch (err) {
      console.error('Error al cargar perfil completo de usuario:', err);
    }
  };

  // Carga de partidos oficiales generales
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

  // Carga de partidos futuros filtrados por team_id
  const loadUpcomingMatches = async (teamId) => {
    setIsLoadingUpcoming(true);
    try {
      const params = { upcoming: 'true' };
      if (teamId) {
        params.team_id = teamId;
      }
      const response = await matchService.getMatches(params);
      setUpcomingMatches(response.data || []);
    } catch (err) {
      console.error('Error al cargar próximas fechas del equipo:', err);
    } finally {
      setIsLoadingUpcoming(false);
    }
  };

  // Cierre de sesión y limpieza de JWT
  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (role === 'ADMIN') {
    return (
      <div className={`${styles.container} container`}>
        <div className={styles.scrollContent} style={{ width: '100%' }}>
          <div className={styles.dashboardLayout} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header del Admin */}
              <h2 className={styles.adminTitle}>Panel de Control</h2>

            {isLoadingAdmin ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div className={styles.spinner} />
              </div>
            ) : (
              <>
                {error && <div className={styles.errorBox}>{error}</div>}

                {/* Grid de 4 InfoCards */}
                <div className={styles.metricsGrid}>
                  <InfoCard 
                    title="Total Clubes" 
                    value={metrics?.total_clubs ?? 0} 
                    icon={Shield} 
                  />
                  <InfoCard 
                    title="Jugadores Federados" 
                    value={metrics?.federated_players?.total ?? 0} 
                    subValue={metrics?.federated_players ? `Masculino: ${metrics.federated_players.masculino} | Femenino: ${metrics.federated_players.femenino}` : ''} 
                    icon={Users} 
                  />
                  <InfoCard 
                    title="Torneos en Curso" 
                    value={metrics?.active_tournaments ?? 0} 
                    icon={Trophy} 
                  />
                  <InfoCard 
                    title="Partidos sin Árbitro" 
                    value={metrics?.matches_without_referee ?? 0} 
                    icon={CalendarCheck} 
                  />
                </div>

                {/* Sección Acciones Rápidas */}
                <QuickActions />

                {/* Sección Alertas Pendientes */}
                <PendingAlerts alerts={pendingActions} />
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Sección scrolleable de contenidos */}
      <div className={styles.scrollContent} style={{ width: '100%' }}>
        <div className={styles.dashboardLayout}>
          {/* Grid de 2 Columnas */}
          <div className={styles.grid}>
            {/* Columna Izquierda: Contenido Principal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Sección de Partidos Oficiales */}
              <section className={styles.card}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Partidos Recientes</h3>
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
                            {STATUS_TRANSLATIONS[match.status] || match.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Columna Derecha: Tarjetas del Sidebar */}
            <aside className={styles.sidebarCards}>
              {/* Tarjeta Próximas Fechas */}
              <section className={styles.card}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Próximas Fechas</h3>
                </div>
                {isLoadingUpcoming ? (
                  <div className={styles.spinner} />
                ) : upcomingMatches.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
                    No hay partidos programados próximamente.
                  </div>
                ) : (
                  <div className={styles.matchList}>
                    {upcomingMatches.slice(0, 3).map((match) => (
                      <div key={match.id} className={styles.matchItem} style={{ padding: '0.75rem', gap: '0.5rem' }}>
                        <div className={styles.matchMeta} style={{ fontSize: '0.65rem' }}>
                          <span>{match.match_datetime ? new Date(match.match_datetime).toLocaleDateString() : 'A confirmar'}</span>
                        </div>
                        <div className={styles.matchTeams} style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#334155' }}>
                          <span>{match.local_team_name} vs {match.visitor_team_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Tarjeta Mi Club */}
              {role !== 'ADMIN' && (
                <section className={styles.card}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Mi Club</h3>
                  </div>
                  <div className={styles.techInfoList}>
                    <div className={styles.techItem}>
                      <span className={styles.techLabel}>Institución</span>
                      <span className={styles.techValue} style={{ color: '#002F87', fontWeight: 'bold' }}>
                        {userDetails?.club_name || 'Club no asignado'}
                      </span>
                    </div>
                    <div className={styles.techItem}>
                      <span className={styles.techLabel}>Asociado</span>
                      <span className={styles.techValue}>{userDetails?.name || user?.name || user?.username}</span>
                    </div>
                    <div className={styles.techItem}>
                      <span className={styles.techLabel}>Rol</span>
                      <span className={styles.techValue} style={{ color: '#FF8A00' }}>{ROLE_TRANSLATIONS[userDetails?.role || user?.role] || userDetails?.role || user?.role}</span>
                    </div>
                  </div>
                </section>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
