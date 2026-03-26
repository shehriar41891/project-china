import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { api } from '../api/client';
import styles from './TutorChat.module.css';

/** Scoped AI tutor: explain / hint / navigation / glossary — backend enforces tone via intent. */
export default function TutorChat() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastIntent, setLastIntent] = useState('general');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (text, intent = lastIntent) => {
    const trimmed = (text || '').trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setLastIntent(intent);
    const userMsg = { role: 'user', content: trimmed };
    setInput('');
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const data = await api('/api/chat', {
        method: 'POST',
        body: { message: trimmed, history, intent },
      });
      setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: data.reply || '' }]);
    } catch (e) {
      const msg =
        e.message && (e.message.includes('503') || e.message.includes('not configured'))
          ? t('tutor.notConfigured')
          : t('tutor.error');
      setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: msg, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    send(input, lastIntent);
  };

  const chip = (intent, label) => (
    <button type="button" className={styles.chip} onClick={() => setLastIntent(intent)} title={label}>
      {label}
    </button>
  );

  return (
    <>
      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? t('tutor.close') : t('tutor.open')}
      >
        {open ? '×' : '💬'}
      </button>
      {open && (
        <div className={styles.panel} role="dialog" aria-label={t('tutor.title')}>
          <div className={styles.head}>
            <div>
              <h2 id="tutor-title">{t('tutor.title')}</h2>
              <p>{t('tutor.subtitle')}</p>
            </div>
            <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)} aria-label={t('tutor.close')}>
              ×
            </button>
          </div>
          <div className={styles.chips} role="toolbar" aria-label="Quick intents">
            {chip('explain', t('tutor.explain'))}
            {chip('hint', t('tutor.hint'))}
            {chip('navigate', t('tutor.navigate'))}
            {chip('glossary', t('tutor.glossary'))}
          </div>
          <div className={styles.messages} aria-labelledby="tutor-title">
            {messages.length === 0 && (
              <p className={styles.bubble + ' ' + styles.assistant}>
                <Link to="/learn">Learn</Link>
                {' · '}
                <Link to="/quiz">Quiz</Link>
                {' · '}
                <Link to="/editor">Builder</Link>
                {' · '}
                <Link to="/playground">Playground</Link>
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`${styles.bubble} ${m.role === 'user' ? styles.user : styles.assistant} ${m.isError ? styles.err : ''}`}
              >
                {m.content}
              </div>
            ))}
            {loading && <div className={styles.bubble + ' ' + styles.assistant}>…</div>}
            <div ref={endRef} />
          </div>
          <form className={styles.form} onSubmit={onSubmit}>
            <input
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('tutor.placeholder')}
              aria-label={t('tutor.placeholder')}
              maxLength={2000}
              disabled={loading}
            />
            <button type="submit" className={styles.send} disabled={loading || !input.trim()}>
              {t('tutor.send')}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
