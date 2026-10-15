'use client';



import React, { useState, useEffect } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { useAuth } from '../../../context/AuthContext';

import tournamentService from '../../../services/tournamentService';

import enrollmentService from '../../../services/enrollmentService';

import courtService from '../../../services/courtService';

import userService from '../../../services/userService';

import matchService from '../../../services/matchService';

import { STATUS_TRANSLATIONS } from '../../../utils/status';

import ScoreSheetModal from '../../../components/ScoreSheet/ScoreSheetModal';

import {

  PageHeader,

  Button,

  Alert,

  Modal,

  LoadingState,

  EmptyState,

  MatchRow,

  Tabs,

} from '../../../components/ui';

import dirStyles from '../../../components/ui/AdminDirectory.module.css';

import chromeStyles from '../../../components/ui/PageChrome.module.css';

import styles from './page.module.css';

import MatchScheduleFields from './MatchScheduleFields';



function sortStagesByDate(list) {

  return [...(list || [])].sort((a, b) => String(a.date).localeCompare(String(b.date)));

}



function formatStageLabel(stage) {

  const [year, month, day] = String(stage.date || '').split('-').map(Number);

  const date = new Date(year, (month || 1) - 1, day || 1);

  const labelDate = Number.isNaN(date.getTime())

    ? stage.date

    : date.toLocaleDateString('es-AR');

  return `${stage.name} (${labelDate})`;

}



function todayLocalISO() {

  const date = new Date();

  const month = String(date.getMonth() + 1).padStart(2, '0');

  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;

}



