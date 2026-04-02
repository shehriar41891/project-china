import en from './chapters/en.json';
import zh from './chapters/zh.json';
import ru from './chapters/ru.json';
import fr from './chapters/fr.json';
import es from './chapters/es.json';
import ja from './chapters/ja.json';

const PACKS = { en, zh, ru, fr, es, ja };

/** Per-slug chapter copy: locale overrides English field-by-field. */
export function buildChapterLookup(locale) {
  const base = PACKS.en;
  const loc = PACKS[locale] || {};
  const out = {};
  for (const slug of Object.keys(base)) {
    const b = base[slug] || {};
    const l = loc[slug] || {};
    out[slug] = {};
    for (const k of Object.keys(b)) {
      const v = l[k];
      out[slug][k] = v != null && String(v).trim() !== '' ? v : b[k];
    }
  }
  return out;
}
