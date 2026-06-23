import React from 'react';
import styles from './InfoCard.module.css';

export default function InfoCard({ title, value, subValue, icon: Icon }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {Icon && (
          <div className={styles.iconContainer}>
            <Icon className={styles.icon} size={20} />
          </div>
        )}
      </div>
      <div className={styles.content}>
        <span className={styles.value}>{value}</span>
        {subValue && <span className={styles.subValue}>{subValue}</span>}
      </div>
    </div>
  );
}
