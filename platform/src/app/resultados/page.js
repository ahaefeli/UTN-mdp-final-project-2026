'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  PageHeader,
  Button,
  Alert,
  LoadingState,
  EmptyState,
  StatusBadge,
  DataTable,
} from '../../components/ui';
import chromeStyles from '../../components/ui/PageChrome.module.css';
import dirStyles from '../../components/ui/AdminDirectory.module.css';
import styles from './page.module.css';

const adaptMatchesForUI = (apiMatches) => {
  return apiMatches.map((match) => {
    let localSetsWon = 0;
    let visitorSetsWon = 0;
    const localSetPoints = [];
    const visitorSetPoints = [];

    const sets = match.sets || (match.sets_data && match.sets_data.sets) || [];
    const sortedSets = [...sets].sort((a, b) => (a.set_number || 0) - (b.set_number || 0));

    sortedSets.forEach((set) => {
      const lScore = set.local_points !== undefined ? set.local_points : set.local_score || 0;
      const vScore = set.visitor_points !== undefined ? set.visitor_points : set.visitor_score || 0;
      localSetPoints.push(lScore);
      visitorSetPoints.push(vScore);
      if (lScore > vScore) {
        localSetsWon += 1;
      } else if (vScore > lScore) {
        visitorSetsWon += 1;
      }
    });

    return {
      id: match.id,
      category: match.category || match.tournament_stage_name || 'Fase Regular',
      location: match.court_name || match.location || 'Sede a confirmar',
      status: match.status === 'IN_PROGRESS' ? 'live' : match.status?.toLowerCase(),
      statusText:
        match.status === 'IN_PROGRESS'
          ? 'EN VIVO'
          : match.status === 'FINISHED'
            ? 'Finalizado'
            : 'Próximamente',
      team1: {
        name: match.local_team_name,
        logo: match.local_club_logo_url || null,
        initials: (match.local_team_name || 'L').substring(0, 3).toUpperCase(),
        setsWon: localSetsWon,
        setPoints: localSetPoints,
      },
      team2: {
        name: match.visitor_team_name,
        logo: match.visitor_club_logo_url || null,
        initials: (match.visitor_team_name || 'V').substring(0, 3).toUpperCase(),
        setsWon: visitorSetsWon,
        setPoints: visitorSetPoints,
      },
    };
  });
};

const adaptStandingsForUI = (apiStandings) => {
  return apiStandings.map((team, index) => ({
    pos: index + 1,
    name: team.team_name,
    logo: team.club_logo_url,
    initials: (team.team_name || 'T').substring(0, 3).toUpperCase(),
    pts: team.puntos,
    pj: team.pj,
    pg: team.pg,
    pp: team.pp,
  }));
};

const BRANCH_TRANSLATIONS = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
};

const CATEGORY_TRANSLATIONS = {
  PRIMERA: 'Primera División',
  'SUB-18': 'Sub-18',
  'SUB-16': 'Sub-16',
  'SUB-14': 'Sub-14',
  SUB_14: 'Sub-14',
  SUB_16: 'Sub-16',
  SUB_18: 'Sub-18',
  SUB_21: 'Sub-21',
  MAXI: 'Maxi',
};

const STANDINGS_COLUMNS = [
  { key: 'pos', label: 'POS', width: '2.5rem' },
  { key: 'team', label: 'EQUIPO' },
  { key: 'pts', label: 'PTS', width: '2.5rem' },
  { key: 'pj', label: 'PJ', width: '2rem' },
  { key: 'pg', label: 'PG', width: '2rem' },
  { key: 'pp', label: 'PP', width: '2rem' },
];

function TeamAvatar({ logo, initials, variant = 'neutral', small = false }) {
  const sizeClass = small ? styles.avatarSm : '';
  if (logo) {
    return <img src={logo} alt="" className={`${styles.teamLogo} ${sizeClass}`.trim()} />;
  }
  return (
    <span
      className={`${styles.teamInitials} ${styles[`initials${variant}`]} ${sizeClass}`.trim()}
    >
      {initials}
    </span>
  );
}

