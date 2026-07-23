import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, CheckCircle, ClipboardList } from 'lucide-react';
import styles from './PendingAlerts.module.css';

const ALERT_ROUTES = {
  NEW_AFFILIATION: '/clubes',
  MATCH_NEEDS_SCORE: '/torneos',
};

export default function PendingAlerts({ alerts = [], onMatchAction }) {
  const router = useRouter();

  if (!alerts.length) {
    return (
      <div className={styles.container}>
        <h3 className={styles.sectionTitle}>Acciones Pendientes</h3>
        <div className={styles.emptyState}>
          <CheckCircle className={styles.emptyIcon} size={36} />
          <p className={styles.emptyText}>Estás al día. No hay alertas pendientes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>Acciones Pendientes</h3>
      <div className={styles.alertList}>
        {alerts.map((alert) => {
          const isMatch = alert.type === 'MATCH_NEEDS_SCORE';
          return (
            <div key={alert.id} className={styles.alertBanner}>
              <div className={styles.leftSection}>
                <div className={styles.iconContainer}>
                  {isMatch ? <ClipboardList size={20} /> : <AlertTriangle size={20} />}
                </div>
                <span className={styles.message}>{alert.message}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isMatch && alert.match && onMatchAction) {
                    onMatchAction(alert.match);
                    return;
                  }
                  router.push(alert.href || ALERT_ROUTES[alert.type] || '/');
                }}
                className={styles.actionButton}
              >
                <span>{isMatch ? 'Cargar resultado' : 'Ver Solicitud'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
