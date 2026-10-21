'use client';

import { useEffect, useState } from 'react';
import { clubInitials } from '../../utils/clubMark';
import styles from './EntityThumb.module.css';

export default function EntityThumb({ src, name, alt = '', children }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const mark = src && !failed ? (
    <img
      src={src}
      alt={alt}
      className={styles.thumb}
      onError={() => setFailed(true)}
    />
  ) : (
    <span className={styles.fallback} aria-hidden="true">
      {clubInitials(name) || '·'}
    </span>
  );

  if (children == null) return mark;

  return (
    <span className={styles.withLabel}>
      {mark}
      {children}
    </span>
  );
}
