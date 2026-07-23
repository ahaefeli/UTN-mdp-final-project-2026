import StatusBadge from './StatusBadge';
import styles from './MatchRow.module.css';

function formatTime(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(value);
  }
}

export default function MatchRow({
  time,
  date,
  homeTeam,
  awayTeam,
  venue,
  status,
  statusLabel,
  score,
  actions,
  onClick,
  className = '',
}) {
  const timeLabel = time || formatTime(date);
  const clickable = Boolean(onClick);

  return (
    <div
      className={`${styles.row} ${clickable ? styles.rowClickable : ''} ${className}`.trim()}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(e);
              }
            }
          : undefined
      }
    >
      <div className={styles.time}>{timeLabel}</div>
      <div className={styles.teams}>
        <div className={styles.matchup}>
          {homeTeam || 'Local'} vs {awayTeam || 'Visitante'}
        </div>
        <div className={styles.meta}>
          {venue ? <span>{venue}</span> : null}
          {venue && score ? <span> · </span> : null}
          {score ? <span className={styles.score}>{score}</span> : null}
        </div>
      </div>
      <div className={styles.statusCol}>
        {status || statusLabel ? (
          <StatusBadge status={status} label={statusLabel}>
            {statusLabel}
          </StatusBadge>
        ) : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