export default function ResultadosPosicionesPage() {
  const { isAuthenticated, isInitialized } = useAuth();

  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);

  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      const fetchTournaments = async () => {
        try {
          setIsLoadingTournaments(true);
          setError('');
          const token = typeof window !== 'undefined' ? localStorage.getItem('lnv_token') : '';
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

          const response = await fetch(`${baseUrl}/internal/torneos/`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Error al obtener torneos');
          }

          const json = await response.json();
          const list = json.data || [];
          setTournaments(list);

          if (list.length > 0) {
            setSelectedTournamentId(list[0].id);
          }
        } catch (err) {
          console.error(err);
          setError('Ocurrió un error al cargar la lista de torneos.');
        } finally {
          setIsLoadingTournaments(false);
        }
      };

      fetchTournaments();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && selectedTournamentId) {
      const fetchTournamentData = async () => {
        try {
          setIsLoadingData(true);
          setError('');
          const token = typeof window !== 'undefined' ? localStorage.getItem('lnv_token') : '';
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

          const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          };

          const [matchesRes, standingsRes] = await Promise.all([
            fetch(
              `${baseUrl}/internal/torneos/partidos/?tournament_id=${selectedTournamentId}`,
              { headers }
            ),
            fetch(`${baseUrl}/internal/torneos/${selectedTournamentId}/posiciones/`, { headers }),
          ]);

          if (!matchesRes.ok || !standingsRes.ok) {
            throw new Error('Error al obtener resultados o posiciones.');
          }

          const rawMatchesData = await matchesRes.json();
          const rawStandingsData = await standingsRes.json();

          setMatches(adaptMatchesForUI(rawMatchesData.data || []));
          setStandings(
            adaptStandingsForUI(
              Array.isArray(rawStandingsData)
                ? rawStandingsData
                : rawStandingsData.data || []
            )
          );
        } catch (err) {
          console.error(err);
          setError('Error al obtener los partidos o la tabla de posiciones del torneo.');
        } finally {
          setIsLoadingData(false);
        }
      };

      fetchTournamentData();
    }
  }, [isAuthenticated, selectedTournamentId]);

  if (!isInitialized || !isAuthenticated) {
    return <LoadingState full />;
  }

  return (
    <div className="appShell">
      <div className={chromeStyles.page}>
        <PageHeader
          title="Resultados y Posiciones"
          subtitle="Consulte el fixture y la clasificación de los torneos de su organización."
          actions={
            !isLoadingTournaments && tournaments.length > 0 ? (
              <div className={styles.tournamentSelect}>
                <label className={dirStyles.label} htmlFor="tournament-select">
                  Torneo
                </label>
                <select
                  id="tournament-select"
                  value={selectedTournamentId}
                  onChange={(e) => setSelectedTournamentId(e.target.value)}
                  className={dirStyles.select}
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} - Categoría:{' '}
                      {CATEGORY_TRANSLATIONS[t.category] || t.category} - Rama:{' '}
                      {BRANCH_TRANSLATIONS[t.branch] || t.branch}
                    </option>
                  ))}
                </select>
              </div>
            ) : null
          }
        />

        {error && (
          <Alert variant="error">
            <div className={styles.alertContent}>
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError('')} aria-label="Cerrar alerta">
                ×
              </Button>
            </div>
          </Alert>
        )}

        {isLoadingData ? (
          <LoadingState label="Cargando información del torneo..." />
        ) : (
          <div className={styles.layout}>
            <section className={styles.matchesColumn}>
              <h2 className={chromeStyles.sectionTitle}>Últimos Partidos</h2>

              {matches.length > 0 ? (
                <div className={styles.matchList}>
                  {matches.map((match) => {
                    const isLive = match.status === 'live';
                    const setsTeam1 = match.team1.setPoints;
                    const setsTeam2 = match.team2.setPoints;

                    let liveSetSummary = null;
                    if (isLive && setsTeam1.length > 0) {
                      const lastIndex = setsTeam1.length - 1;
                      liveSetSummary = `${setsTeam1[lastIndex] || 0} - ${setsTeam2[lastIndex] || 0}`;
                    }

                    return (
                      <article key={match.id} className={styles.matchCard}>
                        <div className={styles.matchCardHeader}>
                          {isLive ? (
                            <StatusBadge variant="accent" label="EN VIVO">
                              EN VIVO
                            </StatusBadge>
                          ) : (
                            <StatusBadge variant="neutral" label={match.statusText}>
                              {match.statusText}
                            </StatusBadge>
                          )}
                          <div className={styles.matchCardMeta}>
                            <span className={styles.matchCategory}>
                              {match.category || 'Primera División'}
                            </span>
                            <span className={styles.matchLocation}>
                              {match.location || 'Sede oficial'}
                            </span>
                          </div>
                        </div>

                        <div className={styles.teamsBlock}>
                          <div className={styles.teamRow}>
                            <div className={styles.teamInfo}>
                              <TeamAvatar
                                logo={match.team1.logo}
                                initials={match.team1.initials}
                                variant="neutral"
                              />
                              <span className={styles.teamName}>{match.team1.name}</span>
                            </div>
                            <div className={styles.teamScoreBlock}>
                              <div className={styles.setPoints}>
                                {setsTeam1.map((pts, idx) => {
                                  const isLast = idx === setsTeam1.length - 1;
                                  return (
                                    <span
                                      key={idx}
                                      className={
                                        isLive && isLast
                                          ? styles.setPointActive
                                          : styles.setPoint
                                      }
                                    >
                                      {pts}
                                    </span>
                                  );
                                })}
                              </div>
                              <span className={styles.setsWon}>{match.team1.setsWon}</span>
                            </div>
                          </div>

                          <div className={styles.teamRow}>
                            <div className={styles.teamInfo}>
                              <TeamAvatar
                                logo={match.team2.logo}
                                initials={match.team2.initials}
                                variant="primary"
                              />
                              <span className={styles.teamName}>{match.team2.name}</span>
                            </div>
                            <div className={styles.teamScoreBlock}>
                              <div className={styles.setPoints}>
                                {setsTeam2.map((pts, idx) => {
                                  const isLast = idx === setsTeam2.length - 1;
                                  return (
                                    <span
                                      key={idx}
                                      className={
                                        isLive && isLast
                                          ? styles.setPointActive
                                          : styles.setPoint
                                      }
                                    >
                                      {pts}
                                    </span>
                                  );
                                })}
                              </div>
                              <span className={styles.setsWon}>{match.team2.setsWon}</span>
                            </div>
                          </div>
                        </div>

                        {isLive && liveSetSummary && (
                          <div className={styles.liveFooter}>
                            <span className={styles.liveLabel}>Set actual</span>
                            <span className={styles.liveScore}>{liveSetSummary}</span>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="No hay partidos registrados en este torneo." />
              )}
            </section>

            <aside className={styles.standingsColumn}>
              <div className={chromeStyles.card}>
                <h2 className={chromeStyles.sectionTitle}>Tabla de Posiciones</h2>

                {standings.length > 0 ? (
                  <DataTable columns={STANDINGS_COLUMNS}>
                    {standings.map((team) => (
                      <tr key={team.pos}>
                        <td className={styles.posCell}>{team.pos}</td>
                        <td>
                          <div className={styles.standingsTeam}>
                            <TeamAvatar
                              logo={team.logo}
                              initials={team.initials}
                              variant="neutral"
                              small
                            />
                            <span className={styles.standingsTeamName}>{team.name}</span>
                          </div>
                        </td>
                        <td className={styles.statCell}>{team.pts ?? 0}</td>
                        <td className={styles.statMuted}>{team.pj ?? 0}</td>
                        <td className={styles.statMuted}>{team.pg ?? 0}</td>
                        <td className={styles.statMuted}>{team.pp ?? 0}</td>
                      </tr>
                    ))}
                  </DataTable>
                ) : (
                  <EmptyState title="No hay posiciones registradas." />
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
