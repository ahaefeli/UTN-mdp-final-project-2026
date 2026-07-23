'use client';

import React, { useState, useEffect } from 'react';
import matchService from '../../services/matchService';
import styles from './ScoreSheetModal.module.css';

const emptySet = () => ({ local_points: '', visitor_points: '' });

function validateClientSets(sets) {
  if (sets.length < 3 || sets.length > 5) {
    return 'Un partido se cierra con 3, 4 o 5 sets.';
  }

  let localWins = 0;
  let visitorWins = 0;

  for (let i = 0; i < sets.length; i++) {
    const lp = Number(sets[i].local_points);
    const vp = Number(sets[i].visitor_points);
    if (!Number.isFinite(lp) || !Number.isFinite(vp) || sets[i].local_points === '' || sets[i].visitor_points === '') {
      return `Completá los puntos del set ${i + 1}.`;
    }
    if (lp < 0 || vp < 0) {
      return `Los puntos del set ${i + 1} no pueden ser negativos.`;
    }
    if (lp === vp) {
      return `El set ${i + 1} no puede empatar.`;
    }
    if (lp > vp) localWins += 1;
    else visitorWins += 1;

    if ((localWins >= 3 || visitorWins >= 3) && i < sets.length - 1) {
      return 'Hay sets de más: el partido ya tenía un ganador.';
    }
  }

  if (localWins === visitorWins) {
    return 'El partido no puede terminar empatado.';
  }
  if (Math.max(localWins, visitorWins) !== 3) {
    return 'El ganador debe ganar exactamente 3 sets (mejor de 5).';
  }
  return null;
}

export default function ScoreSheetModal({ match, onClose, onSuccess }) {
  const [sets, setSets] = useState([emptySet(), emptySet(), emptySet()]);
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

  const updateSet = (index, field, value) => {
    setSets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setError('');
  };

  const addSet = () => {
    if (sets.length >= 5) return;
    setSets((prev) => [...prev, emptySet()]);
    setError('');
  };

  const removeSet = (index) => {
    if (sets.length <= 3) return;
    setSets((prev) => prev.filter((_, i) => i !== index));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientError = validateClientSets(sets);
    if (clientError) {
      setError(clientError);
      return;
    }

    const scores = sets.map((s, i) => ({
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
              Planilla de sets
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

        <form onSubmit={handleSubmit}>
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
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={set.local_points}
                  onChange={(e) => updateSet(index, 'local_points', e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={set.visitor_points}
                  onChange={(e) => updateSet(index, 'visitor_points', e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeSet(index)}
                  disabled={isSubmitting || sets.length <= 3}
                  aria-label={`Quitar set ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}

            <p className={styles.hint}>Mejor de 5: el ganador debe llegar a 3 sets.</p>

            {error && <div className={styles.error}>{error}</div>}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.addSetBtn}
              onClick={addSet}
              disabled={isSubmitting || sets.length >= 5}
            >
              + Agregar set
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Publicando...' : 'Publicar resultado'}
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
