import React from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Users, ShieldPlus, BadgeCheck, ClipboardList } from 'lucide-react';
import styles from './QuickActions.module.css';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: 'Crear nuevo torneo',
      icon: Trophy,
      path: '/torneos/nuevo',
      description: 'Configura un nuevo torneo con sus fases y equipos.',
      colorClass: styles.blueIcon
    },
    {
      label: 'Gestiónar usuarios',
      icon: Users,
      path: '/usuarios',
      description: 'Administra usuarios, roles y permisos del sistema.',
      colorClass: styles.orangeIcon
    },
    {
      label: 'Crear nuevo club',
      icon: ShieldPlus,
      path: '/clubes',
      description: 'Genera invitaciones para registrar nuevos clubes.',
      colorClass: styles.greenIcon
    },
    {
      label: 'Gestión de Árbitros',
      icon: BadgeCheck,
      path: '/arbitros',
      description: 'Administra inscripciones y designaciones arbitrales.',
      colorClass: styles.orangeIcon
    },
    {
      label: 'Gestión de Planilleros',
      icon: ClipboardList,
      path: '/planilleros',
      description: 'Administra y designa a los encargados de mesa.',
      colorClass: styles.blueIcon
    }
  ];

  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>Acciones Rápidas</h3>
      <div className={styles.grid}>
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={() => router.push(action.path)}
              className={styles.actionCard}
            >
              <div className={`${styles.iconContainer} ${action.colorClass}`}>
                <Icon size={24} />
              </div>
              <div className={styles.textContainer}>
                <span className={styles.label}>{action.label}</span>
                <span className={styles.description}>{action.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
