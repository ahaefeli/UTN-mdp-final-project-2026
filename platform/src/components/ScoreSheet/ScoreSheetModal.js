'use client';

import React, { useState, useEffect } from 'react';
import matchService from '../../services/matchService';
import styles from './ScoreSheetModal.module.css';

const emptySet = () => ({ local_points: '', visitor_points: '' });

function setsFromMatch(match) {
  const bestOf = match?.best_of || 5;
  const setsToWin = Math.floor(bestOf / 2) + 1;
  const existing = match?.sets_data?.sets;
  if (!Array.isArray(existing) || existing.length < setsToWin) {
    return Array.from({ length: setsToWin }, () => emptySet());
  }
  return existing.slice(0, bestOf).map((set) => ({
    local_points: String(set.local_points ?? set.local_score ?? '').replace(/\D/g, ''),
    visitor_points: String(set.visitor_points ?? set.visitor_score ?? '').replace(/\D/g, ''),
  }));
}

function digitsOnly(value) {
  return String(value).replace(/\D/g, '');
}

function isBlank(value) {
  return String(value).trim() === '';
}

function withoutTrailingEmptySets(sets, minSets = 3) {
  const next = sets.map((set) => ({ ...set }));
  while (next.length > minSets) {
    const last = next[next.length - 1];
    if (isBlank(last.local_points) && isBlank(last.visitor_points)) {
      next.pop();
    } else {
      break;
    }
  }
  return next;
}

function validateClientSets(sets, bestOf = 5) {
  const setsToWin = Math.floor(bestOf / 2) + 1;
  if (sets.length < setsToWin || sets.length > bestOf) {
    return `Un partido al mejor de ${bestOf} se cierra con entre ${setsToWin} y ${bestOf} sets.`;
  }

  let localWins = 0;
  let visitorWins = 0;

  for (let i = 0; i < sets.length; i++) {
    const localBlank = isBlank(sets[i].local_points);
    const visitorBlank = isBlank(sets[i].visitor_points);
    if (localBlank || visitorBlank) {
      return `Completá los puntos del set ${i + 1}.`;
    }
    const lp = Number(sets[i].local_points);
    const vp = Number(sets[i].visitor_points);
    if (!Number.isFinite(lp) || !Number.isFinite(vp)) {
      return `Completá los puntos del set ${i + 1}.`;
    }
    if (lp < 0 || vp < 0) {
      return `Los puntos del set ${i + 1} no pueden ser negativos.`;
    }
    if (lp === vp) {
      return `El set ${i + 1} no puede empatar.`;
    }
    const target = (i === bestOf - 1) ? 15 : 25;
    const winner = Math.max(lp, vp);
    const loser = Math.min(lp, vp);
    const legalOvertime = winner > target && winner - loser === 2 && loser >= target - 1;
    if (winner < target || winner - loser < 2) {
      return `El set ${i + 1} se juega a ${target} y debe ganarse por 2 puntos.`;
    }
    if (winner > target && !legalOvertime) {
      return `El set ${i + 1} ya habría terminado antes de ese marcador. Si se pasa de ${target}, tiene que ser por diferencia de 2.`;
    }
    if (lp > vp) localWins += 1;
    else visitorWins += 1;

    if ((localWins >= setsToWin || visitorWins >= setsToWin) && i < sets.length - 1) {
      return 'Hay sets de más: el partido ya tenía un ganador.';
    }
  }

  if (localWins === visitorWins) {
    return 'El partido no puede terminar empatado.';
  }
  if (Math.max(localWins, visitorWins) !== setsToWin) {
    return `El ganador debe ganar exactamente ${setsToWin} sets (mejor de ${bestOf}).`;
  }
  return null;
}

export default function ScoreSheetModal({ match, onClose, onSuccess }) {
  const bestOf = match?.best_of || 5;
  const setsToWin = Math.floor(bestOf / 2) + 1;
  const hasSavedSets = Array.isArray(match?.sets_data?.sets) && match.sets_data.sets.length > 0;
  const [sets, setSets] = useState(() => setsFromMatch(match));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSubmitting, onClose]);

  if (!match) return null;

  const localName = match.local_team_name || 'Local';
  const visitorName = match.visitor_team_name || 'Visitante';
  const submitLabel = 'Guardar resultado';

  const updateSet = (index, field, value) => {
    setSets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: digitsOnly(value) };
      return next;
    });
    setError('');
  };

  const addSet = () => {
    if (sets.length >= bestOf) return;
    setSets((prev) => [...prev, emptySet()]);
    setError('');
  };

  const removeSet = (index) => {
    if (sets.length <= setsToWin) return;
    setSets((prev) => prev.filter((_, i) => i !== index));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const setsToSave = withoutTrailingEmptySets(sets, setsToWin);
    const clientError = validateClientSets(setsToSave, bestOf);
    if (clientError) {
      setError(clientError);
      return;
    }

    const scores = setsToSave.map((s, i) => ({
      set_number: i + 1,
      local_points: Number(s.local_points),
      visitor_points: Number(s.visitor_points),
    }));

    setIsSubmitting(true);
    setError('');
    try {
      await matchService.finishMatch(match.id, scores);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      const apiError =
        err?.response?.data?.error ||
        err?.message ||
        'No se pudo publicar el resultado.';
      setError(apiError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={() => !isSubmitting && onClose?.()} role="presentation">
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scoresheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h2 id="scoresheet-title" className={styles.title}>
              {hasSavedSets ? 'Editar resultado' : 'Cargar resultado'}
            </h2>
            <p className={styles.subtitle}>
              {localName} vs {visitorName}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => !isSubmitting && onClose?.()}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.body}>
            <div className={styles.columnLabels}>
              <span>Set</span>
              <span>{localName}</span>
              <span>{visitorName}</span>
            </div>

            {sets.map((set, index) => (
              <div key={index} className={styles.setRow}>
                <span className={styles.setLabel}>Set {index + 1}</span>
                <input
                  className={styles.input}
                  type="text"
                  inputMode="numeric"
                  value={set.local_points}
                  onChange={(e) => updateSet(index, 'local_points', e.target.value)}
                  disabled={isSubmitting}
                  aria-label={`Puntos de ${localName} en el set ${index + 1}`}
                />
                <input
                  className={styles.input}
                  type="text"
                  inputMode="numeric"
                  value={set.visitor_points}
                  onChange={(e) => updateSet(index, 'visitor_points', e.target.value)}
                  disabled={isSubmitting}
                  aria-label={`Puntos de ${visitorName} en el set ${index + 1}`}
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeSet(index)}
                  disabled={isSubmitting || sets.length <= setsToWin}
                  aria-label={`Quitar set ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}

            <p className={styles.hint}>
              Mejor de {bestOf}. Los sets 1 a {bestOf - 1} son a 25 y el {bestOf}º a 15, siempre con diferencia de 2.
            </p>

            {error && <div className={styles.error}>{error}</div>}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.addSetBtn}
              onClick={addSet}
              disabled={isSubmitting || sets.length >= bestOf}
            >
              + Agregar set
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : submitLabel}
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => !isSubmitting && onClose?.()}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
