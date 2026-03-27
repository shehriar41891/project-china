import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { api } from '../api/client';
import styles from './Tutor.module.css';

export default function Tutor() {
  const { t, locale } = useLocale();
  const quickPrompts = useMemo(
    () => [t('tutorPage.prompt1'), t('tutorPage.prompt2'), t('tutorPage.prompt3'), t('tutorPage.prompt4')],
    [t, locale]
  );

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: t('tutorPage.welcome'),
    },
  ]);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: t('tutorPage.welcome') }]);
  }, [locale, t]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text) {
    const prompt = (text || input).trim();
    if (!prompt || loading) return;
    setLoading(true);
    setInput('');
    const userMsg = { role: 'user', content: prompt };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const data = await api('/api/chat', { method: 'POST', body: { message: prompt, history } });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || t('tutorPage.noResponse') }]);
    } catch (_) {
      setMessages((prev) => [...prev, { role: 'assistant', content: t('tutorPage.unavailable'), isError: true }]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    send();
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>{t('tutorPage.eyebrow')}</p>
          <h1>{t('tutorPage.title')}</h1>
          <p className={styles.lead}>{t('tutorPage.lead')}</p>
        </div>
        <div className={styles.heroLinks}>
          <Link to="/learn" className={styles.heroLink}>{t('tutorPage.learningPath')}</Link>
          <Link to="/quiz" className={styles.heroLinkMuted}>{t('tutorPage.quizzes')}</Link>
        </div>
      </header>

      <div className={styles.shell}>
        <aside className={styles.sidebar} aria-label={t('tutorPage.promptsAria')}>
          <h2 className={styles.sidebarTitle}>{t('tutorPage.quickPrompts')}</h2>
          <ul className={styles.promptList}>
            {quickPrompts.map((p) => (
              <li key={p}>
                <button type="button" className={styles.promptBtn} onClick={() => send(p)} disabled={loading}>
                  {p}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className={styles.chat} aria-label={t('tutorPage.chatAria')}>
          <div className={styles.thread}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`${styles.row} ${m.role === 'user' ? styles.rowUser : styles.rowAssistant}`}
              >
                <span className={styles.badge}>{m.role === 'user' ? t('tutorPage.you') : t('tutorPage.tutor')}</span>
                <div className={`${styles.bubble} ${m.isError ? styles.bubbleErr : ''}`}>{m.content}</div>
              </div>
            ))}
            {loading ? (
              <div className={`${styles.row} ${styles.rowAssistant}`}>
                <span className={styles.badge}>{t('tutorPage.tutor')}</span>
                <div className={`${styles.bubble} ${styles.thinking}`}>{t('tutorPage.thinking')}</div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>
          <form className={styles.composer} onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('tutorPage.placeholder')}
              maxLength={2000}
              disabled={loading}
              aria-label={t('tutorPage.messageAria')}
            />
            <button type="submit" disabled={!input.trim() || loading}>
              {t('tutorPage.send')}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
