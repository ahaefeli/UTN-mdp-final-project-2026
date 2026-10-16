'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import tournamentService from '../../services/tournamentService';
import { STATUS_TRANSLATIONS } from '../../utils/status';
import { formatBranch, formatCategory } from '../../utils/labels';
import {
  PageHeader,
  Button,
  Alert,
  LoadingState,
  EmptyState,
  StatusBadge,
} from '../../components/ui';
import chromeStyles from '../../components/ui/PageChrome.module.css';
import styles from './page.module.css';

function TournamentCards({ tournaments }) {
  return (
    <div className={styles.cardList}>
      {tournaments.map((tournament) => (
        <Link
          key={tournament.id}
          href={`/torneos/${tournament.id}`}
          className={styles.tournamentCard}
        >
          <div className={styles.cardMain}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{tournament.name}</h3>
              <StatusBadge status={tournament.status}>
                {STATUS_TRANSLATIONS[tournament.status]}
              </StatusBadge>
            </div>
            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <i className="bi bi-calendar3" aria-hidden="true" />
                <span>Año: {tournament.year}</span>
              </div>
              <div className={styles.metaItem}>
                <i className="bi bi-tag-fill" aria-hidden="true" />
                <span>Categoría: {formatCategory(tournament.category)}</span>
              </div>
              <div className={styles.metaItem}>
                <i className="bi bi-gender-ambiguous" aria-hidden="true" />
                <span>Rama: {formatBranch(tournament.branch)}</span>
              </div>
            </div>
          </div>
          <span className={styles.cardAction} aria-hidden="true">
            <i className="bi bi-gear-fill" />
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function TorneosDashboardPage() {
  const router = useRouter();
  const { role, isAuthenticated, isInitialized } = useAuth();

  const [liveTournaments, setLiveTournaments] = useState([]);
  const [preparationTournaments, setPreparationTournaments] = useState([]);
  const [pendingTournaments, setPendingTournaments] = useState([]);
  const [finishedTournaments, setFinishedTournaments] = useState([]);
  const [archivedTournaments, setArchivedTournaments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
    if (isAuthenticated && role === 'ADMIN') {
      const loadTournaments = async () => {
        try {
          setIsLoading(true);
          setError('');
          const [res, archivedRes] = await Promise.all([
            tournamentService.getTournaments(),
            tournamentService.getTournaments({ archived: '1' }),
          ]);
          const list = res.data || [];
          setArchivedTournaments(archivedRes.data || []);

          setLiveTournaments(list.filter((t) => t.status === 'IN_PROGRESS'));
          setPreparationTournaments(list.filter((t) => t.status === 'PREPARATION'));
          setPendingTournaments(list.filter((t) => t.status === 'PENDING'));

          const finished = list.filter((t) => t.status === 'FINISHED');
          setFinishedTournaments(finished);
        } catch (err) {
          console.error('Error al cargar torneos:', err);
          setError(
            'Ocurrió un error al obtener el listado de torneos. Por favor, intente nuevamente.'
          );
        } finally {
          setIsLoading(false);
        }
      };
      loadTournaments();
    }
  }, [isAuthenticated, role]);

  if (!isInitialized || !isAuthenticated || role !== 'ADMIN') {
    return <LoadingState full />;
  }

  return (
    <div className="appShell">
      <div className={chromeStyles.page}>
        <PageHeader
          title="Panel de Torneos"
          subtitle="Puede haber un torneo vigente por categoría y rama. En disputa se está jugando; en preparación todavía se arma."
          actions={
            <Button onClick={() => router.push('/torneos/nuevo')}>
              <i className="bi bi-plus-circle-fill" aria-hidden="true" />
              Nuevo Torneo
            </Button>
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

        {isLoading ? (
          <LoadingState label="Cargando torneos..." />
        ) : (
          <>
            <section className={chromeStyles.section}>
              <h2 className={chromeStyles.sectionTitle}>
                <i className="bi bi-play-circle-fill" aria-hidden="true" />
                En disputa
              </h2>

              {liveTournaments.length > 0 ? (
                <TournamentCards tournaments={liveTournaments} />
              ) : (
                <EmptyState
                  icon="bi-trophy"
                  title="No hay torneos en disputa"
                  description="Cuando un torneo en preparación empieza a jugarse, pasa a en disputa."
                />
              )}
            </section>

            <section className={chromeStyles.section}>
              <h2 className={chromeStyles.sectionTitle}>
                <i className="bi bi-pencil-square" aria-hidden="true" />
                En preparación
              </h2>

              {preparationTournaments.length > 0 ? (
                <TournamentCards tournaments={preparationTournaments} />
              ) : (
                <EmptyState
                  icon="bi-calendar-plus"
                  title="No hay torneos en preparación"
                  description='Para armar una competencia, usá "Nuevo Torneo".'
                />
              )}
            </section>

            <section className={chromeStyles.section}>
              <h2 className={chromeStyles.sectionTitle}>
                <i className="bi bi-hourglass-split" aria-hidden="true" />
                Torneos pendientes
              </h2>

              {pendingTournaments.length > 0 ? (
                <div className={styles.cardList}>
                  {pendingTournaments.map((tournament) => (
                    <Link
                      key={tournament.id}
                      href={`/torneos/${tournament.id}`}
                      className={styles.tournamentCard}
                    >
                      <div className={styles.cardMain}>
                        <div className={styles.cardHeader}>
                          <h3 className={styles.cardTitle}>{tournament.name}</h3>
                          <StatusBadge status={tournament.status}>
                            {STATUS_TRANSLATIONS[tournament.status]}
                          </StatusBadge>
                        </div>

                        <div className={styles.cardMeta}>
                          <div className={styles.metaItem}>
                            <i className="bi bi-calendar3" aria-hidden="true" />
                            <span>Año: {tournament.year}</span>
                          </div>
                          <div className={styles.metaItem}>
                            <i className="bi bi-tag-fill" aria-hidden="true" />
                            <span>
                              Categoría:{' '}
                              {formatCategory(tournament.category)}
                            </span>
                          </div>
                          <div className={styles.metaItem}>
                            <i className="bi bi-gender-ambiguous" aria-hidden="true" />
                            <span>
                              Rama: {formatBranch(tournament.branch)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className={styles.cardAction} aria-hidden="true">
                        <i className="bi bi-gear-fill" />
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="bi-hourglass"
                  title="No hay torneos pendientes"
                  description="Si creás un torneo mientras hay otro vigente de la misma categoría y rama, queda pendiente hasta que lo pases a preparación."
                />
              )}
            </section>

            <section className={chromeStyles.section}>
              <h2 className={chromeStyles.sectionTitle}>
                <i className="bi bi-archive-fill" aria-hidden="true" />
                Historial de Torneos
              </h2>

              {finishedTournaments.length > 0 ? (
                <div className={styles.historyGrid}>
                  {finishedTournaments.map((t) => (
                    <Link key={t.id} href={`/torneos/${t.id}`} className={styles.historyCard}>
                      <div className={styles.historyCardHeader}>
                        <h3 className={styles.cardTitle}>{t.name}</h3>
                        <StatusBadge status={t.status}>{STATUS_TRANSLATIONS[t.status]}</StatusBadge>
                      </div>

                      <div className={styles.cardMeta}>
                        <div className={styles.metaItem}>
                          <i className="bi bi-calendar3" aria-hidden="true" />
                          <span>Año: {t.year}</span>
                        </div>
                        <div className={styles.metaItem}>
                          <i className="bi bi-tag-fill" aria-hidden="true" />
                          <span>
                            Categoría: {formatCategory(t.category)}
                          </span>
                        </div>
                        <div className={styles.metaItem}>
                          <i className="bi bi-gender-ambiguous" aria-hidden="true" />
                          <span>Rama: {formatBranch(t.branch)}</span>
                        </div>
                      </div>

                      <div className={styles.historyCardFooter}>
                        <span className={styles.viewDetail}>
                          Ver estadísticas/fechas
                          <i className="bi bi-arrow-right-short" aria-hidden="true" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="bi-folder-x"
                  title="No hay torneos finalizados en el historial"
                  description="Cuando un torneo se marca como finalizado, queda en esta sección."
                />
              )}
            </section>

            <section className={chromeStyles.section}>
              <h2 className={chromeStyles.sectionTitle}>
                <i className="bi bi-archive" aria-hidden="true" />
                Archivados
              </h2>
              {archivedTournaments.length > 0 ? (
                <TournamentCards tournaments={archivedTournaments} />
              ) : (
                <EmptyState
                  icon="bi-archive"
                  title="No hay torneos archivados"
                  description="Archivar oculta el torneo de las listas y del sitio público. Se puede restaurar desde su ficha."
                />
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
