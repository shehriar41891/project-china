import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import en from '../locales/en.json';
import zh from '../locales/zh.json';
import ru from '../locales/ru.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import ja from '../locales/ja.json';
import { VALID_LOCALES, HTML_LANG } from '../locales/languages';

const DICTS = { en, zh, ru, fr, es, ja };
const STORAGE_KEY = 'nnp-locale';

/** Deep-merge override into base so partial locale files inherit English for missing keys. */
function mergeDeep(base, override) {
  if (override === undefined || override === null) return base;
  if (base === undefined || base === null) return override;
  if (typeof base !== 'object' || Array.isArray(base) || typeof override !== 'object' || Array.isArray(override)) {
    return override !== undefined && override !== null ? override : base;
  }
  const keys = new Set([...Object.keys(base), ...Object.keys(override)]);
  const out = {};
  for (const k of keys) {
    if (k in override && typeof base[k] === 'object' && base[k] !== null && !Array.isArray(base[k])) {
      out[k] = mergeDeep(base[k], override[k] !== undefined ? override[k] : {});
    } else if (k in override && override[k] !== undefined) {
      out[k] = override[k];
    } else if (k in base) {
      out[k] = base[k];
    }
  }
  return out;
}

function get(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s && VALID_LOCALES.includes(s)) return s;
    } catch (_) {}
    return 'en';
  });

  const setLocale = useCallback((next) => {
    if (!VALID_LOCALES.includes(next)) return;
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale] || 'en';
  }, [locale]);

  const mergedDict = useMemo(() => {
    if (locale === 'en') return DICTS.en;
    return mergeDeep(DICTS.en, DICTS[locale] || {});
  }, [locale]);

  const t = useCallback(
    (path, fallback) => {
      const v = get(mergedDict, path);
      if (v !== undefined && typeof v === 'string') return v;
      const enVal = get(DICTS.en, path);
      if (enVal !== undefined && typeof enVal === 'string') return enVal;
      return fallback !== undefined ? fallback : path;
    },
    [mergedDict]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, locales: VALID_LOCALES }),
    [locale, setLocale, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
