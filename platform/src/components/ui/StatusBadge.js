import styles from './StatusBadge.module.css';

const STATUS_VARIANT = {
  PREPARATION: 'neutral',
  IN_PROGRESS: 'accent',
  FINISHED: 'success',
  CANCELLED: 'danger',
  SCHEDULED: 'primary',
  SUSPENDED: 'warning',
  PENDING: 'warning',
  ACTIVE: 'success',
  INACTIVE: 'neutral',
};

export default function StatusBadge({ status, label, variant, children }) {
  const resolvedVariant =
    variant || STATUS_VARIANT[status] || 'neutral';
  const text = children || label || status || '';

  return (
    <span className={`${styles.badge} ${styles[resolvedVariant] || styles.neutral}`}>
      {text}
    </span>
  );
}
