import styles from './Modal.module.css';

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  showClose = true,
}) {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={`${styles.modal} ${size !== 'md' ? styles[size] : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        {(title || showClose) && (
          <div className={styles.header}>
            <div>
              {title ? <h2 className={styles.title}>{title}</h2> : null}
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
            {showClose ? (
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
                <i className="bi bi-x-lg"></i>
              </button>
            ) : null}
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>
  );
}
