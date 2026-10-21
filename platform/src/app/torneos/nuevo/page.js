'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import teamService from '../../../services/teamService';
import tournamentService from '../../../services/tournamentService';
import enrollmentService from '../../../services/enrollmentService';
import userService from '../../../services/userService';
import { STATUS_TRANSLATIONS } from '../../../utils/status';
import { formatBranch, formatCategory } from '../../../utils/labels';
import {
  PageHeader,
  Button,
  Alert,
  LoadingState,
  EmptyState,
} from '../../../components/ui';
import chromeStyles from '../../../components/ui/PageChrome.module.css';
import styles from './page.module.css';

export default function TorneosNuevoPage() {
  const router = useRouter();
  const { user, role, isAuthenticated, isInitialized } = useAuth();

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

  const [userOrgId, setUserOrgId] = useState(null);

  // Obtener la organización del administrador
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const fetchUserOrg = async () => {
        try {
          const res = await userService.getUserById(user.id);
          const orgId = res.data?.organization || res.data?.organization_id;
          setUserOrgId(orgId);
        } catch (err) {
          console.error('Error al obtener organización del usuario:', err);
        }
      };
      fetchUserOrg();
    }
  }, [isAuthenticated, user]);

  // Estados del Wizard
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('PRIMERA');
  const [branch, setBranch] = useState('FEMALE');
  const [bestOf, setBestOf] = useState(5);
  
  // Stages (Fechas)
  const [stages, setStages] = useState([{ name: 'Fecha 1', date: '' }]);
  
  // Equipos del Paso 2
  const [teams, setTeams] = useState([]);
  const [teamsFilter, setTeamsFilter] = useState('');
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [pendingWarning, setPendingWarning] = useState(false);
  const [createdStatus, setCreatedStatus] = useState(null);

  const handleAddStage = () => {
    const nextNum = stages.length + 1;
    setStages([...stages, { name: `Fecha ${nextNum}`, date: '' }]);
  };

  const handleRemoveStage = (index) => {
    if (index === 0) return; // Fecha 1 obligatoria
    const newStages = stages.filter((_, i) => i !== index);
    const updatedStages = newStages.map((s, i) => ({
      name: `Fecha ${i + 1}`,
      date: s.date
    }));
    setStages(updatedStages);
  };

  const handleStageDateChange = (index, value) => {
    const newStages = [...stages];
    newStages[index].date = value;
    setStages(newStages);
  };

  const advanceToTeams = async () => {
    const filterKey = `${category}|${branch}`;
    const keepSelection = teamsFilter === filterKey;
    setIsLoadingTeams(true);
    setStep(2);
    try {
      const response = await teamService.getTeamsByCategoryAndBranch(category, branch);
      setTeams(response.data || []);
      if (!keepSelection) setSelectedTeams([]);
      setTeamsFilter(filterKey);
    } catch (err) {
      console.error('Error al cargar equipos:', err);
      setError('Error al obtener equipos de la categoría y rama elegidas.');
      setStep(1);
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, ingresa el nombre del torneo.');
      return;
    }
    if (!stages[0].date) {
      setError('La Fecha 1 es obligatoria.');
      return;
    }
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const seenDates = new Set();
    for (const stage of stages) {
      if (!stage.date) continue;
      if (stage.date < todayIso) {
        setError('No se puede usar una fecha que ya pasó.');
        return;
      }
      if (seenDates.has(stage.date)) {
        setError('No puede haber dos fechas el mismo día.');
        return;
      }
      seenDates.add(stage.date);
    }
    setError('');
    try {
      const res = await tournamentService.getTournaments();
      const hasActive = (res.data || []).some(
        (t) =>
          t.category === category &&
          t.branch === branch &&
          (t.status === 'PREPARATION' || t.status === 'IN_PROGRESS')
      );
      if (hasActive && !pendingWarning) {
        setPendingWarning(true);
        return;
      }
      setPendingWarning(hasActive);
      await advanceToTeams();
    } catch (err) {
      console.error('Error al verificar torneos vigentes:', err);
      setError('No se pudo verificar si ya hay un torneo vigente. Intente nuevamente.');
    }
  };

  const handleToggleTeam = (teamId) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(selectedTeams.filter(id => id !== teamId));
    } else {
      setSelectedTeams([...selectedTeams, teamId]);
    }
  };

  const handleCreateTournament = async () => {
    setIsSubmitting(true);
    setError('');
    setErrorMessage(null);
    try {
      const year = new Date().getFullYear();
      const payload = {
        name: name.trim(),
        year,
        category,
        branch,
        best_of: Number(bestOf),
        organization_id: userOrgId || user?.organization_id || user?.organization,
        stages: stages.filter(s => s.date)
      };
      
      const resTournament = await tournamentService.createTournament(payload);
      const createdTournament = resTournament.data;
      setCreatedStatus(createdTournament?.status || null);
      
      // Inscripción de los equipos seleccionados
      if (createdTournament && createdTournament.id && selectedTeams.length > 0) {
        await Promise.all(
          selectedTeams.map(teamId => 
            enrollmentService.createEnrollment(createdTournament.id, teamId)
          )
        );
      }
      
      if (!createdTournament?.id) {
        throw new Error('El torneo se creó sin un identificador.');
      }
      router.push(`/torneos/${createdTournament.id}`);
      return;
    } catch (err) {
      console.error('Error al crear el torneo:', err);
      if (err?.response?.status === 400) {
        setErrorMessage(err.response.data?.error || 'Error al procesar la creación del torneo.');
      } else {
        setError(err?.response?.data?.error || 'Error al procesar la creación del torneo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setCategory('PRIMERA');
    setBranch('FEMALE');
    setBestOf(5);
    setStages([{ name: 'Fecha 1', date: '' }]);
    setTeams([]);
    setSelectedTeams([]);
    setStep(1);
    setSuccess(false);
    setError('');
    setErrorMessage(null);
    setPendingWarning(false);
    setCreatedStatus(null);
  };

  if (!isInitialized || !isAuthenticated || role !== 'ADMIN') {
    return <LoadingState full />;
  }

  return (
    <div className="appShell">
      <div className={chromeStyles.page}>
        <div className={styles.backLink}>
          <Button variant="ghost" size="sm" onClick={() => router.push('/torneos')}>
            <i className="bi bi-arrow-left" aria-hidden="true" />
            Volver a Torneos
          </Button>
        </div>

        <PageHeader
          title="Creación de Torneo"
          subtitle="Configure las fechas y asocie los equipos federados al nuevo torneo."
        />

        {step < 3 && (
          <div className={styles.wizard}>
            <div className={`${styles.wizardStep} ${step === 1 ? styles.wizardStepActive : ''}`}>
              <span className={styles.wizardNum}>1</span>
              Datos Generales
            </div>
            <div className={styles.wizardLine} />
            <div className={`${styles.wizardStep} ${step === 2 ? styles.wizardStepActive : ''}`}>
              <span className={styles.wizardNum}>2</span>
              Inscribir Equipos
            </div>
          </div>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        <div className={chromeStyles.card}>
          {/* Paso 1: Configuración de Torneo */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className={chromeStyles.form} noValidate>
              <div className={chromeStyles.formGroup}>
                <label className={chromeStyles.label} htmlFor="tournament-name">
                  Nombre del Torneo
                </label>
                <input
                  id="tournament-name"
                  type="text"
                  placeholder="Ej: Apertura Sub-18 Femenino 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={chromeStyles.input}
                />
              </div>

              <div className={chromeStyles.formRow}>
                <div className={chromeStyles.formGroup}>
                  <label className={chromeStyles.label} htmlFor="tournament-category">
                    Categoría
                  </label>
                  <select
                    id="tournament-category"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setErrorMessage(null);
                      setPendingWarning(false);
                    }}
                    className={chromeStyles.select}
                  >
                    <option value="SUB_14">Sub-14</option>
                    <option value="SUB_16">Sub-16</option>
                    <option value="SUB_18">Sub-18</option>
                    <option value="SUB_21">Sub-21</option>
                    <option value="PRIMERA">Primera</option>
                    <option value="MAXI">Maxi</option>
                  </select>
                </div>

                <div className={chromeStyles.formGroup}>
                  <label className={chromeStyles.label} htmlFor="tournament-branch">
                    Rama
                  </label>
                  <select
                    id="tournament-branch"
                    value={branch}
                    onChange={(e) => {
                      setBranch(e.target.value);
                      setErrorMessage(null);
                      setPendingWarning(false);
                    }}
                    className={chromeStyles.select}
                  >
                    <option value="FEMALE">Femenino</option>
                    <option value="MALE">Masculino</option>
                  </select>
                </div>
              </div>

              <div className={`${chromeStyles.formGroup} ${styles.formGroup || ''}`}>
                <label className={chromeStyles.label} htmlFor="bestOfSelect">
                  Formato de partidos
                </label>
                <select
                  id="bestOfSelect"
                  value={bestOf}
                  onChange={(e) => setBestOf(Number(e.target.value))}
                  disabled={isSubmitting}
                  className={chromeStyles.select}
                >
                  <option value={5}>Mejor de 5 sets (gana 3)</option>
                  <option value={3}>Mejor de 3 sets (gana 2)</option>
                </select>
              </div>

              <div className={chromeStyles.section}>
                <div className={styles.stagesHeader}>
                  <h3 className={chromeStyles.sectionTitle}>Cronograma de Fechas</h3>
                  <Button type="button" variant="ghost" size="sm" onClick={handleAddStage}>
                    + Agregar Fecha
                  </Button>
                </div>

                <div className={chromeStyles.stack}>
                  {stages.map((stage, index) => (
                    <div key={index} className={styles.stageRow}>
                      <span className={styles.stageLabel}>{stage.name}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="dd/mm/aaaa"
                        aria-describedby={`stage-date-hint-${index}`}
                        value={/^\d{4}-\d{2}-\d{2}$/.test(stage.date || '') ? `${stage.date.slice(8, 10)}/${stage.date.slice(5, 7)}/${stage.date.slice(0, 4)}` : (stage.date || '')}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
                          handleStageDateChange(index, match ? `${match[3]}-${match[2]}-${match[1]}` : raw);
                        }}
                        className={chromeStyles.input}
                      />
                      <span id={`stage-date-hint-${index}`} className={styles.stageLabel}>
                        {stage.date
                          ? new Date(`${stage.date}T12:00:00`).toLocaleDateString('es-AR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'día/mes/año'}
                      </span>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveStage(index)}
                          aria-label={`Eliminar ${stage.name}`}
                        >
                          <i className="bi bi-trash" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {pendingWarning && (
                <Alert variant="warning">
                  Ya hay un torneo vigente para esta categoría y rama. Este torneo se va a crear como Pendiente.
                </Alert>
              )}

              <div className={chromeStyles.actionsRow}>
                <Button type="submit" block>
                  {pendingWarning
                    ? 'Continuar y crear como pendiente'
                    : 'Continuar a Selección de Equipos'}
                </Button>
              </div>
            </form>
          )}

          {/* Paso 2: Inscripción de Equipos */}
          {step === 2 && (
            <div className={chromeStyles.form}>
              <div className={styles.summary}>
                <p className={styles.summaryTitle}>Resumen del Torneo:</p>
                <p className={styles.summaryName}>{name}</p>
                <p className={styles.summaryMeta}>
                  Categoría: {formatCategory(category)} | Rama: {formatBranch(branch)} | Formato: Mejor de {bestOf} | Fechas: {stages.length}
                </p>
                <p className={styles.summaryMeta}>
                  Estado al crear: {pendingWarning ? 'Pendiente' : 'En preparación'}
                </p>
              </div>

              <div className={chromeStyles.section}>
                <h3 className={chromeStyles.sectionTitle}>
                  Equipos Disponibles ({formatCategory(category)} - {formatBranch(branch)})
                </h3>

                {isLoadingTeams ? (
                  <LoadingState label="Cargando equipos..." />
                ) : teams.length === 0 ? (
                  <EmptyState
                    title="No hay equipos para esta categoría y rama."
                    description="El club se da de alta con una invitación en Clubes. Después, el club crea sus equipos en Mis Equipos y recién ahí se pueden inscribir."
                  />
                ) : (
                  <div className={styles.teamGrid}>
                    {teams.map((team) => {
                      const isSelected = selectedTeams.includes(team.id);
                      return (
                        <div
                          key={team.id}
                          onClick={() => handleToggleTeam(team.id)}
                          className={`${styles.teamCard} ${isSelected ? styles.teamCardSelected : ''}`}
                          role="checkbox"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleToggleTeam(team.id);
                            }
                          }}
                        >
                          <span className={styles.checkbox}>
                            {isSelected && <i className="bi bi-check" aria-hidden="true" />}
                          </span>
                          <span className={styles.teamName}>{team.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

              <div className={chromeStyles.actionsRow}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateTournament}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Procesando...' : 'Crear Torneo'}
                </Button>
              </div>
            </div>
          )}

          {/* Paso 3: Éxito */}
          {step === 3 && success && (
            <div className={styles.successPanel}>
              <div className={styles.successIcon}>
                <i className="bi bi-check-lg" aria-hidden="true" />
              </div>
              <div>
                <h2 className={styles.successTitle}>¡Torneo Creado Exitosamente!</h2>
                <p className={styles.successDesc}>
                  {createdStatus === 'PENDING'
                    ? 'El torneo quedó en estado Pendiente porque ya hay otro vigente para esta categoría y rama. Podés pasarlo a preparación cuando ese torneo finalice.'
                    : `El torneo ha sido registrado en estado ${STATUS_TRANSLATIONS[createdStatus] || 'Preparación'} con su cronograma de fechas e inscripciones.`}
                </p>
              </div>
              <div className={styles.successActions}>
                <Button variant="secondary" onClick={handleReset}>
                  Crear Otro Torneo
                </Button>
                <Button onClick={() => router.push('/torneos')}>
                  Volver a Gestión
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
