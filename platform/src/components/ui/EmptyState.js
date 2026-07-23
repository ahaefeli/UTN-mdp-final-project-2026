import styles from './EmptyState.module.css';

export default function EmptyState({ icon = 'bi-inbox', title, description, children }) {
  return (
    <div className={styles.empty}>
      {icon ? <i className={`bi ${icon} ${styles.icon}`} aria-hidden="true"></i> : null}
      {title ? <p className={styles.title}>{title}</p> : null}
      {description ? <p className={styles.description}>{description}</p> : null}
      {children}
    </div>
  );
}
