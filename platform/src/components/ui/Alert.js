import styles from './Alert.module.css';

export default function Alert({ variant = 'info', children, className = '' }) {
  return (
    <div className={`${styles.alert} ${styles[variant] || styles.info} ${className}`.trim()} role="alert">
      {children}
    </div>
  );
}
