'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './Tabs.module.css';

export default function Tabs({ tabs = [], active, onChange, scrollable = false }) {
  const listRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!scrollable) return undefined;

    const list = listRef.current;
    if (!list) return undefined;

    const updateEdges = () => {
      setCanScrollLeft(list.scrollLeft > 4);
      setCanScrollRight(list.scrollLeft + list.clientWidth < list.scrollWidth - 4);
    };

    updateEdges();
    list.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    return () => {
      list.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
    };
  }, [scrollable, tabs.length]);

  useEffect(() => {
    if (!scrollable || !listRef.current) return;
    const list = listRef.current;
    const selected = list.querySelector('[aria-selected="true"]');
    if (!selected) return;
    const listRect = list.getBoundingClientRect();
    const tabRect = selected.getBoundingClientRect();
    if (tabRect.left < listRect.left) {
      list.scrollBy({ left: tabRect.left - listRect.left - 8, behavior: 'smooth' });
    } else if (tabRect.right > listRect.right) {
      list.scrollBy({ left: tabRect.right - listRect.right + 8, behavior: 'smooth' });
    }
  }, [scrollable, active]);

  const tabButtons = tabs.map((tab) => (
    <button
      key={tab.id}
      type="button"
      role="tab"
      aria-selected={active === tab.id}
      className={`${styles.tab} ${active === tab.id ? styles.active : ''}`}
      onClick={() => onChange?.(tab.id)}
    >
      {tab.label}
    </button>
  ));

  if (!scrollable) {
    return (
      <div className={styles.tabs} role="tablist">
        {tabButtons}
      </div>
    );
  }

  const scrollByDir = (direction) => {
    listRef.current?.scrollBy({ left: direction * 220, behavior: 'smooth' });
  };

  return (
    <div className={styles.scroller}>
      <button
        type="button"
        className={styles.arrow}
        onClick={() => scrollByDir(-1)}
        disabled={!canScrollLeft}
        aria-label="Fechas anteriores"
      >
        <i className="bi bi-chevron-left" aria-hidden="true" />
      </button>
      <div className={`${styles.tabs} ${styles.scrollable}`} role="tablist" ref={listRef}>
        {tabButtons}
      </div>
      <button
        type="button"
        className={styles.arrow}
        onClick={() => scrollByDir(1)}
        disabled={!canScrollRight}
        aria-label="Fechas siguientes"
      >
        <i className="bi bi-chevron-right" aria-hidden="true" />
      </button>
    </div>
  );
}
