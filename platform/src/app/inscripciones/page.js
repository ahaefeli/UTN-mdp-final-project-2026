'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import authService from '../../services/authService';
import enrollmentService from '../../services/enrollmentService';

export default function InscripcionesPage() {
  const router = useRouter();

  // Estados reactivos de sesión y listas
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  // Estados del formulario y filtros
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [filterTournamentId, setFilterTournamentId] = useState('');

  // Estados de carga y retroalimentación
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEnrollments, setIsLoadingEnrollments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Autenticación y carga inicial de catálogos
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      loadInitialData();
    }
  }, [router]);

  // Cargar torneos y equipos para los selectores
  const loadInitialData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [tournamentsRes, teamsRes] = await Promise.all([
        enrollmentService.getTournaments(),
        enrollmentService.getTeams()
      ]);
      
      const tournamentsList = tournamentsRes.data || [];
      setTournaments(tournamentsList);
      setTeams(teamsRes.data || []);
      
      // Si hay torneos, pre-seleccionar el primero para el filtro de listado
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

  // Cargar inscripciones para un torneo específico
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

  // Escuchar cambio en el filtro de torneo
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterTournamentId(value);
    loadEnrollments(value);
  };

  // Enviar formulario de inscripción
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
      
      // Si el torneo inscrito es el que se está visualizando en el filtro, recargar
      if (selectedTournamentId === filterTournamentId) {
        await loadEnrollments(filterTournamentId);
      } else {
        // De lo contrario, cambiar el filtro al torneo recién inscrito
        setFilterTournamentId(selectedTournamentId);
        await loadEnrollments(selectedTournamentId);
      }

      // Limpiar selección del formulario
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
    return (
      <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={`${styles.container} container`}>
      {/* Cabecera */}
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>
          <span className={styles.headerHighlight}>Nueva</span> Inscripción
        </h1>
        <Link href="/" className={styles.btnBack}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver
        </Link>
      </header>

      {/* Alertas */}
      {errorMsg && <div className={styles.error}>{errorMsg}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      {/* Grid de Contenido */}
      <div className={styles.layoutGrid}>
        {/* Columna Izquierda: Formulario */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle} style={{ borderBottom: 'none', marginBottom: '1rem', paddingBottom: 0 }}>
            Registrar Inscripción
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Torneo Oficial</label>
              <select
                className={styles.select}
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

            <div className={styles.formGroup}>
              <label className={styles.label}>Equipo Participante</label>
              <select
                className={styles.select}
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

            <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Inscribiendo...' : 'Inscribir Equipo'}
            </button>
          </form>
        </section>

        {/* Columna Derecha: Listado actual */}
        <section className={styles.card}>
          <div className={styles.cardTitle}>
            <span>Equipos Inscritos</span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                className={styles.select}
                value={filterTournamentId}
                onChange={handleFilterChange}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', width: 'auto' }}
              >
                <option value="">-- Filtrar por Torneo --</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              
              <button 
                onClick={() => loadEnrollments(filterTournamentId)} 
                className={styles.btnRefresh}
                disabled={isLoadingEnrollments || !filterTournamentId}
              >
                Actualizar
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            {isLoadingEnrollments ? (
              <div className={styles.spinner} />
            ) : !filterTournamentId ? (
              <div className={styles.emptyState}>
                Selecciona un torneo oficial en el filtro para visualizar las inscripciones.
              </div>
            ) : enrollments.length === 0 ? (
              <div className={styles.emptyState}>
                No hay equipos inscritos en este torneo.
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Equipo</th>
                    <th className={styles.th}>Torneo</th>
                    <th className={styles.th}>Categoría</th>
                    <th className={styles.th}>Rama</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e) => (
                    <tr key={e.id} className={styles.tr}>
                      <td className={styles.td}>{e.team_name}</td>
                      <td className={styles.td}>{e.tournament_name}</td>
                      <td className={styles.td}>{e.category}</td>
                      <td className={styles.td} style={{ textTransform: 'uppercase' }}>{e.branch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
