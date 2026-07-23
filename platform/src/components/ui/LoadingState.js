import styles from './LoadingState.module.css';

export default function LoadingState({ label = 'Cargando…', full = false }) {
  return (
    <div className={`${styles.wrap} ${full ? styles.full : ''}`}>
      <div className={styles.spinner} aria-hidden="true" />
      {label ? <p className={styles.label}>{label}</p> : null}
    </div>
  );
}
