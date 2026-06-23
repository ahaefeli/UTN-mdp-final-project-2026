'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import tournamentService from '../../services/tournamentService';
import { STATUS_TRANSLATIONS } from '../../utils/status';
import styles from './page.module.css';

// Diccionarios de traducción para la interfaz
const BRANCH_TRANSLATIONS = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
  MIXED: 'Mixto'
};

const CATEGORY_TRANSLATIONS = {
  PRIMERA: 'Primera División',
  'SUB-18': 'Sub-18',
  'SUB-16': 'Sub-16',
  'SUB-14': 'Sub-14'
};

export default function TorneosDashboardPage() {
  const router = useRouter();
  const { role, isAuthenticated, isInitialized } = useAuth();

  const [activeTournament, setActiveTournament] = useState(null);
  const [finishedTournaments, setFinishedTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirección de seguridad RBAC si no es ADMIN
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [isInitialized, isAuthenticated, role, router]);

  // Carga de torneos al montarse la vista
  useEffect(() => {
    if (isAuthenticated && role === 'ADMIN') {
      const loadTournaments = async () => {
        try {
          setIsLoading(true);
          setError('');
          const res = await tournamentService.getTournaments();
          const list = res.data || [];

          // Torneo Activo: status PREPARATION o IN_PROGRESS
          const active = list.find(t => t.status === 'PREPARATION' || t.status === 'IN_PROGRESS');
          setActiveTournament(active || null);

          // Historial de Torneos: status FINISHED
          const finished = list.filter(t => t.status === 'FINISHED');
          setFinishedTournaments(finished);
        } catch (err) {
          console.error('Error al cargar torneos:', err);
          setError('Ocurrió un error al obtener el listado de torneos. Por favor, intente nuevamente.');
        } finally {
          setIsLoading(false);
        }
      };
      loadTournaments();
    }
  }, [isAuthenticated, role]);

  // Si no está inicializado o no tiene permisos, mostrar loader inicial
  if (!isInitialized || !isAuthenticated || role !== 'ADMIN') {
    return (
      <div className={styles.loadingSpinner} style={{ minHeight: '100vh' }}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const isNewButtonDisabled = !!activeTournament;

  return (
    <div className={styles.container}>
      {/* Header con Control del Botón Nuevo */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Panel de Torneos</h1>
          <p className={styles.subtitle}>Gestione los torneos de la organización y configure las jornadas correspondientes.</p>
        </div>
        <div>
          {isNewButtonDisabled ? (
            <button 
              className={`${styles.btnNew} ${styles.btnNewDisabled}`} 
              disabled 
              title="Ya existe un torneo activo para la organización. Debe finalizarlo antes de crear uno nuevo."
            >
              <i className="bi bi-lock-fill" style={{ marginRight: '0.25rem' }}></i>
              + Nuevo Torneo
            </button>
          ) : (
            <Link href="/torneos/nuevo" className={`${styles.btnNew} ${styles.btnNewActive}`}>
              <i className="bi bi-plus-circle-fill" style={{ marginRight: '0.25rem' }}></i>
              + Nuevo Torneo
            </Link>
          )}
        </div>
      </header>

      {/* Alerta de Error */}
      {error && <div className={styles.errorAlert}>{error}</div>}

      {isLoading ? (
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner} />
          <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Cargando torneos...</p>
        </div>
      ) : (
        <>
          {/* Sección de Torneo Activo */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="bi bi-play-circle-fill" style={{ color: '#002F87' }}></i>
              Torneo Activo
            </h2>

            {activeTournament ? (
              <div className={styles.activeCard}>
                <div className={styles.activeCardMain}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className={styles.activeTitle}>{activeTournament.name}</h3>
                    <span className={`${styles.badge} ${activeTournament.status === 'PREPARATION' ? styles.badgePrep : styles.badgeProgress}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" style={{ marginRight: '0.35rem', display: 'inline-block' }}></span>
                      {STATUS_TRANSLATIONS[activeTournament.status]}
                    </span>
                  </div>

                  <div className={styles.activeCardMeta}>
                    <div className={styles.metaItem}>
                      <i className="bi bi-calendar3"></i>
                      <span>Año: {activeTournament.year}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <i className="bi bi-tag-fill"></i>
                      <span>Categoría: {CATEGORY_TRANSLATIONS[activeTournament.category] || activeTournament.category}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <i className="bi bi-gender-ambiguous"></i>
                      <span>Rama: {BRANCH_TRANSLATIONS[activeTournament.branch] || activeTournament.branch}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Link href={`/torneos/${activeTournament.id}`} className={styles.manageLink}>
                    <i className="bi bi-gear-fill"></i>
                    Gestionar Torneo
                  </Link>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <i className={`bi bi-trophy ${styles.emptyStateIcon}`}></i>
                <p className={styles.emptyStateText}>No hay ningún torneo activo actualmente</p>
                <p className={styles.emptyStateSubtext}>Para iniciar una nueva temporada, haga clic en el botón "+ Nuevo Torneo" en la parte superior.</p>
              </div>
            )}
          </section>

          {/* Sección de Historial de Torneos */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <i className="bi bi-archive-fill" style={{ color: '#475569' }}></i>
              Historial de Torneos
            </h2>

            {finishedTournaments.length > 0 ? (
              <div className={styles.historyGrid}>
                {finishedTournaments.map(t => (
                  <div key={t.id} className={styles.historyCard}>
                    <div>
                      <div className={styles.historyCardHeader}>
                        <h3 className={styles.historyCardTitle}>{t.name}</h3>
                        <span className={`${styles.badge} ${styles.badgeFinished}`}>
                          {STATUS_TRANSLATIONS[t.status]}
                        </span>
                      </div>

                      <div className={styles.historyCardBody}>
                        <div className={styles.metaItem} style={{ fontSize: '0.8125rem' }}>
                          <i className="bi bi-calendar3"></i>
                          <span>Año: {t.year}</span>
                        </div>
                        <div className={styles.metaItem} style={{ fontSize: '0.8125rem' }}>
                          <i className="bi bi-tag-fill"></i>
                          <span>Categoría: {CATEGORY_TRANSLATIONS[t.category] || t.category}</span>
                        </div>
                        <div className={styles.metaItem} style={{ fontSize: '0.8125rem' }}>
                          <i className="bi bi-gender-ambiguous"></i>
                          <span>Rama: {BRANCH_TRANSLATIONS[t.branch] || t.branch}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.historyCardFooter}>
                      <Link href={`/torneos/${t.id}`} className={styles.viewDetailLink}>
                        Ver estadísticas/fechas
                        <i className="bi bi-arrow-right-short" style={{ fontSize: '1.2rem' }}></i>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <i className={`bi bi-folder-x ${styles.emptyStateIcon}`}></i>
                <p className={styles.emptyStateText}>No hay torneos finalizados en el historial</p>
                <p className={styles.emptyStateSubtext}>Los torneos completados se archivarán y listarán en esta sección.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
