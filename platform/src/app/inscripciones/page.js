'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import authService from '../../services/authService';
import enrollmentService from '../../services/enrollmentService';
import {
  PageHeader,
  Button,
  Alert,
  DataTable,
  LoadingState,
  EmptyState,
} from '../../components/ui';
import chrome from '../../components/ui/PageChrome.module.css';
import styles from './page.module.css';

const ENROLLMENT_COLUMNS = [
  { key: 'team', label: 'Equipo' },
  { key: 'tournament', label: 'Torneo' },
  { key: 'category', label: 'Categoría' },
  { key: 'branch', label: 'Rama' },
];

export default function InscripcionesPage() {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [filterTournamentId, setFilterTournamentId] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      loadInitialData();
    }
  }, [router]);

  const loadInitialData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [tournamentsRes, teamsRes] = await Promise.all([
        enrollmentService.getTournaments(),
        enrollmentService.getTeams(),
      ]);

      const tournamentsList = tournamentsRes.data || [];
      setTournaments(tournamentsList);
      setTeams(teamsRes.data || []);

      if (tournamentsList.length > 0) {
        const firstId = tournamentsList[0].id;
        setFilterTournamentId(firstId);
        loadEnrollments(firstId);
      }
    } catch (err) {
      console.error('Error al cargar datos de inscripciones:', err);
      setErrorMsg('No se pudieron obtener los torneos o equipos del servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEnrollments = async (tournamentId) => {
    if (!tournamentId) {
      setEnrollments([]);
      return;
    }
    setIsLoadingEnrollments(true);
    setErrorMsg('');
    try {
      const response = await enrollmentService.getEnrollments(tournamentId);
      setEnrollments(response.data || []);
    } catch (err) {
      console.error('Error al cargar inscripciones:', err);
      setErrorMsg('No se pudieron obtener las inscripciones de este torneo.');
    } finally {
      setIsLoadingEnrollments(false);
    }
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterTournamentId(value);
    loadEnrollments(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedTournamentId || !selectedTeamId) {
      setErrorMsg('Por favor, selecciona un torneo y un equipo.');
      return;
    }

    setIsSubmitting(true);
    try {
      await enrollmentService.createEnrollment(selectedTournamentId, selectedTeamId);
      setSuccessMsg('Inscripción creada con éxito.');

      if (selectedTournamentId === filterTournamentId) {
        await loadEnrollments(filterTournamentId);
      } else {
        setFilterTournamentId(selectedTournamentId);
        await loadEnrollments(selectedTournamentId);
      }

      setSelectedTournamentId('');
      setSelectedTeamId('');
    } catch (err) {
      console.error('Error al inscribir equipo:', err);
      let msg = 'No se pudo completar la inscripción.';
      if (err.response && err.response.data && err.response.data.error) {
        msg = err.response.data.error;
      }
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || isLoading) {
    return <LoadingState full />;
  }

  return (
    <div className="appShell">
      <div className={chrome.page}>
        <PageHeader
          title={
            <>
              <span className={styles.titleHighlight}>Nueva</span> Inscripción
            </>
          }
          actions={
            <Link href="/" className={styles.backLink}>
              <i className="bi bi-arrow-left" aria-hidden="true" />
              Volver
            </Link>
          }
        />

        {(errorMsg || successMsg) && (
          <div className={styles.alerts}>
            {errorMsg && (
              <Alert variant="error">
                <div className={styles.alertContent}>
                  <span>{errorMsg}</span>
                  <Button variant="ghost" size="sm" onClick={() => setErrorMsg('')} aria-label="Cerrar alerta">
                    ×
                  </Button>
                </div>
              </Alert>
            )}
            {successMsg && (
              <Alert variant="success">
                <div className={styles.alertContent}>
                  <span>{successMsg}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSuccessMsg('')} aria-label="Cerrar alerta">
                    ×
                  </Button>
                </div>
              </Alert>
            )}
          </div>
        )}

        <div className={styles.layoutGrid}>
          <section className={chrome.card}>
            <h2 className={chrome.sectionTitle}>Registrar Inscripción</h2>

            <form onSubmit={handleSubmit} className={chrome.form}>
              <div className={chrome.formGroup}>
                <label className={chrome.label} htmlFor="enrollment-tournament">
                  Torneo Oficial
                </label>
                <select
                  id="enrollment-tournament"
                  className={chrome.select}
                  value={selectedTournamentId}
                  onChange={(e) => setSelectedTournamentId(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">-- Selecciona un Torneo --</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category} - {t.branch})
                    </option>
                  ))}
                </select>
              </div>

              <div className={chrome.formGroup}>
                <label className={chrome.label} htmlFor="enrollment-team">
                  Equipo Participante
                </label>
                <select
                  id="enrollment-team"
                  className={chrome.select}
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">-- Selecciona un Equipo --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.category} - {t.branch})
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" block disabled={isSubmitting}>
                {isSubmitting ? 'Inscribiendo...' : 'Inscribir Equipo'}
              </Button>
            </form>
          </section>

          <section className={chrome.card}>
            <div className={styles.listHeader}>
              <h2 className={chrome.sectionTitle}>Equipos Inscritos</h2>

              <div className={styles.listToolbar}>
                <select
                  className={`${chrome.select} ${styles.filterSelect}`}
                  value={filterTournamentId}
                  onChange={handleFilterChange}
                  aria-label="Filtrar por torneo"
                >
                  <option value="">-- Filtrar por Torneo --</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => loadEnrollments(filterTournamentId)}
                  disabled={isLoadingEnrollments || !filterTournamentId}
                >
                  Actualizar
                </Button>
              </div>
            </div>

            {isLoadingEnrollments ? (
              <LoadingState label="Cargando inscripciones..." />
            ) : !filterTournamentId ? (
              <EmptyState title="Selecciona un torneo oficial en el filtro para visualizar las inscripciones." />
            ) : enrollments.length === 0 ? (
              <EmptyState title="No hay equipos inscritos en este torneo." />
            ) : (
              <DataTable columns={ENROLLMENT_COLUMNS}>
                {enrollments.map((e) => (
                  <tr key={e.id}>
                    <td className={styles.cellStrong}>{e.team_name}</td>
                    <td>{e.tournament_name}</td>
                    <td>{e.category}</td>
                    <td className={styles.branchCell}>{e.branch}</td>
                  </tr>
                ))}
              </DataTable>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
