import styles from './PageHeader.module.css';

export default function PageHeader({ title, highlight, subtitle, actions, children }) {
  return (
    <header className={styles.header}>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>
          {highlight ? (
            <>
              {title} <span className={styles.highlight}>{highlight}</span>
            </>
          ) : (
            title
          )}
        </h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        {children}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
