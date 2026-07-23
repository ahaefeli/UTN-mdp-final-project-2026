'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import teamService from '../../../services/teamService';
import tournamentService from '../../../services/tournamentService';
import enrollmentService from '../../../services/enrollmentService';
import userService from '../../../services/userService';
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
  
  // Stages (Fechas)
  const [stages, setStages] = useState([{ name: 'Fecha 1', date: '' }]);
  
  // Equipos del Paso 2
  const [teams, setTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

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
    setError('');
    setIsLoadingTeams(true);
    setStep(2);
    try {
      const response = await teamService.getTeamsByCategoryAndBranch(category, branch);
      setTeams(response.data || []);
      setSelectedTeams([]);
    } catch (err) {
      console.error('Error al cargar equipos:', err);
      setError('Error al obtener equipos de la categoría y rama elegidas.');
      setStep(1);
    } finally {
      setIsLoadingTeams(false);
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
        organization_id: userOrgId || user?.organization_id || user?.organization,
        stages: stages.filter(s => s.date)
      };
      
      const resTournament = await tournamentService.createTournament(payload);
      const createdTournament = resTournament.data;
      
      // Inscripción de los equipos seleccionados
      if (createdTournament && createdTournament.id && selectedTeams.length > 0) {
        await Promise.all(
          selectedTeams.map(teamId => 
            enrollmentService.createEnrollment(createdTournament.id, teamId)
          )
        );
      }
      
      setSuccess(true);
      setStep(3); // Success Screen
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
    setStages([{ name: 'Fecha 1', date: '' }]);
    setTeams([]);
    setSelectedTeams([]);
    setStep(1);
    setSuccess(false);
    setError('');
    setErrorMessage(null);
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
            <form onSubmit={handleNextStep} className={chromeStyles.form}>
              <div className={chromeStyles.formGroup}>
                <label className={chromeStyles.label} htmlFor="tournament-name">
                  Nombre del Torneo
                </label>
                <input
                  id="tournament-name"
                  type="text"
                  required
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
                    }}
                    className={chromeStyles.select}
                  >
                    <option value="SUB_14">Sub 14</option>
                    <option value="SUB_16">Sub 16</option>
                    <option value="SUB_18">Sub 18</option>
                    <option value="SUB_21">Sub 21</option>
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
                    }}
                    className={chromeStyles.select}
                  >
                    <option value="FEMALE">Femenino</option>
                    <option value="MALE">Masculino</option>
                  </select>
                </div>
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
                        type="date"
                        required={index === 0}
                        value={stage.date}
                        onChange={(e) => handleStageDateChange(index, e.target.value)}
                        className={chromeStyles.input}
                      />
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

              <div className={chromeStyles.actionsRow}>
                <Button type="submit" block>
                  Continuar a Selección de Equipos
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
                  Categoría: {category} | Rama: {branch} | Fechas: {stages.length}
                </p>
              </div>

              <div className={chromeStyles.section}>
                <h3 className={chromeStyles.sectionTitle}>
                  Equipos Disponibles ({category} - {branch})
                </h3>

                {isLoadingTeams ? (
                  <LoadingState label="Cargando equipos..." />
                ) : teams.length === 0 ? (
                  <EmptyState title="No se encontraron equipos registrados para esta categoría y rama." />
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
                  El torneo ha sido registrado correctamente con su cronograma de fechas e inscripciones.
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
