import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import styles from './PendingAlerts.module.css';

export default function PendingAlerts({ alerts = [] }) {
  const router = useRouter();

  // Filtrar las alertas por tipo NEW_AFFILIATION
  const affiliationAlerts = alerts.filter(alert => alert.type === 'NEW_AFFILIATION');

  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>Acciones Pendientes</h3>
      {affiliationAlerts.length === 0 ? (
        <div className={styles.emptyState}>
          <CheckCircle className={styles.emptyIcon} size={36} />
          <p className={styles.emptyText}>Estás al día. No hay alertas pendientes.</p>
        </div>
      ) : (
        <div className={styles.alertList}>
          {affiliationAlerts.map((alert) => (
            <div key={alert.id} className={styles.alertBanner}>
              <div className={styles.leftSection}>
                <div className={styles.iconContainer}>
                  <AlertTriangle size={20} />
                </div>
                <span className={styles.message}>{alert.message}</span>
              </div>
              <button
                onClick={() => router.push('/clubes')}
                className={styles.actionButton}
              >
                <span>Ver Solicitud</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
