'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { ROLE_TRANSLATIONS } from '../../utils/roles';
import { Alert, Button, Modal } from '../ui';
import styles from './PendingInvites.module.css';

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatWhen(value) {
  const date = parseDate(value);
  if (!date) return 'sin fecha';
  return date.toLocaleString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function relativeWhen(value) {
  const date = parseDate(value);
  if (!date) return '';
  const elapsed = Date.now() - date.getTime();
  const abs = Math.abs(elapsed);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const lead = elapsed < 0 ? 'En' : 'Hace';

  if (abs < minute) return 'Hace un momento';

  const [amount, singular, plural] = abs < hour
    ? [Math.max(1, Math.round(abs / minute)), 'minuto', 'minutos']
    : abs < day
      ? [Math.max(1, Math.round(abs / hour)), 'hora', 'horas']
      : [Math.max(1, Math.round(abs / day)), 'día', 'días'];

  return `${lead} ${amount} ${amount === 1 ? singular : plural}`;
}

function isExpired(link) {
  if (!link?.expires_at) return false;
  const date = new Date(link.expires_at);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
}

export default function PendingInvites({ role, refreshKey = 0 }) {
  const [links, setLinks] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [revokeTarget, setRevokeTarget] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await apiClient.get('admin/club-requests/', {
          params: { unused: '1', role, page: 1 },
        });
        if (active) {
          setLinks((res.data?.data || []).filter((link) => !isExpired(link)));
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

  const revoke = async () => {
    if (!revokeTarget) return;
    const id = revokeTarget.id;
    setBusyId(id);
    setError('');
    try {
      await apiClient.post(`admin/club-requests/${id}/review/`, { action: 'REJECT' });
      setLinks((current) => current.filter((link) => link.id !== id));
      setRevokeTarget(null);
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
        {links.map((link) => {
          const tokenTail = String(link.token || '').slice(-6);
          const ago = relativeWhen(link.created_at);
          return (
            <li key={link.id} className={styles.item}>
              <div className={styles.identity}>
                <p className={styles.who}>{link.recipient_label || ROLE_TRANSLATIONS[link.role] || role}</p>
                <p className={styles.when}>
                  <time dateTime={link.created_at || undefined}>{formatWhen(link.created_at)}</time>
                  {ago ? <span className={styles.ago}>{ago}</span> : null}
                </p>
                {tokenTail ? <p className={styles.token}>Termina en {tokenTail}</p> : null}
              </div>
              <Button size="sm" variant="secondary" disabled={busyId === link.id} onClick={() => setRevokeTarget(link)}>
                Revocar
              </Button>
            </li>
          );
        })}
      </ul>
      <Modal
        open={Boolean(revokeTarget)}
        stacked
        onClose={() => !busyId && setRevokeTarget(null)}
        title="Revocar enlace"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRevokeTarget(null)} disabled={Boolean(busyId)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={revoke} disabled={Boolean(busyId)}>
              {busyId ? 'Revocando...' : 'Revocar'}
            </Button>
          </>
        }
      >
        <p>
          {revokeTarget?.recipient_label
            ? `El enlace para ${revokeTarget.recipient_label} deja de servir.`
            : 'El enlace deja de servir. Quien lo tenga abierto no va a poder completar la solicitud.'}
        </p>
      </Modal>
    </section>
  );
}
