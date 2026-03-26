import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import en from '../locales/en.json';
import ur from '../locales/ur.json';

const DICTS = { en, ur };
const STORAGE_KEY = 'nnp-locale';

function get(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s && DICTS[s]) return s;
    } catch (_) {}
    return 'en';
  });

  const setLocale = useCallback((next) => {
    if (!DICTS[next]) return;
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (path, fallback) => {
      const v = get(DICTS[locale], path);
      if (v !== undefined && typeof v === 'string') return v;
      const enVal = get(DICTS.en, path);
      if (enVal !== undefined && typeof enVal === 'string') return enVal;
      return fallback !== undefined ? fallback : path;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t, locales: Object.keys(DICTS) }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
