'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import tournamentService from '../../../services/tournamentService';
import enrollmentService from '../../../services/enrollmentService';
import courtService from '../../../services/courtService';
import userService from '../../../services/userService';
import matchService from '../../../services/matchService';
import { ROLE_TRANSLATIONS } from '../../../utils/roles';
import { STATUS_TRANSLATIONS } from '../../../utils/status';
import styles from './page.module.css';

export default function TorneoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id;
  const { user, role, isAuthenticated, isInitialized } = useAuth();

  // Estados de datos
  const [tournament, setTournament] = useState(null);
  const [stages, setStages] = useState([]);
  const [enrolledTeams, setEnrolledTeams] = useState([]);
  const [courts, setCourts] = useState([]);
  const [referees, setReferees] = useState([]);
  const [scorers, setScorers] = useState([]);
  const [matches, setMatches] = useState([]);

  // Estados de selección de etapa activa
  const [activeStageId, setActiveStageId] = useState('');
  // Estados del Formulario de Nuevo Partido
  const [localTeamId, setLocalTeamId] = useState('');
  const [visitorTeamId, setVisitorTeamId] = useState('');
  const [courtId, setCourtId] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [refereeId, setRefereeId] = useState('');
  const [scorerId, setScorerId] = useState('');
  const [matchStatus, setMatchStatus] = useState('');

  // Estado para modo edición de partido
  const [editingMatchId, setEditingMatchId] = useState(null);

  // Estados auxiliares
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Formateador de Fecha Dinámico
  const formatMatchDate = (dateString) => {
    if (!dateString) return 'Fecha a confirmar';
    const date = new Date(dateString);
    
    // Obtener nombre del día en español (ej. "Vie.")
    const weekdayShort = date.toLocaleDateString('es-ES', { weekday: 'short' });
    const weekdayCapitalized = weekdayShort.charAt(0).toUpperCase() + weekdayShort.slice(1);
    
    // Día del mes
    const day = date.getDate();
    
    // Mes corto en español
    const monthShort = date.toLocaleDateString('es-ES', { month: 'short' });
    const monthCapitalized = monthShort.charAt(0).toUpperCase() + monthShort.slice(1);
    
    // Hora y minutos
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    // Limpiar puntos al final si los hay
    const cleanMonth = monthCapitalized.replace(/\.$/, '');
    const cleanWeekday = weekdayCapitalized.replace(/\.$/, '');

    const currentYear = new Date().getFullYear();
    if (date.getFullYear() === currentYear) {
      return `${cleanWeekday}. ${day} de ${cleanMonth}, ${timeStr}`;
    } else {
      return `${cleanWeekday}. ${day} de ${cleanMonth} ${date.getFullYear()}, ${timeStr}`;
    }
  };

  // Redirección si no es ADMIN
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [isInitialized, isAuthenticated, role, router]);

  // Carga inicial del torneo y catálogos
  useEffect(() => {
    if (isAuthenticated && role === 'ADMIN' && tournamentId) {
      const loadInitialData = async () => {
        setIsLoading(true);
        try {
          const [tRes, stagesRes, enrollsRes, courtsRes, refereesRes, scorersRes] = await Promise.all([
            tournamentService.getTournamentById(tournamentId),
            tournamentService.getStages(tournamentId),
            enrollmentService.getEnrollments(tournamentId),
            courtService.getCourts(),
            userService.getUsers({ role: 'REFEREE' }),
            userService.getUsers({ role: 'SCORER' })
          ]);

          setTournament(tRes.data || null);
          const loadedStages = stagesRes.data || [];
          setStages(loadedStages);
          setEnrolledTeams(enrollsRes.data || []);
          setCourts(courtsRes.data || []);
          setReferees(refereesRes.data || []);
          setScorers(scorersRes.data || []);

          if (loadedStages.length > 0) {
            setActiveStageId(loadedStages[0].id);
          }
        } catch (err) {
          console.error('Error al cargar datos del torneo:', err);
          setError('Error al obtener la información inicial del torneo.');
        } finally {
          setIsLoading(false);
        }
      };
      loadInitialData();
    }
  }, [isAuthenticated, role, tournamentId]);

  // Carga de partidos cuando cambia la etapa activa
  useEffect(() => {
    if (activeStageId) {
      loadMatchesForStage(activeStageId);
    }
  }, [activeStageId]);

  const loadMatchesForStage = async (stageId) => {
    setIsLoadingMatches(true);
    try {
      const response = await matchService.getMatches({ date_id: stageId });
      setMatches(response.data || []);
    } catch (err) {
      console.error('Error al cargar partidos de la fecha:', err);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleAddStage = async () => {
    const inputDate = prompt('Ingrese la fecha de la jornada (formato YYYY-MM-DD):');
    if (!inputDate) return;

    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(inputDate)) {
      alert('Formato de fecha inválido. Debe usar YYYY-MM-DD.');
      return;
    }

    try {
      const nextNum = stages.length + 1;
      const res = await tournamentService.addStage({
        tournament_id: tournamentId,
        date: inputDate,
        name: `Fecha ${nextNum}`
      });

      // Recargar las fechas del torneo
      const stagesRes = await tournamentService.getStages(tournamentId);
      const loadedStages = stagesRes.data || [];
      setStages(loadedStages);

      if (res && res.data && res.data.id) {
        setActiveStageId(res.data.id);
      }
      setSuccessMsg(`¡Fecha ${nextNum} agregada con éxito!`);
    } catch (err) {
      console.error('Error al agregar fecha:', err);
      setError(err?.response?.data?.error || 'No se pudo agregar la fecha.');
    }
  };

  const handleCancelEdit = () => {
    setEditingMatchId(null);
    setLocalTeamId('');
    setVisitorTeamId('');
    setCourtId('');
    setMatchTime('');
    setRefereeId('');
    setScorerId('');
    setMatchStatus('');
    setError('');
    setSuccessMsg('');
  };

  const handleEditMatch = (match) => {
    setError('');
    setSuccessMsg('');
    setEditingMatchId(match.id);
    setLocalTeamId(match.local_team_id);
    setVisitorTeamId(match.visitor_team_id);
    setCourtId(match.court_id.toString());
    
    // Extraer hora local
    if (match.match_datetime) {
      const d = new Date(match.match_datetime);
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      setMatchTime(`${hours}:${minutes}`);
    } else {
      setMatchTime('');
    }
    
    setRefereeId(match.referee_id);
    setScorerId(match.scorer_id);
    setMatchStatus(match.status || 'PREPARATION');
  };

  const handleDeleteMatch = async (matchId) => {
    if (!confirm('¿Está seguro de que desea eliminar este partido?')) return;
    try {
      await matchService.deleteMatch(matchId);
      setSuccessMsg('¡Partido eliminado exitosamente!');
      
      if (editingMatchId === matchId) {
        handleCancelEdit();
      }
      
      // Recargar partidos
      await loadMatchesForStage(activeStageId);
    } catch (err) {
      console.error('Error al eliminar el partido:', err);
      setError(err?.response?.data?.error || 'No se pudo eliminar el partido.');
    }
  };

  const handleUpdateMatchStatus = async (matchId, newStatus) => {
    try {
      const response = await matchService.updateMatch(matchId, { status: newStatus });
      // Actualizar el estado local de partidos reemplazando el objeto modificado
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: newStatus } : m));
    } catch (error) {
      console.error("Error al actualizar el estado del partido:", error);
      // Si el backend responde con error de colisión de cancha (400), mostrar alerta
      alert(error.response?.data?.error || "No se pudo cambiar el estado del partido.");
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!localTeamId || !visitorTeamId || !courtId || !matchTime) {
      setError('Por favor, completa todos los campos del partido.');
      return;
    }

    if (localTeamId === visitorTeamId) {
      setError('El equipo local y el visitante no pueden ser el mismo.');
      return;
    }

    const selectedStage = stages.find(s => s.id === activeStageId);
    if (!selectedStage) {
      setError('Seleccione una fecha válida para programar el partido.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        tournament_stage_id: activeStageId,
        local_team_id: localTeamId,
        visitor_team_id: visitorTeamId,
        court_id: parseInt(courtId),
        match_datetime: new Date(`${selectedStage.date}T${matchTime}`).toISOString(),
        referee_id: refereeId || null,
        scorer_id: scorerId || null
      };

      if (editingMatchId) {
        payload.status = matchStatus;
        const res = await matchService.updateMatch(editingMatchId, payload);
        const updatedMatch = res.data;
        if (updatedMatch) {
          setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
        }
        setSuccessMsg('¡Partido actualizado exitosamente!');
        setEditingMatchId(null);
      } else {
        await matchService.createMatch(payload);
        setSuccessMsg('¡Partido creado exitosamente!');
      }

      // Limpiar formulario
      setLocalTeamId('');
      setVisitorTeamId('');
      setCourtId('');
      setMatchTime('');
      setRefereeId('');
      setScorerId('');
      setMatchStatus('');

      // Recargar partidos
      await loadMatchesForStage(activeStageId);
    } catch (err) {
      console.error('Error al guardar el partido:', err);
      if (err.response && err.response.status === 400) {
        // Capturar error HTTP 400 por regla de 1 hora de diferencia
        setError(err.response.data?.error || 'El backend rechazó la petición por conflicto de horarios.');
      } else {
        setError('Error de comunicación con el servidor al registrar el partido.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const editingMatch = matches.find(m => m.id === editingMatchId);

  if (!isInitialized || !isAuthenticated || role !== 'ADMIN' || isLoading) {
    return (
      <div className={styles.spinnerWrapper}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={`${styles.container} container`}>
      <div className={styles.wrapper}>
        
        {/* Cabecera */}
        <header className={styles.header}>
          <div className={styles.backLinkWrapper}>
            <button onClick={() => router.push('/torneos')} className={styles.btnBack}>
              ← Volver a Torneos
            </button>
          </div>
          <h1 className={styles.title}>{tournament?.name}</h1>
          <p className={styles.subtitle}>
            Fase de Planificación: Gestioná las fechas y programá los partidos en las canchas de juego.
          </p>
        </header>

        {/* Selector de Etapa (Fecha) */}
        <section className={styles.tabsSection}>
          <h2 className={styles.sectionTitle}>Fechas del Torneo</h2>
          <div className={styles.tabsWrapper}>
            {stages.map((stage) => {
              const isActive = activeStageId === stage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => {
                    setActiveStageId(stage.id);
                    setError('');
                    setSuccessMsg('');
                  }}
                  className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
                >
                  {stage.name}
                  <span className={styles.tabDate}>
                    ({new Date(stage.date).toLocaleDateString()})
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleAddStage}
              className={styles.btnAddStage}
            >
              <i className="bi bi-plus-lg" style={{ marginRight: '0.25rem' }}></i>
              Agregar Fecha
            </button>
          </div>
        </section>

        {/* Grid de Contenidos */}
        <div className={styles.grid}>
          
          {/* Columna Izquierda: Formulario de Creación */}
          <div className={styles.leftColumn}>
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Programar Nuevo Partido</h3>
                <p className={styles.cardSubtitle}>Asigná equipos, cancha, horarios y oficiales.</p>
              </div>

              {error && <div className={styles.errorBox}>{error}</div>}
              {successMsg && <div className={styles.successBox}>{successMsg}</div>}

              <form onSubmit={handleCreateMatch} className={styles.matchForm}>
                
                {/* Selectores de Equipos (Exclusión Mutua + Layout VS.) */}
                <div className={styles.vsContainer}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Equipo Local</label>
                    <select
                      value={localTeamId}
                      onChange={(e) => setLocalTeamId(e.target.value)}
                      className={styles.formSelect}
                      required
                    >
                      <option value="">Seleccione equipo...</option>
                      {enrolledTeams
                        .filter((enroll) => enroll.team_id !== visitorTeamId)
                        .map((enroll) => (
                          <option key={enroll.team_id} value={enroll.team_id}>
                            {enroll.team_name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <span className={styles.vsText}>VS.</span>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Equipo Visitante</label>
                    <select
                      value={visitorTeamId}
                      onChange={(e) => setVisitorTeamId(e.target.value)}
                      className={styles.formSelect}
                      required
                    >
                      <option value="">Seleccione equipo...</option>
                      {enrolledTeams
                        .filter((enroll) => enroll.team_id !== localTeamId)
                        .map((enroll) => (
                          <option key={enroll.team_id} value={enroll.team_id}>
                            {enroll.team_name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Agrupación en grillas (Cancha y Hora) */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Cancha</label>
                    <select
                      value={courtId}
                      onChange={(e) => setCourtId(e.target.value)}
                      className={styles.formSelect}
                      required
                    >
                      <option value="">Seleccione cancha...</option>
                      {courts.map((court) => (
                        <option key={court.id} value={court.id}>
                          {court.name} ({court.club_name || 'Club'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Hora del Partido</label>
                    <input
                      type="time"
                      value={matchTime}
                      onChange={(e) => setMatchTime(e.target.value)}
                      className={styles.formInput}
                      required
                    />
                  </div>
                </div>

                {/* Agrupación en grillas (Árbitro y Planillero) */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Árbitro Designado</label>
                    <select
                      value={refereeId}
                      onChange={(e) => setRefereeId(e.target.value)}
                      className={styles.formSelect}
                    >
                      <option value="">Sin asignar</option>
                      {referees.map((ref) => (
                        <option key={ref.id} value={ref.id}>
                          {ref.name || ref.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Planillero Designado</label>
                    <select
                      value={scorerId}
                      onChange={(e) => setScorerId(e.target.value)}
                      className={styles.formSelect}
                    >
                      <option value="">Sin asignar</option>
                      {scorers.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name || sc.username}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.btnSubmit}
                >
                  {isSubmitting 
                    ? (editingMatchId ? 'Guardando Cambios...' : 'Registrando Partido...') 
                    : (editingMatchId ? 'Guardar Cambios' : 'Programar Partido')}
                </button>

                {editingMatchId && (
                  <div className={styles.formGroup}>
                    {/* Renderizado condicional de botones según el estado actual */}
                    <div className={styles.btnGroup}>
                      {(editingMatch?.status === 'PREPARATION' || editingMatch?.status === 'PENDING') && (
                        <>
                          <button 
                            type="button"
                            className={`${styles.btnSubmit}`}
                            style={{ backgroundColor: '#0ea5e9' }}
                            onClick={() => handleUpdateMatchStatus(editingMatchId, 'IN_PROGRESS')}
                          >
                            <i className="bi bi-play-circle-fill" style={{ marginRight: '0.25rem' }}></i>
                            Iniciar Partido
                          </button>
                          <button 
                            type="button"
                            className={`${styles.btnSubmit}`}
                            style={{ backgroundColor: '#64748b' }}
                            onClick={() => handleUpdateMatchStatus(editingMatchId, 'CANCELLED')}
                          >
                            <i className="bi bi-x-circle-fill" style={{ marginRight: '0.25rem' }}></i>
                            Cancelar Partido
                          </button>
                        </>
                      )}
                      
                      {editingMatch?.status === 'IN_PROGRESS' && (
                        <>
                          <button 
                            type="button"
                            className={`${styles.btnSubmit}`}
                            style={{ backgroundColor: '#10b981' }}
                            onClick={() => handleUpdateMatchStatus(editingMatchId, 'FINISHED')}
                          >
                            <i className="bi bi-check-circle-fill" style={{ marginRight: '0.25rem' }}></i>
                            Finalizar Partido
                          </button>
                          <button 
                            type="button"
                            className={`${styles.btnSubmit}`}
                            style={{ backgroundColor: '#f59e0b' }}
                            onClick={() => handleUpdateMatchStatus(editingMatchId, 'PREPARATION')}
                          >
                            <i className="bi bi-pause-circle-fill" style={{ marginRight: '0.25rem' }}></i>
                            Suspender (Volver a Prep.)
                          </button>
                        </>
                      )}

                      {editingMatch?.status === 'CANCELLED' && (
                        <button 
                          type="button"
                          className={`${styles.btnSubmit}`}
                          style={{ backgroundColor: '#0ea5e9' }}
                          onClick={() => handleUpdateMatchStatus(editingMatchId, 'PREPARATION')}
                        >
                          <i className="bi bi-arrow-counterclockwise" style={{ marginRight: '0.25rem' }}></i>
                          Retomar (Volver a Prep.)
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {editingMatchId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className={styles.btnSubmit}
                    style={{ backgroundColor: '#64748b', marginTop: '0.25rem' }}
                  >
                    Cancelar Edición
                  </button>
                )}
              </form>
            </section>
          </div>

          {/* Columna Derecha: Partidos Existentes */}
          <div className={styles.rightColumn}>
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Partidos Programados</h3>
                <p className={styles.cardSubtitle}>Cronograma de la fecha activa.</p>
              </div>

              {isLoadingMatches ? (
                <div className={styles.spinner} />
              ) : matches.length === 0 ? (
                <div className={styles.emptyState}>
                  No hay partidos programados para esta fecha.
                </div>
              ) : (
                <div className={styles.matchList}>
                  {matches.map((match) => (
                    <div key={match.id} className={styles.matchItem}>
                      <div className={styles.matchTime}>
                        {formatMatchDate(match.match_datetime)}
                      </div>
                      
                      <div className={styles.matchTeams}>
                        <span className={styles.teamName}>{match.local_team_name}</span>
                        <span className={styles.vs}>vs</span>
                        <span className={styles.teamName}>{match.visitor_team_name}</span>
                      </div>

                      <div className={styles.matchDetails}>
                        <div className={styles.detailRow}>Cancha: <span className={styles.highlight}>{match.court_name || 'Sin asignar'}</span></div>
                        <div className={styles.detailRow}>Árbitro: <span className={styles.highlight}>{match.referee_name || 'Sin asignar'}</span></div>
                        <div className={styles.detailRow}>Planillero: <span className={styles.highlight}>{match.scorer_name || 'Sin asignar'}</span></div>
                      </div>

                      <div className={styles.statusWrapper}>
                        <span className={`${styles.statusBadge} ${
                          match.status === 'FINISHED' ? styles.badgeFinished : styles.badgePending
                        }`}>
                          {STATUS_TRANSLATIONS[match.status] || match.status}
                        </span>
                      </div>

                      {/* Botones de Edición y Eliminación */}
                      <div className={styles.matchActions}>
                        <button
                          type="button"
                          onClick={() => handleEditMatch(match)}
                          className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                          title="Editar Partido"
                          disabled={isSubmitting}
                        >
                          <i className="bi bi-pencil-fill"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMatch(match.id)}
                          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                          title="Eliminar Partido"
                          disabled={isSubmitting}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
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
