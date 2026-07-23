'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import authService from '../services/authService';
import matchService from '../services/matchService';
import userService from '../services/userService';
import apiClient from '../services/apiClient';
import { ROLE_TRANSLATIONS } from '../utils/roles';
import { STATUS_TRANSLATIONS } from '../utils/status';

import InfoCard from '../components/InfoCard/InfoCard';
import QuickActions from '../components/QuickActions/QuickActions';
import PendingAlerts from '../components/PendingAlerts/PendingAlerts';
import ScoreSheetModal from '../components/ScoreSheet/ScoreSheetModal';
import {
  PageHeader,
  Button,
  Alert,
  LoadingState,
  EmptyState,
  MatchRow,
} from '../components/ui';

import { Shield, Users, Trophy, CalendarCheck } from 'lucide-react';

function joinMeta(...parts) {
  return parts.filter(Boolean).join(' · ');
}

function formatBranch(branch) {
  if (branch === 'MALE') return 'Masculino';
  if (branch === 'FEMALE') return 'Femenino';
  return branch ? branch : 'Rama a confirmar';
}

function formatCategoryMeta(match) {
  const category = match.category ? `Categoría: ${match.category}` : 'Categoría a confirmar';
  return joinMeta(category, formatBranch(match.branch));
}

function formatMatchDateTime(matchDatetime, fallback = 'Fecha y hora a confirmar') {
  if (!matchDatetime) return fallback;
  return new Date(matchDatetime).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatMatchDate(matchDatetime) {
  if (!matchDatetime) return '';
  return new Date(matchDatetime).toLocaleDateString('es-AR');
}

function formatCategoryBranchShort(match) {
  if (!match.category) return '';
  return `${match.category} - ${formatBranch(match.branch)}`;
}

function formatCourtLabel(match, prefix = 'Cancha: ') {
  return match.court_name ? `${prefix}${match.court_name}` : 'Cancha a confirmar';
}

function formatMatchScore(match) {
  return `${match.local_score ?? '-'} – ${match.visitor_score ?? '-'}`;
}

function matchStatusLabel(status) {
  return status ? STATUS_TRANSLATIONS[status] || status : '';
}

export default function RootDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const role = user?.role;
  const [userDetails, setUserDetails] = useState(null);
  const [matches, setMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(false);
  const [error, setError] = useState('');

  const [metrics, setMetrics] = useState(null);
  const [pendingActions, setPendingActions] = useState([]);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [scoreSheetMatch, setScoreSheetMatch] = useState(null);
  const [matchesNeedingScore, setMatchesNeedingScore] = useState([]);
  const [isLoadingNeedsScore, setIsLoadingNeedsScore] = useState(false);

  const loadAdminDashboard = async () => {
    setIsLoadingAdmin(true);
    setError('');
    try {
      const response = await apiClient.get('internal/dashboard/admin/');
      const data = response.data || {};

      setMetrics({
        total_clubs: data.total_clubs || 0,
        federated_players: data.federated_players || { total: 0, masculino: 0, femenino: 0 },
        active_tournaments: data.active_tournaments || 0,
        matches_without_referee: data.matches_without_referee || 0,
        pending_counts: data.pending_counts || { clubs: 0, referees: 0, scorers: 0 }
      });

      setPendingActions(data.pending_actions || []);
    } catch (err) {
      console.error('Error al cargar datos del dashboard de administrador:', err);
      setError('Error al sincronizar con el backend de administración.');
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    } else {
      const currentUser = authService.getCurrentUser();
      setIsAuthenticated(true);
      setUser(currentUser);
      if (currentUser && currentUser.role === 'ADMIN') {
        loadAdminDashboard();
        loadMatchesNeedingScore();
      } else {
        loadMatches();
        if (currentUser && currentUser.id) {
          loadUserDetails(currentUser.id);
        }
      }
    }
  }, [router, pathname]);

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
        } else if (details.role === 'REFEREE' || details.role === 'SCORER') {
          loadOperationalMatches();
        } else if (details.team_id) {
          loadUpcomingMatches(details.team_id);
        }
      }
    } catch (err) {
      console.error('Error al cargar perfil completo de usuario:', err);
    }
  };

  const loadMatches = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = { recent: 'true' };
      const response = await matchService.getMatches(params);

      const fetchedMatches = response.data || [];
      setMatches(fetchedMatches.slice(0, 10));
    } catch (err) {
      console.error('Error al cargar partidos en Dashboard raíz:', err);
      setError('Error al sincronizar con el backend de partidos.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const loadOperationalMatches = async () => {
    setIsLoadingUpcoming(true);
    try {
      const [prepRes, liveRes] = await Promise.all([
        matchService.getMatches({ status: 'PREPARATION' }),
        matchService.getMatches({ status: 'IN_PROGRESS' }),
      ]);
      const combined = [...(liveRes.data || []), ...(prepRes.data || [])];
      const seen = new Set();
      const unique = combined.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      setUpcomingMatches(unique);
    } catch (err) {
      console.error('Error al cargar partidos operativos:', err);
    } finally {
      setIsLoadingUpcoming(false);
    }
  };

  const loadMatchesNeedingScore = async () => {
    setIsLoadingNeedsScore(true);
    try {
      const response = await matchService.getMatches({ status: 'IN_PROGRESS' });
      const list = (response.data || []).filter((m) => !m.score_summary);
      setMatchesNeedingScore(list.slice(0, 10));
    } catch (err) {
      console.error('Error al cargar partidos sin resultado:', err);
    } finally {
      setIsLoadingNeedsScore(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const handleScoreSheetSuccess = async () => {
    setScoreSheetMatch(null);
    if (role === 'ADMIN') {
      await loadMatchesNeedingScore();
      await loadAdminDashboard();
    } else if (role === 'REFEREE' || role === 'SCORER') {
      await loadOperationalMatches();
    }
  };

  const renderScoreAction = (match) => (
    <Button variant="accent" size="sm" onClick={() => setScoreSheetMatch(match)}>
      Cargar resultado
    </Button>
  );

  if (!isAuthenticated) {
    return (
      <div className={styles.authGate}>
        <LoadingState label="Verificando sesión…" full />
      </div>
    );
  }

  if (role === 'ADMIN') {
    return (
      <div className="appShell">
        <div className={styles.page}>
          <PageHeader title="Panel de Control" />

          {isLoadingAdmin ? (
            <LoadingState label="Cargando panel…" />
          ) : (
            <>
              {error ? <Alert variant="error">{error}</Alert> : null}

              <div className={styles.metricsGrid}>
                <InfoCard
                  title="Total Clubes"
                  value={metrics?.total_clubs ?? 0}
                  icon={Shield}
                />
                <InfoCard
                  title="Jugadores Registrados"
                  value={metrics?.federated_players?.total ?? 0}
                  subValue={metrics?.federated_players ? (
                    <span className={styles.genderBreakdown}>
                      <span className={styles.genderMale}>
                        <i className="bi bi-gender-male" /> Masc: {metrics.federated_players.masculino}
                      </span>
                      <span className={styles.genderFemale}>
                        <i className="bi bi-gender-female" /> Fem: {metrics.federated_players.femenino}
                      </span>
                    </span>
                  ) : ''}
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

              <QuickActions />

              <PendingAlerts
                alerts={[
                  ...pendingActions.filter((a) => a.type === 'NEW_AFFILIATION' || a.club_name || a.message),
                  ...matchesNeedingScore.map((m) => ({
                    id: `match-${m.id}`,
                    type: 'MATCH_NEEDS_SCORE',
                    message: `Sin resultado: ${m.local_team_name} vs ${m.visitor_team_name}`,
                    match: m,
                    href: m.tournament_stage_id ? `/torneos` : '/torneos',
                  })),
                ]}
                onMatchAction={(match) => setScoreSheetMatch(match)}
              />

              {!isLoadingNeedsScore && matchesNeedingScore.length > 0 ? (
                <section className={`${styles.section} ${styles.narrow}`}>
                  <h3 className={styles.sectionTitle}>Partidos sin resultado</h3>
                  <div className={styles.matchStack}>
                    {matchesNeedingScore.map((match) => (
                      <MatchRow
                        key={match.id}
                        date={match.match_datetime}
                        homeTeam={match.local_team_name}
                        awayTeam={match.visitor_team_name}
                        venue={joinMeta(
                          match.tournament_name || 'Torneo',
                          match.matchday_name || 'Fecha'
                        )}
                        status={match.status}
                        statusLabel={matchStatusLabel(match.status)}
                        actions={renderScoreAction(match)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              <div className={styles.alertStack}>
                {metrics?.pending_counts?.clubs > 0 ? (
                  <Link href="/clubes" className={styles.alertLink}>
                    <Alert variant="info">
                      <i className="bi bi-shield-fill-exclamation" aria-hidden="true" />
                      <span>
                        Tienes <strong>{metrics.pending_counts.clubs}</strong> solicitud(es) de Clubes pendientes.
                      </span>
                    </Alert>
                  </Link>
                ) : null}

                {metrics?.pending_counts?.referees > 0 ? (
                  <Link href="/arbitros" className={styles.alertLink}>
                    <Alert variant="success">
                      <i className="bi bi-person-badge-fill" aria-hidden="true" />
                      <span>
                        Tienes <strong>{metrics.pending_counts.referees}</strong> solicitud(es) de Árbitros pendientes.
                      </span>
                    </Alert>
                  </Link>
                ) : null}

                {metrics?.pending_counts?.scorers > 0 ? (
                  <Link href="/planilleros" className={styles.alertLink}>
                    <Alert variant="warning">
                      <i className="bi bi-clipboard-data-fill" aria-hidden="true" />
                      <span>
                        Tienes <strong>{metrics.pending_counts.scorers}</strong> solicitud(es) de Planilleros pendientes.
                      </span>
                    </Alert>
                  </Link>
                ) : null}
              </div>

              {scoreSheetMatch ? (
                <ScoreSheetModal
                  match={scoreSheetMatch}
                  onClose={() => setScoreSheetMatch(null)}
                  onSuccess={handleScoreSheetSuccess}
                />
              ) : null}
            </>
          )}
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
        iconTone: styles.iconBlue,
      },
      {
        label: 'Mi Club',
        path: '/gestion-club',
        description: 'Gestiona los entrenadores y jugadores del club',
        iconClass: 'bi-building',
        iconTone: styles.iconOrange,
      },
      {
        label: 'Mis Equipos',
        path: '/mis-equipos',
        description: 'Gestiona categorías, ramas y asigna entrenadores.',
        iconClass: 'bi-shield-fill',
        iconTone: styles.iconGreen,
      },
    ];

    return (
      <div className="appShell">
        <div className={styles.page}>
          <PageHeader
            title="Panel del Club"
            subtitle={`Gestión institucional de ${userDetails?.club_name || 'tu club asignado'}`}
          />

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Acciones Rápidas</h3>
            <div className={styles.actionGrid}>
              {clubActions.map((action, idx) => (
                <a key={idx} href={action.path} className={styles.actionCard}>
                  <div className={`${styles.actionCardIcon} ${action.iconTone}`}>
                    <i className={`bi ${action.iconClass}`} />
                  </div>
                  <div className={styles.actionCardBody}>
                    <span className={styles.actionCardLabel}>{action.label}</span>
                    <span className={styles.actionCardDesc}>{action.description}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>

          <section className={`${styles.section} ${styles.narrow}`}>
            <h3 className={styles.sectionTitle}>Próximas Fechas</h3>
            {isLoadingUpcoming ? (
              <LoadingState label="Cargando partidos…" />
            ) : upcomingMatches.length === 0 ? (
              <EmptyState
                icon="bi-calendar-x"
                title="Sin partidos programados"
                description="No tienes próximos partidos programados."
              />
            ) : (
              <div className={styles.matchStack}>
                {upcomingMatches.map((match) => (
                  <MatchRow
                    key={match.id}
                    date={match.match_datetime}
                    homeTeam={match.local_team_name}
                    awayTeam={match.visitor_team_name}
                    venue={joinMeta(
                      match.tournament_name || 'Torneo',
                      formatCategoryMeta(match),
                      formatMatchDateTime(match.match_datetime)
                    )}
                  />
                ))}
              </div>
            )}
          </section>
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
        iconTone: styles.iconGreen,
      },
      {
        label: 'Mis Datos y Certificados',
        path: '/mis-datos',
        description: 'Gestioná tu perfil y cargá tu certificado de entrenador habilitante.',
        iconClass: 'bi bi-person-vcard-fill',
        iconTone: styles.iconBlue,
      },
      {
        label: 'Mis Equipos',
        path: '/mis-jugadores',
        description: 'Visualizá la lista de jugadores de tus equipos.',
        iconClass: 'bi bi-people-fill',
        iconTone: styles.iconOrange,
      }
    ];

    return (
      <div className="appShell">
        <div className={styles.page}>
          <PageHeader
            title="Panel de Entrenador"
            subtitle={`¡Bienvenido/a, ${user?.name?.split(' ')[0] || 'Entrenador'}! Accedé rápidamente a tus módulos.`}
          />

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Acciones Rápidas</h3>
            <div className={styles.actionGrid}>
              {coachActions.map((action, idx) => (
                <div
                  key={idx}
                  className={styles.actionCard}
                  onClick={() => router.push(action.path)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(action.path);
                    }
                  }}
                >
                  <div className={`${styles.actionCardIcon} ${action.iconTone}`}>
                    <i className={action.iconClass} />
                  </div>
                  <div className={styles.actionCardBody}>
                    <h3 className={styles.actionCardLabel}>{action.label}</h3>
                    <p className={styles.actionCardDesc}>{action.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`${styles.section} ${styles.narrow}`}>
            <h3 className={styles.sectionTitle}>Próximos Partidos</h3>
            {upcomingMatches.length === 0 ? (
              <EmptyState
                icon="bi-calendar-x"
                title="Sin partidos próximos"
                description="No tenés partidos programados próximamente."
              />
            ) : (
              <div className={styles.matchStack}>
                {upcomingMatches.map((match) => (
                  <MatchRow
                    key={match.id}
                    date={match.match_datetime}
                    homeTeam={match.local_team_name}
                    awayTeam={match.visitor_team_name}
                    venue={joinMeta(
                      match.tournament_name || 'Torneo',
                      formatCategoryMeta(match),
                      formatMatchDateTime(match.match_datetime),
                      formatCourtLabel(match)
                    )}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  if (role === 'REFEREE' || role === 'SCORER') {
    return (
      <div className="appShell">
        <div className={`${styles.page} ${styles.narrow}`}>
          <PageHeader
            title={role === 'REFEREE' ? 'Panel Arbitral' : 'Panel de Planillero'}
            subtitle="Bienvenido. Aquí encontrarás tus designaciones oficiales."
          />

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {role === 'REFEREE' ? 'Mis Partidos a Dirigir' : 'Mis Partidos a Planillar'}
            </h3>

            {isLoadingUpcoming ? (
              <LoadingState label="Cargando designaciones…" />
            ) : upcomingMatches.length === 0 ? (
              <EmptyState
                icon="bi-calendar-check"
                title="Sin partidos asignados"
                description="No tienes partidos asignados pendientes de resultado."
              />
            ) : (
              <div className={styles.matchStack}>
                {upcomingMatches.map((match) => (
                  <MatchRow
                    key={match.id}
                    date={match.match_datetime}
                    homeTeam={match.local_team_name}
                    awayTeam={match.visitor_team_name}
                    venue={joinMeta(
                      match.tournament_name || 'Torneo Oficial',
                      match.matchday_name || 'Fecha Oficial',
                      formatCategoryBranchShort(match),
                      formatMatchDateTime(match.match_datetime, 'A confirmar'),
                      match.court_name ? `Cancha: ${match.court_name}` : 'A confirmar'
                    )}
                    status={match.status}
                    statusLabel={matchStatusLabel(match.status)}
                    actions={
                      match.status === 'IN_PROGRESS' || match.status === 'PREPARATION'
                        ? renderScoreAction(match)
                        : null
                    }
                  />
                ))}
              </div>
            )}
          </section>

          {scoreSheetMatch ? (
            <ScoreSheetModal
              match={scoreSheetMatch}
              onClose={() => setScoreSheetMatch(null)}
              onSuccess={handleScoreSheetSuccess}
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="appShell">
      <div className={styles.page}>
        <div className={styles.grid}>
          <div className={styles.section}>
            <section className={styles.card}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Partidos Recientes</h3>
                <Button variant="ghost" size="sm" onClick={loadMatches} disabled={isLoading}>
                  {isLoading ? 'Sincronizando...' : 'Sincronizar'}
                </Button>
              </div>

              {isLoading ? <LoadingState label="Sincronizando partidos…" /> : null}

              {error ? <Alert variant="error">{error}</Alert> : null}

              {!isLoading && !error && matches.length === 0 ? (
                <EmptyState
                  icon="bi-trophy"
                  title="Sin partidos"
                  description="No hay partidos programados disponibles en el sistema."
                />
              ) : null}

              {!isLoading && !error && matches.length > 0 ? (
                <div className={styles.matchStack}>
                  {matches.slice(0, 10).map((match) => (
                    <MatchRow
                      key={match.id}
                      date={match.match_datetime}
                      homeTeam={match.local_team_name}
                      awayTeam={match.visitor_team_name}
                      venue={joinMeta(
                        match.tournament_name || 'Torneo',
                        formatCategoryBranchShort(match),
                        `Árbitro: ${match.referee_name || 'Sin asignar'}`,
                        formatMatchDate(match.match_datetime)
                      )}
                      score={formatMatchScore(match)}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          </div>

          <aside className={styles.sidebar}>
            <section className={styles.card}>
              <h3 className={styles.sectionTitle}>Próximas Fechas</h3>
              {isLoadingUpcoming ? (
                <LoadingState label="Cargando fechas…" />
              ) : upcomingMatches.length === 0 ? (
                <EmptyState
                  icon="bi-calendar-event"
                  title="Sin fechas próximas"
                  description="No hay partidos programados próximamente."
                />
              ) : (
                <div className={styles.matchStack}>
                  {upcomingMatches.map((match) => (
                    <MatchRow
                      key={match.id}
                      date={match.match_datetime}
                      homeTeam={match.local_team_name}
                      awayTeam={match.visitor_team_name}
                      venue={joinMeta(
                        match.tournament_name || 'Torneo',
                        match.matchday_name || 'Fecha por definir',
                        formatCategoryBranchShort(match),
                        formatMatchDateTime(match.match_datetime, 'Fecha a confirmar'),
                        formatCourtLabel(match)
                      )}
                    />
                  ))}
                </div>
              )}
            </section>

            {role !== 'ADMIN' ? (
              <section className={styles.card}>
                <h3 className={styles.sectionTitle}>Mi Club</h3>
                <div className={styles.techList}>
                  <div className={styles.techItem}>
                    <span className={styles.techLabel}>Institución</span>
                    <span className={`${styles.techValue} ${styles.techValuePrimary}`}>
                      {userDetails?.club_name || 'Club no asignado'}
                    </span>
                  </div>
                  <div className={styles.techItem}>
                    <span className={styles.techLabel}>Asociado</span>
                    <span className={styles.techValue}>
                      {userDetails?.name || user?.name || user?.username}
                    </span>
                  </div>
                  <div className={styles.techItem}>
                    <span className={styles.techLabel}>Rol</span>
                    <span className={`${styles.techValue} ${styles.techValueAccent}`}>
                      {ROLE_TRANSLATIONS[userDetails?.role || user?.role] || userDetails?.role || user?.role}
                    </span>
                  </div>
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