export default function TorneoDetailPage() {

  const params = useParams();

  const router = useRouter();

  const tournamentId = params.id;

  const { role, isAuthenticated, isInitialized } = useAuth();



  const [tournament, setTournament] = useState(null);

  const [stages, setStages] = useState([]);

  const [enrolledTeams, setEnrolledTeams] = useState([]);

  const [courts, setCourts] = useState([]);

  const [referees, setReferees] = useState([]);

  const [scorers, setScorers] = useState([]);

  const [matches, setMatches] = useState([]);



  const [activeStageId, setActiveStageId] = useState('');

  const [localTeamId, setLocalTeamId] = useState('');

  const [visitorTeamId, setVisitorTeamId] = useState('');

  const [courtId, setCourtId] = useState('');

  const [matchTime, setMatchTime] = useState('');

  const [refereeId, setRefereeId] = useState('');

  const [scorerId, setScorerId] = useState('');



  const [editingMatchId, setEditingMatchId] = useState(null);

  const [editDraft, setEditDraft] = useState(null);

  const [editError, setEditError] = useState('');

  const [scoreSheetMatch, setScoreSheetMatch] = useState(null);



  const [isLoading, setIsLoading] = useState(true);

  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState('');

  const [successMsg, setSuccessMsg] = useState('');

  const [isStageModalOpen, setIsStageModalOpen] = useState(false);

  const [newStageDate, setNewStageDate] = useState('');



  const formatMatchDate = (dateString) => {

    if (!dateString) return 'Fecha a confirmar';

    const date = new Date(dateString);



    const weekdayShort = date.toLocaleDateString('es-ES', { weekday: 'short' });

    const weekdayCapitalized = weekdayShort.charAt(0).toUpperCase() + weekdayShort.slice(1);



    const day = date.getDate();



    const monthShort = date.toLocaleDateString('es-ES', { month: 'short' });

    const monthCapitalized = monthShort.charAt(0).toUpperCase() + monthShort.slice(1);



    const hours = String(date.getHours()).padStart(2, '0');

    const minutes = String(date.getMinutes()).padStart(2, '0');

    const timeStr = `${hours}:${minutes}`;



    const cleanMonth = monthCapitalized.replace(/\.$/, '');

    const cleanWeekday = weekdayCapitalized.replace(/\.$/, '');



    const currentYear = new Date().getFullYear();

    if (date.getFullYear() === currentYear) {

      return `${cleanWeekday}. ${day} de ${cleanMonth}, ${timeStr}`;

    }

    return `${cleanWeekday}. ${day} de ${cleanMonth} ${date.getFullYear()}, ${timeStr}`;

  };



  useEffect(() => {

    if (isInitialized) {

      if (!isAuthenticated) {

        router.push('/login');

      } else if (role !== 'ADMIN') {

        router.push('/');

      }

    }

  }, [isInitialized, isAuthenticated, role, router]);



  useEffect(() => {

    if (isAuthenticated && role === 'ADMIN' && tournamentId) {

      const loadInitialData = async () => {

        setIsLoading(true);

        try {

          const [tRes, stagesRes, enrollsRes, courtsRes, refereesRes, scorersRes] =

            await Promise.all([

              tournamentService.getTournamentById(tournamentId),

              tournamentService.getStages(tournamentId),

              enrollmentService.getEnrollments(tournamentId),

              courtService.getCourts(),

              userService.getUsers({ role: 'REFEREE' }),

              userService.getUsers({ role: 'SCORER' }),

            ]);



          setTournament(tRes.data || null);

          const loadedStages = sortStagesByDate(stagesRes.data || []);

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



  const handleAddStage = async (e) => {

    if (e && e.preventDefault) e.preventDefault();

    if (!newStageDate) {

      alert('Por favor ingrese una fecha.');

      return;

    }



    const regex = /^\d{4}-\d{2}-\d{2}$/;

    if (!regex.test(newStageDate)) {

      alert('Formato de fecha inválido. Debe usar YYYY-MM-DD.');

      return;

    }



    if (newStageDate < todayLocalISO()) {

      alert('No se puede agregar una fecha que ya pasó.');

      return;

    }



    try {

      const nextNum = stages.length + 1;

      const res = await tournamentService.addStage({

        tournament_id: tournamentId,

        date: newStageDate,

        name: `Fecha ${nextNum}`,

      });



      const stagesRes = await tournamentService.getStages(tournamentId);

      const loadedStages = sortStagesByDate(stagesRes.data || []);

      setStages(loadedStages);



      if (res && res.data && res.data.id) {

        setActiveStageId(res.data.id);

      }

      setSuccessMsg(`¡Fecha ${nextNum} agregada con éxito!`);

      setNewStageDate('');

      setIsStageModalOpen(false);

    } catch (err) {

      console.error('Error al agregar fecha:', err);

      setError(err?.response?.data?.error || 'No se pudo agregar la fecha.');

      setIsStageModalOpen(false);

    }

  };



  const handleCancelEdit = () => {

    setEditingMatchId(null);

    setEditDraft(null);

    setEditError('');

  };



  const handleEditMatch = (match) => {

    setError('');

    setSuccessMsg('');

    setEditError('');

    setEditingMatchId(match.id);



    let timeValue = '';

    if (match.match_datetime) {

      const d = new Date(match.match_datetime);

      const hours = String(d.getHours()).padStart(2, '0');

      const minutes = String(d.getMinutes()).padStart(2, '0');

      timeValue = `${hours}:${minutes}`;

    }



    setEditDraft({

      id: match.id,

      localTeamId: match.local_team_id != null ? String(match.local_team_id) : '',

      visitorTeamId: match.visitor_team_id != null ? String(match.visitor_team_id) : '',

      courtId: match.court_id != null ? String(match.court_id) : '',

      matchTime: timeValue,

      refereeId: match.referee_id != null ? String(match.referee_id) : '',

      scorerId: match.scorer_id != null ? String(match.scorer_id) : '',

      status: match.status || 'PREPARATION',

    });

  };



  const handleDeleteMatch = async (matchId) => {

    if (!confirm('¿Está seguro de que desea eliminar este partido?')) return;

    try {

      await matchService.deleteMatch(matchId);

      setSuccessMsg('¡Partido eliminado exitosamente!');



      if (editingMatchId === matchId) {

        handleCancelEdit();

      }



      await loadMatchesForStage(activeStageId);

    } catch (err) {

      console.error('Error al eliminar el partido:', err);

      setError(err?.response?.data?.error || 'No se pudo eliminar el partido.');

    }

  };



  const handleUpdateMatchStatus = async (matchId, newStatus) => {

    try {

      await matchService.updateMatch(matchId, { status: newStatus });

      setMatches((prev) =>

        prev.map((m) => (m.id === matchId ? { ...m, status: newStatus } : m))

      );

    } catch (error) {

      console.error('Error al actualizar el estado del partido:', error);

      alert(error.response?.data?.error || 'No se pudo cambiar el estado del partido.');

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



    const selectedStage = stages.find((s) => s.id === activeStageId);

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

        scorer_id: scorerId || null,

      };



      await matchService.createMatch(payload);

      setSuccessMsg('¡Partido creado exitosamente!');



      setLocalTeamId('');

      setVisitorTeamId('');

      setCourtId('');

      setMatchTime('');

      setRefereeId('');

      setScorerId('');

    } catch (err) {

      console.error('Error al guardar el partido:', err);

      if (err.response && err.response.status === 400) {

        setError(

          err.response.data?.error ||

            'El backend rechazó la petición por conflicto de horarios.'

        );

      } else {

        setError('Error de comunicación con el servidor al registrar el partido.');

      }

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleSaveEdit = async (e) => {

    e.preventDefault();

    if (!editDraft) return;



    setEditError('');

    setError('');

    setSuccessMsg('');



    const {

      id,

      localTeamId: localId,

      visitorTeamId: visitorId,

      courtId: selectedCourtId,

      matchTime: timeValue,

      refereeId: selectedRefereeId,

      scorerId: selectedScorerId,

    } = editDraft;



    if (!localId || !visitorId || !selectedCourtId || !timeValue) {

      setEditError('Por favor, completa todos los campos del partido.');

      return;

    }



    if (localId === visitorId) {

      setEditError('El equipo local y el visitante no pueden ser el mismo.');

      return;

    }



    const selectedStage = stages.find((s) => s.id === activeStageId);

    if (!selectedStage) {

      setEditError('Seleccione una fecha válida para programar el partido.');

      return;

    }



    const currentMatch = matches.find((m) => m.id === id);



    setIsSubmitting(true);



    try {

      const payload = {

        tournament_stage_id: activeStageId,

        local_team_id: localId,

        visitor_team_id: visitorId,

        court_id: parseInt(selectedCourtId, 10),

        match_datetime: new Date(`${selectedStage.date}T${timeValue}`).toISOString(),

        referee_id: selectedRefereeId || null,

        scorer_id: selectedScorerId || null,

        status: currentMatch?.status || editDraft.status,

      };



      const res = await matchService.updateMatch(id, payload);

      const updatedMatch = res.data;



      if (updatedMatch) {

        setMatches((prev) => prev.map((m) => (m.id === updatedMatch.id ? updatedMatch : m)));

      }



      setSuccessMsg('¡Partido actualizado exitosamente!');

      setEditingMatchId(null);

      setEditDraft(null);

    } catch (err) {

      console.error('Error al actualizar el partido:', err);

      if (err.response && err.response.status === 400) {

        setEditError(

          err.response.data?.error ||

            'El backend rechazó la petición por conflicto de horarios.'

        );

      } else {

        setEditError('Error de comunicación con el servidor al actualizar el partido.');

      }

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleStatusChange = async (newStatus) => {

    if (!confirm('¿Estás seguro de cambiar el estado del torneo?')) return;

    try {

      await tournamentService.updateTournament(tournamentId, { status: newStatus });

      setTournament((prev) => ({ ...prev, status: newStatus }));

      setSuccessMsg('Estado del torneo actualizado correctamente.');

    } catch (err) {

      console.error('Error al actualizar estado:', err);

      setError(err?.response?.data?.error || 'No se pudo actualizar el estado del torneo.');

    }

  };



  const handleStageTabChange = (stageId) => {

    setActiveStageId(stageId);

    setError('');

    setSuccessMsg('');

  };



  const handleOpenStageModal = () => {

    setError('');

    setSuccessMsg('');

    setNewStageDate('');

    setIsStageModalOpen(true);

  };



  const handleCloseStageModal = () => {

    setIsStageModalOpen(false);

    setNewStageDate('');

  };



  const editingMatch = editDraft

    ? matches.find((m) => m.id === editDraft.id) || null

    : null;



  const stageTabs = sortStagesByDate(stages).map((stage) => ({

    id: stage.id,

    label: formatStageLabel(stage),

  }));



  if (!isInitialized || !isAuthenticated || role !== 'ADMIN' || isLoading) {

    return <LoadingState full />;

  }



  return (

    <div className="appShell">

      <div className={chromeStyles.page}>

        <div className={styles.backRow}>

          <Button variant="ghost" size="sm" onClick={() => router.push('/torneos')}>

            ← Volver a Torneos

          </Button>

        </div>



        <PageHeader

          title={tournament?.name}

          subtitle="Fase de Planificación: Gestioná las fechas y programá los partidos en las canchas de juego."

          actions={

            <select

              value={tournament?.status || ''}

              onChange={(e) => handleStatusChange(e.target.value)}

              className={dirStyles.select}

              aria-label="Estado del torneo"

            >

              <option value="PENDING">Pendiente</option>

              <option value="PREPARATION">En Preparación</option>

              <option value="IN_PROGRESS">En Progreso</option>

              <option value="FINISHED">Finalizado</option>

              <option value="CANCELLED">Cancelado</option>

            </select>

          }

        />



        {(error || successMsg) && (

          <div className={dirStyles.alerts}>

            {successMsg && (

              <Alert variant="success">

                <div className={styles.alertContent}>

                  <span>{successMsg}</span>

                  <Button

                    variant="ghost"

                    size="sm"

                    onClick={() => setSuccessMsg('')}

                    aria-label="Cerrar alerta"

                  >

                    ×

                  </Button>

                </div>

              </Alert>

            )}

            {error && (

              <Alert variant="error">

                <div className={styles.alertContent}>

                  <span>{error}</span>

                  <Button

                    variant="ghost"

                    size="sm"

                    onClick={() => setError('')}

                    aria-label="Cerrar alerta"

                  >

                    ×

                  </Button>

                </div>

              </Alert>

            )}

          </div>

        )}



        <section className={chromeStyles.section}>

          <div className={styles.stageHeader}>

            <h2 className={chromeStyles.sectionTitle}>Fechas del Torneo</h2>

            <Button variant="secondary" size="sm" onClick={handleOpenStageModal}>

              <i className="bi bi-plus-lg" aria-hidden="true" />

              Agregar Fecha

            </Button>

          </div>



          {stageTabs.length > 0 ? (

            <Tabs tabs={stageTabs} active={activeStageId} onChange={handleStageTabChange} scrollable />

          ) : (

            <EmptyState

              title="No hay fechas configuradas"

              description='Haga clic en "Agregar Fecha" para crear la primera jornada.'

            />

          )}

        </section>



        <div className={chromeStyles.twoCol}>

          <section className={chromeStyles.card}>

            <div>

              <h3 className={styles.panelTitle}>Programar Nuevo Partido</h3>

              <p className={chromeStyles.muted}>

                Asigná equipos, cancha, horarios y oficiales.

              </p>

            </div>



            <form onSubmit={handleCreateMatch} className={dirStyles.form}>

              <MatchScheduleFields
                idPrefix="create-match"
                localTeamId={localTeamId}
                visitorTeamId={visitorTeamId}
                courtId={courtId}
                matchTime={matchTime}
                refereeId={refereeId}
                scorerId={scorerId}
                onChange={(field, value) => {
                  const setters = {
                    localTeamId: setLocalTeamId,
                    visitorTeamId: setVisitorTeamId,
                    courtId: setCourtId,
                    matchTime: setMatchTime,
                    refereeId: setRefereeId,
                    scorerId: setScorerId,
                  };
                  setters[field]?.(value);
                }}
                enrolledTeams={enrolledTeams}
                courts={courts}
                referees={referees}
                scorers={scorers}
              />

              <Button type="submit" disabled={isSubmitting} block>

                {isSubmitting ? 'Registrando Partido...' : 'Programar Partido'}

              </Button>

            </form>


          </section>



          <section className={chromeStyles.card}>

            <div>

              <h3 className={styles.panelTitle}>Partidos Programados</h3>

              <p className={chromeStyles.muted}>Cronograma de la fecha activa.</p>

            </div>



            {isLoadingMatches ? (

              <LoadingState label="Cargando partidos..." />

            ) : matches.length === 0 ? (

              <EmptyState title="No hay partidos programados para esta fecha." />

            ) : (

              <div className={chromeStyles.list}>

                {matches.map((match) => (

                  <MatchRow

                    key={match.id}

                    time={formatMatchDate(match.match_datetime)}

                    homeTeam={match.local_team_name}

                    awayTeam={match.visitor_team_name}

                    venue={`Cancha: ${match.court_name || 'Sin asignar'} · Árbitro: ${match.referee_name || 'Sin asignar'} · Planillero: ${match.scorer_name || 'Sin asignar'}`}

                    score={match.score_summary || undefined}

                    status={match.status}

                    statusLabel={STATUS_TRANSLATIONS[match.status] || match.status}

                    actions={

                      <>

                        <Button

                          variant="secondary"

                          size="sm"

                          onClick={() => handleEditMatch(match)}

                          disabled={isSubmitting}

                          aria-label="Editar partido"

                        >

                          <i className="bi bi-pencil-fill" aria-hidden="true" />

                        </Button>

                        {match.status === 'FINISHED' && (

                          <Button

                            variant="secondary"

                            size="sm"

                            onClick={() => setScoreSheetMatch(match)}

                            disabled={isSubmitting}

                          >

                            Editar resultado

                          </Button>

                        )}

                        <Button

                          variant="danger"

                          size="sm"

                          onClick={() => handleDeleteMatch(match.id)}

                          disabled={isSubmitting}

                          aria-label="Eliminar partido"

                        >

                          <i className="bi bi-trash-fill" aria-hidden="true" />

                        </Button>

                      </>

                    }

                  />

                ))}

              </div>

            )}

          </section>

        </div>



        <Modal

          open={isStageModalOpen}

          onClose={handleCloseStageModal}

          title="Agregar Nueva Fecha"

          subtitle="Seleccione la fecha correspondiente para la nueva jornada."

          size="sm"

          footer={

            <>

              <Button variant="secondary" onClick={handleCloseStageModal}>

                Cancelar

              </Button>

              <Button type="submit" form="add-stage-form">

                Guardar

              </Button>

            </>

          }

        >

          <form id="add-stage-form" onSubmit={handleAddStage} className={dirStyles.form}>

            <div className={dirStyles.formGroup}>

              <label className={dirStyles.label} htmlFor="new-stage-date">

                Fecha de Jornada

              </label>

              <input

                id="new-stage-date"

                type="date"

                required

                min={todayLocalISO()}

                value={newStageDate}

                onChange={(e) => setNewStageDate(e.target.value)}

                className={dirStyles.input}

              />

            </div>

          </form>

        </Modal>



        <Modal

          open={Boolean(editDraft)}

          onClose={handleCancelEdit}

          title="Editar partido"

          subtitle="Modificá equipos, cancha, horario y oficiales de este partido."

          size="lg"

          footer={

            <>

              <Button variant="secondary" onClick={handleCancelEdit} disabled={isSubmitting}>

                Cancelar

              </Button>

              <Button type="submit" form="edit-match-form" disabled={isSubmitting}>

                {isSubmitting ? 'Guardando Cambios...' : 'Guardar Cambios'}

              </Button>

            </>

          }

        >

          {editDraft && (

            <form id="edit-match-form" onSubmit={handleSaveEdit} className={dirStyles.form}>

              <MatchScheduleFields

                idPrefix="edit-match"

                localTeamId={editDraft.localTeamId}

                visitorTeamId={editDraft.visitorTeamId}

                courtId={editDraft.courtId}

                matchTime={editDraft.matchTime}

                refereeId={editDraft.refereeId}

                scorerId={editDraft.scorerId}

                onChange={(field, value) =>

                  setEditDraft((prev) => (prev ? { ...prev, [field]: value } : prev))

                }

                enrolledTeams={enrolledTeams}

                courts={courts}

                referees={referees}

                scorers={scorers}

              />



              {editError && <Alert variant="error">{editError}</Alert>}



              <div className={chromeStyles.actionsRow}>

                {(editingMatch?.status === 'PREPARATION' || editingMatch?.status === 'PENDING') && (

                  <>

                    <Button

                      type="button"

                      variant="accent"

                      onClick={() => handleUpdateMatchStatus(editDraft.id, 'IN_PROGRESS')}

                    >

                      <i className="bi bi-play-circle-fill" aria-hidden="true" />

                      Iniciar Partido

                    </Button>

                    <Button type="button" variant="primary" onClick={() => setScoreSheetMatch(editingMatch)}>

                      <i className="bi bi-clipboard-data-fill" aria-hidden="true" />

                      Cargar resultado

                    </Button>

                    <Button

                      type="button"

                      variant="secondary"

                      onClick={() => handleUpdateMatchStatus(editDraft.id, 'CANCELLED')}

                    >

                      <i className="bi bi-x-circle-fill" aria-hidden="true" />

                      Cancelar Partido

                    </Button>

                  </>

                )}



                {editingMatch?.status === 'IN_PROGRESS' && (

                  <>

                    <Button type="button" variant="primary" onClick={() => setScoreSheetMatch(editingMatch)}>

                      <i className="bi bi-check-circle-fill" aria-hidden="true" />

                      Cargar resultado

                    </Button>

                    <Button

                      type="button"

                      variant="accent"

                      onClick={() => handleUpdateMatchStatus(editDraft.id, 'PREPARATION')}

                    >

                      <i className="bi bi-pause-circle-fill" aria-hidden="true" />

                      Suspender (Volver a Prep.)

                    </Button>

                  </>

                )}



                {editingMatch?.status === 'CANCELLED' && (

                  <Button

                    type="button"

                    variant="accent"

                    onClick={() => handleUpdateMatchStatus(editDraft.id, 'PREPARATION')}

                  >

                    <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />

                    Retomar (Volver a Prep.)

                  </Button>

                )}



                {editingMatch?.status === 'FINISHED' && (

                  <Button type="button" variant="primary" onClick={() => setScoreSheetMatch(editingMatch)}>

                    <i className="bi bi-clipboard-data-fill" aria-hidden="true" />

                    Editar resultado

                  </Button>

                )}

              </div>

            </form>

          )}

        </Modal>



        {scoreSheetMatch && (

          <ScoreSheetModal

            key={scoreSheetMatch.id}

            match={scoreSheetMatch}

            onClose={() => setScoreSheetMatch(null)}

            onSuccess={async () => {

              setSuccessMsg('Resultado publicado correctamente.');

              const finishedId = scoreSheetMatch.id;

              setScoreSheetMatch(null);

              if (editingMatchId === finishedId) {

                handleCancelEdit();

                setSuccessMsg('Resultado publicado correctamente.');

              }

              if (activeStageId) {

                await loadMatchesForStage(activeStageId);

              }

            }}

          />

        )}

      </div>

    </div>

  );

}


