'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function TournamentDetailPage() {
  const { id } = useParams(); // tournament UUID
  const router = useRouter();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('lnv_token') : '';
        if (!token) {
          router.push('/login');
          return;
        }
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        const [tRes, mRes] = await Promise.all([
          fetch(`${baseUrl}/internal/torneos/${id}/`, { headers }),
          fetch(`${baseUrl}/internal/torneos/partidos/?tournament_id=${id}`, { headers }),
        ]);
        if (!tRes.ok || !mRes.ok) {
          throw new Error('Failed to fetch data');
        }
        const tData = await tRes.json();
        const mData = await mRes.json();
        setTournament(tData.data);
        setMatches(mData.data);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError(e.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonList}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className={styles.container}>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <Link href="/torneos" className={styles.backButton}>← Volver a torneos</Link>
      
      <header className={styles.header}>
        <h1 className={styles.title}>{tournament?.name}</h1>
        <div className={styles.metaInfo}>
          <p><strong>Categoría:</strong> {tournament?.category}</p>
          <p><strong>Estado:</strong> {tournament?.status}</p>
          <p><strong>Fechas:</strong> {tournament?.start_date} - {tournament?.end_date}</p>
        </div>
      </header>

      <section className={styles.matchesSection}>
        <h2 className={styles.sectionTitle}>Partidos</h2>
        {matches.length === 0 ? (
          <p className={styles.noMatches}>No hay partidos registrados para este torneo.</p>
        ) : (
          <div className={styles.matchesGrid}>
            {matches && matches.length > 0 && matches.map((match) => (
              <div key={match.id} className={styles.matchCard}>
                <div className={styles.teams}>
                  <span className={styles.teamName}>{match.local_team_name}</span>
                  <span className={styles.vs}>vs</span>
                  <span className={styles.teamName}>{match.visitor_team_name}</span>
                </div>
                <div className={styles.score}>
                  {match.score_summary || 'Pendiente'}
                </div>
                <div className={styles.statusBadge}>
                  {match.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
