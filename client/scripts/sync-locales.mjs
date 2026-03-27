/**
 * Deep-merge en.json into other locale files so every key exists everywhere.
 * Preserves existing translations; fills missing keys from English.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '../src/locales');

function deepMerge(en, existing) {
  if (en === null || typeof en !== 'object' || Array.isArray(en)) {
    return existing !== undefined && existing !== '' ? existing : en;
  }
  const out = {};
  for (const k of Object.keys(en)) {
    if (existing && typeof existing[k] === 'object' && existing[k] !== null && !Array.isArray(existing[k])) {
      out[k] = deepMerge(en[k], existing[k]);
    } else if (existing && existing[k] !== undefined && existing[k] !== '') {
      out[k] = existing[k];
    } else {
      out[k] = en[k];
    }
  }
  return out;
}

const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
const codes = ['zh', 'ru', 'fr', 'es', 'ja'];

for (const code of codes) {
  const p = path.join(localesDir, `${code}.json`);
  let existing = {};
  try {
    existing = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) {}
  const merged = deepMerge(en, existing);
  fs.writeFileSync(p, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  console.log('Updated', code);
}
