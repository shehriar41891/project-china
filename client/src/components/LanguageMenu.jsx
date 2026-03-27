import React, { useState, useRef, useEffect } from 'react';
import { useLocale } from '../context/LocaleContext';
import { LANGUAGE_OPTIONS } from '../locales/languages';
import styles from './LanguageMenu.module.css';

function GlobeIcon() {
  return (
    <svg className={styles.globeSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 0 0 18M12 3a15 15 0 0 1 0 18M5 5c2.5 2.5 2.5 11.5 0 14M19 5c-2.5 2.5-2.5 11.5 0 14" />
    </svg>
  );
}

export default function LanguageMenu() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const current = LANGUAGE_OPTIONS.find((l) => l.code === locale) || LANGUAGE_OPTIONS[1];

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Language"
      >
        <GlobeIcon />
        <span className={styles.currentLabel}>{current.label}</span>
        <span className={styles.chevron} aria-hidden>▾</span>
      </button>
      {open ? (
        <ul className={styles.dropdown} role="listbox" aria-label="Choose language">
          {LANGUAGE_OPTIONS.map((opt) => (
            <li key={opt.code} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={locale === opt.code}
                className={`${styles.option} ${locale === opt.code ? styles.optionActive : ''}`}
                onClick={() => {
                  setLocale(opt.code);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
