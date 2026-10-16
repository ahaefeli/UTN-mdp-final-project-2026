'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { Alert, Button } from '../ui';
import styles from './PendingInvites.module.css';

function formatExpiry(value) {
  if (!value) return 'sin vencimiento';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'sin vencimiento';
  return date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function PendingInvites({ role, refreshKey = 0 }) {
  const [links, setLinks] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await apiClient.get('admin/club-requests/', {
          params: { unused: '1', role, page: 1 },
        });
        if (active) {
          setLinks(res.data?.data || []);
          setError('');
        }
      } catch (err) {
        if (active) setError('No se pudieron cargar los enlaces de invitación.');
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [role, refreshKey]);

  const revoke = async (id) => {
    setBusyId(id);
    setError('');
    try {
      await apiClient.post(`admin/club-requests/${id}/review/`, { action: 'REJECT' });
      setLinks((current) => current.filter((link) => link.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo revocar el enlace.');
    } finally {
      setBusyId(null);
    }
  };

  if (!error && links.length === 0) return null;

  return (
    <section className={styles.panel}>
      <h3 className={styles.title}>Enlaces sin usar</h3>
      <p className={styles.note}>Cada enlace sirve una sola vez y vence a las 48 horas. Revocar lo deja inservible.</p>
      {error ? <Alert variant="error">{error}</Alert> : null}
      <ul className={styles.list}>
        {links.map((link) => (
          <li key={link.id} className={styles.item}>
            <span>Vence {formatExpiry(link.expires_at)}</span>
            <Button size="sm" variant="secondary" disabled={busyId === link.id} onClick={() => revoke(link.id)}>
              {busyId === link.id ? 'Revocando...' : 'Revocar'}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
