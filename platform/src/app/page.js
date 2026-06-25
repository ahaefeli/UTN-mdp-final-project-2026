'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();

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
  }, [router, pathname]);

  // Carga de perfil completo de usuario para obtener team_id y club_name
  const loadUserDetails = async (userId) => {
    try {
      const response = await userService.getUserById(userId);
      const details = response.data || null;
      setUserDetails(details);
      if (details) {
        if (details.role === 'ADMIN') {
          loadUpcomingMatches();
        } else if (details.role === 'CLUB_ADMIN') {
          loadUpcomingMatches();
        } else if (details.role === 'COACH') {
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
      // Inyectar explícitamente el parámetro recent
      const params = { recent: 'true' };
      const response = await matchService.getMatches(params);
      
      // Guardar limitando a los 10 más recientes
      const fetchedMatches = response.data || [];
      setMatches(fetchedMatches.slice(0, 10));
    } catch (err) {
      console.error('Error al cargar partidos en Dashboard raíz:', err);
      setError('Error al sincronizar con el backend de partidos.');
    } finally {
      setIsLoading(false);
    }
  };

  // Carga de partidos futuros filtrados por team_id o club_id
  const loadUpcomingMatches = async (teamId, clubId) => {
    setIsLoadingUpcoming(true);
    try {
      const params = { upcoming: 'true' };
      if (teamId) {
        params.team_id = teamId;
      }
      if (clubId) {
        params.club_id = clubId;
      }
      const response = await matchService.getMatches(params);
      setUpcomingMatches(response.data || []);
    } catch (err) {
      console.error('Error al cargar próximas fechas:', err);
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
      <div className={`${styles.container} custom_container`}>
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

  if (role === 'CLUB_ADMIN') {
    const clubActions = [
      {
        label: 'Mis Datos',
        path: '/mis-datos',
        description: 'Actualiza tus datos personales.',
        iconClass: 'bi-person',
        bg: '#eff6ff',
        color: '#1d4ed8'
      },
      {
        label: 'Mi Club',
        path: '/gestion-club',
        description: 'Gestiona los entrenadores y jugadores del club',
        iconClass: 'bi-building',
        bg: '#fff7ed',
        color: '#ea580c'
      },
      {
        label: 'Mis Equipos',
        path: '/mis-equipos',
        description: 'Gestiona categorías, ramas y asigna entrenadores.',
        iconClass: 'bi-shield-fill',
        bg: '#f0fdf4',
        color: '#16a34a'
      },
    ];

    return (
      <div className={`${styles.container} custom_container`}>
        <div className={styles.scrollContent} style={{ width: '100%', padding: '1.5rem 0' }}>
          <div className={styles.dashboardLayout} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Header del Club Admin */}
            <div>
              <h2 className={styles.adminTitle} style={{ marginBottom: '0.25rem' }}>Panel del Club</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Gestión institucional de {userDetails?.club_name || 'tu club asignado'}
              </p>
            </div>

            {/* Grid de Acciones Rápidas */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                Acciones Rápidas
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                {clubActions.map((action, idx) => (
                  <a
                    key={idx}
                    href={action.path}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '1rem',
                      padding: '1.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.25rem',
                      textDecoration: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.03)';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '3rem',
                      height: '3rem',
                      borderRadius: '0.75rem',
                      backgroundColor: action.bg,
                      color: action.color,
                      fontSize: '1.5rem',
                      flexShrink: 0
                    }}>
                      <i className={`bi ${action.iconClass}`}></i>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#1e293b' }}>{action.label}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, lineHeight: 1.3 }}>{action.description}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Próximas Fechas */}
            <section className={styles.card} style={{ maxWidth: '800px' }}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Próximas Fechas</h3>
              </div>
              {isLoadingUpcoming ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <div className={styles.spinner} />
                </div>
              ) : upcomingMatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 2rem', color: '#64748b', fontSize: '0.875rem' }}>
                  No tienes próximos partidos programados.
                </div>
              ) : (
                <div className={styles.matchList} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {upcomingMatches.map((match) => (
                    <div key={match.id} className={styles.matchItem} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }}>
                      
                      {/* Meta Información Detallada */}
                      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                        <span style={{ color: '#002F87' }}>{match.tournament_name || 'Torneo'}</span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span>{match.category ? `Categoría: ${match.category}` : 'Categoría a confirmar'}</span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span>{match.branch === 'MALE' ? 'Masculino' : match.branch === 'FEMALE' ? 'Femenino' : 'Rama a confirmar'}</span>
                      </div>

                      {/* Enfrentamiento */}
                      <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                        <span>{match.local_team_name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}>vs</span>
                        <span>{match.visitor_team_name}</span>
                      </div>

                      {/* Fecha y Hora */}
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <i className="bi bi-calendar-event"></i>
                        <span>{match.match_datetime ? new Date(match.match_datetime).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Fecha y hora a confirmar'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
    );
  }

  if (role === 'COACH') {
    const coachActions = [
      {
        label: 'Resultados y posiciones',
        path: '/resultados',
        description: 'Consultá las tablas de posiciones y los resultados de los torneos.',
        iconClass: 'bi bi-trophy-fill',
        bg: '#f0fdf4',
        color: '#16a34a'
      },
      {
        label: 'Mis Datos y Certificados',
        path: '/mis-datos',
        description: 'Gestioná tu perfil y cargá tu certificado de entrenador habilitante.',
        iconClass: 'bi bi-person-vcard-fill',
        bg: '#eff6ff',
        color: '#2563eb'
      },
      {
        label: 'Mis Equipos',
        path: '/mis-jugadores',
        description: 'Visualizá la lista de jugadores de tus equipos.',
        iconClass: 'bi bi-people-fill',
        bg: '#fff7ed',
        color: '#ea580c'
      }
    ];

    return (
      <div className={`${styles.container} custom_container`}>
        <div className={styles.scrollContent} style={{ width: '100%', padding: '1.5rem 0' }}>
          <div className={styles.dashboardLayout} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Header del Entrenador */}
            <header>
              <h2 className={styles.adminTitle} style={{ margin: 0 }}>Panel de Entrenador</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                ¡Bienvenido/a, {user?.name?.split(' ')[0] || 'Entrenador'}! Accedé rápidamente a tus módulos.
              </p>
            </header>

            {/* BOTONES DE ACCESO RÁPIDO */}
            <div className={styles.quickActionsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem' }}>
              {coachActions.map((action, idx) => (
                <div 
                  key={idx} 
                  onClick={() => router.push(action.path)}
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.borderColor = action.color || '#ea580c';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.03)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '0.75rem',
                    backgroundColor: action.bg || '#fff7ed',
                    color: action.color || '#ea580c',
                    fontSize: '1.5rem',
                    flexShrink: 0
                  }}>
                    <i className={action.iconClass}></i>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{action.label}</h3>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, fontWeight: 500, lineHeight: 1.3 }}>
                      {action.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* SECCIÓN DE PRÓXIMAS FECHAS */}
            <section className={styles.card} style={{ maxWidth: '800px' }}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Próximos Partidos</h3>
              </div>
              {upcomingMatches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 2rem', color: '#64748b', fontSize: '0.875rem' }}>
                  No tenés partidos programados próximamente.
                </div>
              ) : (
                <div className={styles.matchList} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {upcomingMatches.map((match) => (
                    <div key={match.id} className={styles.matchItem} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }}>
                      
                      {/* Meta Información Detallada */}
                      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                        <span style={{ color: '#002F87' }}>{match.tournament_name || 'Torneo'}</span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span>{match.category ? `Categoría: ${match.category}` : 'Categoría a confirmar'}</span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span>{match.branch === 'MALE' ? 'Masculino' : match.branch === 'FEMALE' ? 'Femenino' : 'Rama a confirmar'}</span>
                      </div>

                      {/* Enfrentamiento */}
                      <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                        <span>{match.local_team_name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'normal' }}>vs</span>
                        <span>{match.visitor_team_name}</span>
                      </div>

                      {/* Fecha, Hora y Cancha */}
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <i className="bi bi-calendar-event"></i>
                          <span>{match.match_datetime ? new Date(match.match_datetime).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Fecha y hora a confirmar'}</span>
                        </div>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <i className="bi bi-geo-alt"></i>
                          <span>{match.court_name ? `Cancha: ${match.court_name}` : 'Cancha a confirmar'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} custom_container`}>
      {/* Sección scrolleable de contenidos */}
      <div className={styles.scrollContent} style={{ width: '100%', padding: '1rem 0' }}>
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
                  <div className={styles.matchList} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {matches.slice(0, 10).map((match) => (
                      <div 
                        key={match.id} 
                        style={{ 
                          padding: '1.25rem', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '0.75rem', 
                          backgroundColor: '#fff',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                      >
                        {/* Encabezado */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                          <span style={{ color: '#002F87' }}>{match.tournament_name || 'Torneo'}</span>
                          <span>{match.category ? `${match.category} - ${match.branch === 'MALE' ? 'Masculino' : match.branch === 'FEMALE' ? 'Femenino' : match.branch}` : ''}</span>
                        </div>

                        {/* Cuerpo (Resultado) */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.25rem 0' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', flex: 1 }}>{match.local_team_name}</span>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem 0.75rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '1rem', color: '#0f172a' }}>
                            <span>{match.local_score ?? '-'}</span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>VS</span>
                            <span>{match.visitor_score ?? '-'}</span>
                          </div>

                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', flex: 1, textAlign: 'right' }}>{match.visitor_team_name}</span>
                        </div>

                        {/* Pie */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#94a3b8' }}>
                          <span>Árbitro: {match.referee_name || 'Sin asignar'}</span>
                          <span>{match.match_datetime ? new Date(match.match_datetime).toLocaleDateString('es-AR') : ''}</span>
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
                  <div className={styles.matchList} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {upcomingMatches.map((match) => (
                      <div 
                        key={match.id} 
                        style={{ 
                          padding: '1rem', 
                          border: '1px solid #e2e8f0', 
                          borderLeft: '5px solid #FF8A00',
                          borderRadius: '0.5rem', 
                          backgroundColor: '#fff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem'
                        }}
                      >
                        {/* Encabezado */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                          <span style={{ color: '#002F87' }}>{match.tournament_name || 'Torneo'}</span>
                          <span>{match.matchday_name || 'Fecha por definir'}</span>
                        </div>

                        {/* Subtítulo */}
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                          {match.category ? `${match.category} - ${match.branch === 'MALE' ? 'Masculino' : match.branch === 'FEMALE' ? 'Femenino' : match.branch}` : ''}
                        </div>

                        {/* Enfrentamiento */}
                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b', margin: '0.15rem 0' }}>
                          {match.local_team_name} <span style={{ fontWeight: 'normal', color: '#94a3b8', fontSize: '0.7rem' }}>vs</span> {match.visitor_team_name}
                        </div>

                        {/* Detalles Logísticos */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.65rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '0.35rem', marginTop: '0.15rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <i className="bi bi-calendar-event"></i>
                            <span>{match.match_datetime ? new Date(match.match_datetime).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Fecha a confirmar'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <i className="bi bi-geo-alt"></i>
                            <span>{match.court_name ? `Cancha: ${match.court_name}` : 'Cancha a confirmar'}</span>
                          </div>
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
