/** Display order matches product reference: 中文, English, Русский, … */
export const LANGUAGE_OPTIONS = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'ru', label: 'Русский' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'ja', label: '日本語' },
];

/** BCP 47 language tags for <html lang> */
export const HTML_LANG = {
  zh: 'zh-CN',
  en: 'en',
  ar: 'ar',
  ru: 'ru',
  fr: 'fr',
  es: 'es',
  ja: 'ja',
};

export const VALID_LOCALES = LANGUAGE_OPTIONS.map((l) => l.code);
