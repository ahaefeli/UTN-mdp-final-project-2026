'use client';



import React, { useState, useEffect, useRef } from 'react';

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
import { canRecordResult, resultBlockReason } from '../../../utils/matchPlay';



function stageNumber(stage) {
  const match = String(stage?.name || '').match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function sortStagesByDate(list) {
  return [...(list || [])].sort((a, b) => {
    const byNumber = stageNumber(a) - stageNumber(b);
    if (byNumber !== 0) return byNumber;
    return String(a.date).localeCompare(String(b.date));
  });
}



function formatStageLabel(stage) {

  const [year, month, day] = String(stage.date || '').split('-').map(Number);

  const date = new Date(year, (month || 1) - 1, day || 1);

  const labelDate = Number.isNaN(date.getTime())

    ? stage.date

    : date.toLocaleDateString('es-AR');

  return `${stage.name} (${labelDate})`;

}



function formatPublishedScore(match) {
  const sets = match?.sets_data?.sets;
  if (!Array.isArray(sets) || sets.length === 0) {
    return match?.score_summary || undefined;
  }
  let local = 0;
  let visitor = 0;
  sets.forEach((set) => {
    const lp = Number(set.local_points ?? set.local_score);
    const vp = Number(set.visitor_points ?? set.visitor_score);
    if (lp > vp) local += 1;
    else if (vp > lp) visitor += 1;
  });
  const detail = sets
    .map((set) => `${set.local_points ?? set.local_score}-${set.visitor_points ?? set.visitor_score}`)
    .join(', ');
  if (!local && !visitor) return match?.score_summary || detail;
  return `${local}-${visitor} (${detail})`;
}

function isDatetimeInThePast(dateValue, timeValue) {
  if (!dateValue || !timeValue) return false;
  const when = new Date(`${dateValue}T${timeValue}`);
  return !Number.isNaN(when.getTime()) && when.getTime() < Date.now();
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
  const [stageError, setStageError] = useState('');
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [pastWarning, setPastWarning] = useState(null);
  const [matchToDelete, setMatchToDelete] = useState(null);
  const [pendingStatus, setPendingStatus] = useState('');
  const [statusError, setStatusError] = useState('');
  const [tournamentAction, setTournamentAction] = useState(null);
  const [stageToDelete, setStageToDelete] = useState(null);
  const [tournamentHasResults, setTournamentHasResults] = useState(false);
  const [isMutatingTournament, setIsMutatingTournament] = useState(false);
  const addingStageRef = useRef(false);



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
    if (addingStageRef.current) return;
    setStageError('');

    if (!newStageDate) {
      setStageError('Por favor ingrese una fecha.');

      return;

    }



    const regex = /^\d{4}-\d{2}-\d{2}$/;

    if (!regex.test(newStageDate)) {

      setStageError('Formato de fecha inválido. Debe usar YYYY-MM-DD.');

      return;

    }



    if (newStageDate < todayLocalISO()) {

      setStageError('No se puede agregar una fecha que ya pasó.');

      return;

    }

    if (stages.some((stage) => stage.date === newStageDate)) {

      setStageError('Ya hay una fecha en ese día.');

      return;

    }



    addingStageRef.current = true;
    setIsAddingStage(true);

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

    } finally {
      addingStageRef.current = false;
      setIsAddingStage(false);
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



  const handleDeleteMatch = async () => {

    if (!matchToDelete) return;

    const matchId = matchToDelete.id;

    setMatchToDelete(null);

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



  const handleCreateMatch = async (e, options = {}) => {

    if (e && e.preventDefault) e.preventDefault();

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

    if (!options.confirmedPast && isDatetimeInThePast(selectedStage.date, matchTime)) {
      setPastWarning('create');
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

      await loadMatchesForStage(activeStageId);

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



  const handleSaveEdit = async (e, options = {}) => {

    if (e && e.preventDefault) e.preventDefault();

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

    if (!options.confirmedPast && isDatetimeInThePast(selectedStage.date, timeValue)) {
      setPastWarning('edit');
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



  const handleStatusChange = (newStatus) => {
    if (!newStatus || newStatus === tournament?.status) return;
    setStatusError('');
    setPendingStatus(newStatus);
  };

  const confirmStatusChange = async () => {
    const newStatus = pendingStatus;
    setIsMutatingTournament(true);
    try {
      await tournamentService.updateTournament(tournamentId, { status: newStatus });
      setTournament((prev) => ({ ...prev, status: newStatus }));
      setSuccessMsg('Estado del torneo actualizado correctamente.');
      setPendingStatus('');
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setStatusError(err?.response?.data?.error || 'No se pudo actualizar el estado del torneo.');
    } finally {
      setIsMutatingTournament(false);
    }

  };

  const openDeleteTournament = async () => {
    setTournamentHasResults(false);
    setTournamentAction('delete');
    try {
      const response = await matchService.getMatches({ tournament_id: tournamentId });
      const list = response.data || [];
      setTournamentHasResults(list.some((match) => match.status === 'FINISHED'));
    } catch (err) {
      console.error('Error al revisar resultados del torneo:', err);
    }
  };

  const confirmTournamentAction = async () => {
    setIsMutatingTournament(true);
    setError('');
    try {
      if (tournamentAction === 'archive') {
        await tournamentService.archiveTournament(tournamentId);
        setSuccessMsg('Torneo archivado. Dejó de verse en las listas y se puede restaurar.');
        setTournament((prev) => ({ ...prev, is_deleted: true }));
      } else if (tournamentAction === 'restore') {
        await tournamentService.restoreTournament(tournamentId);
        setSuccessMsg('Torneo restaurado.');
        setTournament((prev) => ({ ...prev, is_deleted: false }));
      } else if (tournamentAction === 'delete') {
        await tournamentService.deleteTournament(tournamentId);
        router.push('/torneos');
        return;
      }
      setTournamentAction(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo completar la acción.');
      setTournamentAction(null);
    } finally {
      setIsMutatingTournament(false);
    }
  };

  const confirmDeleteStage = async () => {
    if (!stageToDelete?.id) return;
    setIsMutatingTournament(true);
    setError('');
    try {
      await tournamentService.deleteStage(stageToDelete.id);
      const stagesRes = await tournamentService.getStages(tournamentId);
      const loadedStages = sortStagesByDate(stagesRes.data || []);
      setStages(loadedStages);
      setActiveStageId(loadedStages[0]?.id || null);
      if (loadedStages[0]?.id) {
        await loadMatchesForStage(loadedStages[0].id);
      } else {
        setMatches([]);
      }
      setSuccessMsg('Fecha eliminada. Las posiciones se recalculan sin esos partidos.');
      setStageToDelete(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo eliminar la fecha.');
    } finally {
      setIsMutatingTournament(false);
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

    setStageError('');

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

          subtitle={`${STATUS_TRANSLATIONS[tournament?.status] || 'Torneo'}: gestioná las fechas y programá los partidos.`}

          actions={

            <div className={styles.headerActions}>

            <select

              value={tournament?.status || ''}

              onChange={(e) => handleStatusChange(e.target.value)}

              className={dirStyles.select}

              aria-label="Estado del torneo"

              disabled={Boolean(tournament?.is_deleted)}

            >

              <option value="PENDING">Pendiente</option>

              <option value="PREPARATION">En preparación</option>

              <option value="IN_PROGRESS">En disputa</option>

              <option value="FINISHED">Finalizado</option>

              <option value="CANCELLED">Cancelado</option>

            </select>

            {tournament?.is_deleted ? (
              <Button size="sm" onClick={() => setTournamentAction('restore')} disabled={isMutatingTournament}>
                Restaurar
              </Button>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={() => setTournamentAction('archive')} disabled={isMutatingTournament}>
                  Archivar
                </Button>
                <Button variant="danger" size="sm" onClick={openDeleteTournament} disabled={isMutatingTournament}>
                  Eliminar
                </Button>
              </>
            )}

            </div>

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

            {activeStageId ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStageToDelete(stages.find((stage) => String(stage.id) === String(activeStageId)) || { id: activeStageId })}
              >
                Eliminar fecha
              </Button>
            ) : null}

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

              description='Hacé clic en "Agregar Fecha" para crear la primera fecha.'

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

                    score={formatPublishedScore(match)}

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
                            disabled={!canRecordResult(match)}

                            disabled={isSubmitting}

                          >

                            Editar resultado

                          </Button>

                        )}

                        <Button

                          variant="danger"

                          size="sm"

                          onClick={() => setMatchToDelete(match)}

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

          subtitle="Elegí el día de la nueva fecha."

          size="sm"

          footer={

            <>

              <Button variant="secondary" onClick={handleCloseStageModal}>

                Cancelar

              </Button>

              <Button type="submit" form="add-stage-form" disabled={isAddingStage}>

                {isAddingStage ? 'Guardando...' : 'Guardar'}

              </Button>

            </>

          }

        >

          <form id="add-stage-form" onSubmit={handleAddStage} className={dirStyles.form} noValidate>

            {stageError ? <Alert variant="error">{stageError}</Alert> : null}

            <div className={dirStyles.formGroup}>

              <label className={dirStyles.label} htmlFor="new-stage-date">

                Día de la fecha

              </label>

              <input

                id="new-stage-date"

                type="text"

                inputMode="numeric"

                placeholder="dd/mm/aaaa"

                value={/^\d{4}-\d{2}-\d{2}$/.test(newStageDate || '') ? `${newStageDate.slice(8, 10)}/${newStageDate.slice(5, 7)}/${newStageDate.slice(0, 4)}` : (newStageDate || '')}

                onChange={(e) => {
                  const raw = e.target.value;
                  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
                  setNewStageDate(match ? `${match[3]}-${match[2]}-${match[1]}` : raw);
                }}

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

              <p className={styles.matchHelp}>
                {(editingMatch?.status === 'PREPARATION' || editingMatch?.status === 'PENDING') &&
                  'Iniciar pasa el partido a en disputa y no carga el resultado. Cancelar lo anula: no suma puntos y se puede retomar.'}
                {editingMatch?.status === 'IN_PROGRESS' &&
                  'Suspender lo vuelve a preparación y conserva el horario y la cancha.'}
                {editingMatch?.status === 'CANCELLED' &&
                  'Retomar lo devuelve a preparación.'}
                {editingMatch?.status === 'FINISHED' &&
                  'Editar resultado corrige los sets ya cargados y recalcula las posiciones.'}
                {resultBlockReason(editingMatch) ? ` ${resultBlockReason(editingMatch)}` : ''}
              </p>

              <div className={chromeStyles.actionsRow}>

                {(editingMatch?.status === 'PREPARATION' || editingMatch?.status === 'PENDING') && (

                  <>

                    <Button

                      type="button"

                      variant="accent"

                      onClick={() => handleUpdateMatchStatus(editDraft.id, 'IN_PROGRESS')}
                      disabled={!canRecordResult(editingMatch)}

                    >

                      <i className="bi bi-play-circle-fill" aria-hidden="true" />

                      Iniciar Partido

                    </Button>

                    <Button type="button" variant="primary" onClick={() => setScoreSheetMatch(editingMatch)}
                      disabled={!canRecordResult(editingMatch)}>

                      <i className="bi bi-clipboard-data-fill" aria-hidden="true" />

                      {editingMatch?.score_summary ? 'Editar resultado' : 'Cargar resultado'}

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

                    <Button type="button" variant="primary" onClick={() => setScoreSheetMatch(editingMatch)}
                      disabled={!canRecordResult(editingMatch)}>

                      <i className="bi bi-check-circle-fill" aria-hidden="true" />

                      {editingMatch?.score_summary ? 'Editar resultado' : 'Cargar resultado'}

                    </Button>

                    <Button

                      type="button"

                      variant="accent"

                      onClick={() => handleUpdateMatchStatus(editDraft.id, 'PREPARATION')}

                    >

                      <i className="bi bi-pause-circle-fill" aria-hidden="true" />

                      Suspender

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

                    Retomar

                  </Button>

                )}



                {editingMatch?.status === 'FINISHED' && (

                  <Button type="button" variant="primary" onClick={() => setScoreSheetMatch(editingMatch)}
                      disabled={!canRecordResult(editingMatch)}>

                    <i className="bi bi-clipboard-data-fill" aria-hidden="true" />

                    Editar resultado

                  </Button>

                )}

              </div>

            </form>

          )}

        </Modal>



        {pastWarning && (
          <Modal
            open
            onClose={() => setPastWarning(null)}
            title="Horario ya pasado"
            size="sm"
            footer={
              <>
                <Button variant="secondary" onClick={() => setPastWarning(null)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    const kind = pastWarning;
                    setPastWarning(null);
                    if (kind === 'create') handleCreateMatch(null, { confirmedPast: true });
                    if (kind === 'edit') handleSaveEdit(null, { confirmedPast: true });
                  }}
                >
                  Continuar
                </Button>
              </>
            }
          >
            <p>El partido queda en un horario que ya pasó. Podés continuar si estás cargando un encuentro que ya se jugó.</p>
          </Modal>
        )}

        <Modal
          open={Boolean(pendingStatus)}
          onClose={() => {
            if (isMutatingTournament) return;
            setPendingStatus('');
            setStatusError('');
          }}
          title="Cambiar estado del torneo"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => { setPendingStatus(''); setStatusError(''); }} disabled={isMutatingTournament}>
                Cancelar
              </Button>
              <Button onClick={confirmStatusChange} disabled={isMutatingTournament}>
                {isMutatingTournament ? 'Guardando...' : 'Cambiar estado'}
              </Button>
            </>
          }
        >
          <p>
            El torneo pasa a {STATUS_TRANSLATIONS[pendingStatus] || pendingStatus}. Si lo finalizás o cancelás, los partidos que no terminaron toman el mismo estado.
          </p>
          {statusError && <Alert variant="error">{statusError}</Alert>}
        </Modal>

        <Modal
          open={tournamentAction === 'archive' || tournamentAction === 'restore'}
          onClose={() => !isMutatingTournament && setTournamentAction(null)}
          title={tournamentAction === 'restore' ? 'Restaurar torneo' : 'Archivar torneo'}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setTournamentAction(null)} disabled={isMutatingTournament}>
                Cancelar
              </Button>
              <Button onClick={confirmTournamentAction} disabled={isMutatingTournament}>
                {isMutatingTournament ? 'Guardando...' : tournamentAction === 'restore' ? 'Restaurar' : 'Archivar'}
              </Button>
            </>
          }
        >
          <p>
            {tournamentAction === 'restore'
              ? 'El torneo vuelve a las listas. Si ya hay otro vigente de la misma categoría y rama, no se puede restaurar en preparación o en disputa.'
              : 'Deja de verse en el panel y en el sitio público. Los resultados se conservan y se puede restaurar.'}
          </p>
        </Modal>

        <Modal
          open={tournamentAction === 'delete'}
          onClose={() => !isMutatingTournament && setTournamentAction(null)}
          title={tournamentHasResults ? 'Este torneo tiene resultados' : 'Eliminar torneo'}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setTournamentAction(null)} disabled={isMutatingTournament}>
                Cancelar
              </Button>
              {tournamentHasResults ? (
                <Button
                  onClick={() => {
                    setTournamentAction('archive');
                  }}
                  disabled={isMutatingTournament}
                >
                  Archivar
                </Button>
              ) : (
                <Button variant="danger" onClick={confirmTournamentAction} disabled={isMutatingTournament}>
                  {isMutatingTournament ? 'Eliminando...' : 'Eliminar'}
                </Button>
              )}
            </>
          }
        >
          <p>
            {tournamentHasResults
              ? 'Borrarlo perdería la tabla. Archivalo para ocultarlo y conservar fechas, partidos y posiciones.'
              : 'Se pierden las fechas, las inscripciones y los partidos de este torneo. Esta acción no se puede deshacer.'}
          </p>
        </Modal>

        <Modal
          open={Boolean(stageToDelete)}
          onClose={() => !isMutatingTournament && setStageToDelete(null)}
          title="Eliminar fecha"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setStageToDelete(null)} disabled={isMutatingTournament}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmDeleteStage} disabled={isMutatingTournament}>
                {isMutatingTournament ? 'Eliminando...' : 'Eliminar fecha'}
              </Button>
            </>
          }
        >
          <p>
            {matches.length > 0
              ? `Se borran los ${matches.length} partidos de esta fecha y la tabla de posiciones se recalcula sin esos puntos.`
              : 'Esta fecha no tiene partidos. Se elimina del cronograma.'}
          </p>
        </Modal>

        <Modal
          open={Boolean(matchToDelete)}
          onClose={() => setMatchToDelete(null)}
          title="Eliminar partido"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setMatchToDelete(null)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDeleteMatch}>
                Eliminar
              </Button>
            </>
          }
        >
          <p>
            {matchToDelete?.status === 'FINISHED'
              ? 'Este partido ya tiene resultado. Si lo eliminás, la tabla de posiciones se recalcula sin esos puntos.'
              : '¿Está seguro de que desea eliminar este partido?'}
          </p>
        </Modal>

        {scoreSheetMatch && (

          <ScoreSheetModal

            key={scoreSheetMatch.id}

            match={scoreSheetMatch}

            onClose={() => setScoreSheetMatch(null)}

            onSuccess={async () => {

              setSuccessMsg('Resultado guardado.');

              const finishedId = scoreSheetMatch.id;

              setScoreSheetMatch(null);

              if (editingMatchId === finishedId) {

                handleCancelEdit();

                setSuccessMsg('Resultado guardado.');

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


