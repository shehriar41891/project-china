import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import { api, postChat } from '../api/client';
import PageBackBar from '../components/PageBackBar';
import { formatBoldSegments } from '../utils/chatFormat';
import styles from './Tutor.module.css';

export default function Tutor() {
  const { t, locale, chapterText } = useLocale();

  const [chapters, setChapters] = useState([]);
  const [chapterSlug, setChapterSlug] = useState('');

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: t('tutorPage.welcome'),
    },
  ]);

  useEffect(() => {
    api('/api/chapters')
      .then((res) => {
        const list = res.chapters || [];
        setChapters(list);
      })
      .catch(() => setChapters([]));
  }, []);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: t('tutorPage.welcome') }]);
  }, [locale, t]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const selectedChapter = useMemo(
    () => chapters.find((c) => c.slug === chapterSlug) || null,
    [chapters, chapterSlug]
  );

  const quickPrompts = useMemo(() => {
    const modTitle =
      selectedChapter != null
        ? chapterText(selectedChapter.slug, 'title', selectedChapter.title)
        : '';
    if (!chapterSlug || !modTitle) {
      return [t('tutorPage.prompt1'), t('tutorPage.prompt2'), t('tutorPage.prompt3'), t('tutorPage.prompt4')];
    }
    const inject = (key) => t(key).replace(/\{module\}/g, modTitle);
    return [
      inject('tutorPage.promptModule1'),
      inject('tutorPage.promptModule2'),
      inject('tutorPage.promptModule3'),
      inject('tutorPage.promptModule4'),
    ];
  }, [chapterSlug, selectedChapter, chapterText, t, locale]);

  async function send(text) {
    const prompt = (text || input).trim();
    if (!prompt || loading) return;
    setLoading(true);
    setInput('');
    const userMsg = { role: 'user', content: prompt };
    // Prior turns only — `messages` does not yet include this user message (same pattern as TutorChat).
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    try {
      const body = {
        message: prompt,
        history,
        chapterSlug: chapterSlug || undefined,
        chapterTitle: selectedChapter
          ? chapterText(selectedChapter.slug, 'title', selectedChapter.title)
          : undefined,
      };
      const reply = await postChat(body);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply || t('tutorPage.noResponse') }]);
    } catch (e) {
      const msg = e && e.message ? String(e.message) : '';
      let content = t('tutorPage.unavailable');
      if (msg === '__CHAT_NETWORK__') content = t('tutorPage.chatNetwork');
      else if (msg === '__CHAT_HTML__') content = t('tutorPage.chatProxy');
      else if (msg) content = `${t('tutorPage.errorDetail')}\n\n${msg}`;
      setMessages((prev) => [...prev, { role: 'assistant', content, isError: true }]);
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
      <PageBackBar />
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>{t('tutorPage.eyebrow')}</p>
          <h1>{t('tutorPage.title')}</h1>
          <p className={styles.lead}>{t('tutorPage.lead')}</p>
          <p className={styles.moduleHint}>{t('tutorPage.chooseModule')}</p>
          <label className={styles.moduleField}>
            <span className={styles.moduleLabel}>{t('tutorPage.moduleSelectLabel')}</span>
            <select
              className={styles.moduleSelect}
              value={chapterSlug}
              onChange={(e) => setChapterSlug(e.target.value)}
              aria-label={t('tutorPage.moduleSelectLabel')}
            >
              <option value="">{t('tutorPage.moduleSelectPlaceholder')}</option>
              {[...chapters].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((c) => (
                <option key={c.id} value={c.slug}>
                  {chapterText(c.slug, 'title', c.title)}
                </option>
              ))}
            </select>
          </label>
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
            {quickPrompts.map((p, idx) => (
              <li key={`${chapterSlug || 'all'}-${idx}`}>
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
                <div className={`${styles.bubble} ${m.isError ? styles.bubbleErr : ''}`}>
                  {m.role === 'assistant' ? formatBoldSegments(m.content) : m.content}
                </div>
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
