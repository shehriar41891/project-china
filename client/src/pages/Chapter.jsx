import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { api } from '../api/client';
import { youtubeIdFromUrl } from '../utils/youtube';
import PageBackBar from '../components/PageBackBar';
import styles from './Chapter.module.css';

function estChapterMins(sortOrder) {
  return 10 + (sortOrder || 0) * 3;
}

function keyTermsFromText(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 10);
}

export default function Chapter() {
  const { t, chapterText } = useLocale();
  const { id, slug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [taskDone, setTaskDone] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatReply, setChatReply] = useState('');
  const [lessonStarted, setLessonStarted] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    api('/api/chapters')
      .then((data) => {
        const list = data.chapters || [];
        setChapters(list);
        let current = null;
        if (id) current = list.find((c) => String(c.id) === String(id));
        if (!current && slug) current = list.find((c) => c.slug === slug);
        if (!current) throw new Error('Invalid chapter');
        return api('/api/chapters/' + current.id).then((detail) => ({ detail, list }));
      })
      .then(({ detail, list }) => {
        setChapter(detail);
        const meta = list.find((c) => c.id === detail.id);
        if (meta && (meta.completed_at || meta.quiz_best)) setLessonStarted(true);
      })
      .catch(() => setErr('chapter.loadError'))
      .finally(() => setLoading(false));
  }, [id, slug, user, authLoading, navigate]);

  const slugKey = chapter?.slug || '';
  const localizedTitle = chapter ? chapterText(slugKey, 'title', chapter.title) : '';
  const localizedContent = chapter ? chapterText(slugKey, 'content', chapter.content_text) : '';
  const videoTeaser = chapter ? chapterText(slugKey, 'videoTeaser', '') : '';
  const rewardsRaw = chapter ? chapterText(slugKey, 'rewards', '') : '';
  const rewardLines = rewardsRaw ? rewardsRaw.split('|').map((s) => s.trim()).filter(Boolean) : [];

  const courseTotalMins = useMemo(
    () => chapters.reduce((sum, c) => sum + estChapterMins(c.sort_order), 0),
    [chapters]
  );
  const courseHours = Math.max(1, Math.round((courseTotalMins / 60) * 10) / 10);

  const firstVideoUrl = chapter?.video_links?.[0] || '';
  const ytId = youtubeIdFromUrl(firstVideoUrl);

  function beginLesson() {
    if (!chapter) return;
    setLessonStarted(true);
    fetch('/api/chapters/' + chapter.id + '/start', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }).catch(() => {});
  }

  if (authLoading || !user) return null;

  if (loading || err || !chapter) {
    return (
      <div className={styles.chapterPage}>
        <PageBackBar />
        <div className={styles.card}>{err ? t(err) : t('chapter.loading')}</div>
      </div>
    );
  }

  const videos = chapter.video_links || [];
  const docs = chapter.doc_links || [];
  const currentIndex = chapters.findIndex((c) => c.id === chapter.id);
  const prev = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
  const objective = `${t('chapter.objectiveText')} ${localizedTitle}`;
  const quizProgress = Math.round((chapter.sort_order / 10) * 100);
  const keyTerms = keyTermsFromText(localizedContent);

  async function askTutor() {
    if (!chatInput.trim()) return;
    try {
      const res = await api('/api/chat', { method: 'POST', body: { message: chatInput } });
      setChatReply(res.reply || t('chapter.noTutorReply'));
    } catch (_) {
      setChatReply(t('chapter.tutorNoReply'));
    }
  }

  if (!lessonStarted) {
    return (
      <div className={styles.chapterPage}>
        <PageBackBar />
        <div className={styles.main}>
          <aside className={styles.left}>
            <h3>{t('chapter.lessonList')}</h3>
            <ul className={styles.lessonList}>
              {chapters.map((c) => (
                <li key={c.id} className={c.id === chapter.id ? styles.activeLesson : ''}>
                  <Link to={`/learn/${c.slug}`}>
                    {c.sort_order}. {chapterText(c.slug, 'title', c.title)}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          <section className={styles.center}>
            <article className={`${styles.card} ${styles.introCard}`}>
              <p className={styles.introKicker}>{t('chapter.introHeading')}</p>
              <h1>{localizedTitle}</h1>

              <div className={styles.introPreviewGrid} role="list">
                <div className={styles.introBox} role="listitem">
                  <span className={styles.introBoxLabel}>{t('chapter.courseAboutTitle')}</span>
                  <p className={styles.introBoxValue}>
                    {t('chapter.courseHours')
                      .replace('{h}', String(courseHours))
                      .replace('{m}', String(courseTotalMins))}
                  </p>
                </div>
                <div className={styles.introBox} role="listitem">
                  <span className={styles.introBoxLabel}>{t('chapter.chaptersBoxTitle')}</span>
                  <p className={styles.introBoxValue}>
                    {t('chapter.courseChaptersCount').replace('{n}', String(chapters.length))}
                  </p>
                </div>
              </div>

              {rewardLines.length ? (
                <>
                  <h2 className={styles.introRewardsHeading}>{t('chapter.rewardsTitle')}</h2>
                  <div className={styles.introPreviewGrid} role="list">
                    {rewardLines.map((line) => (
                      <div key={line} className={`${styles.introBox} ${styles.introBoxReward}`} role="listitem">
                        <p className={styles.introBoxRewardText}>{line}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              <button type="button" className={styles.enterLessonBtn} onClick={beginLesson}>
                {t('chapter.enterLesson')}
              </button>
            </article>
          </section>

          <aside className={styles.right} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chapterPage}>
      <PageBackBar />
      <div className={styles.main}>
      <aside className={styles.left}>
        <h3>{t('chapter.lessonList')}</h3>
        <ul className={styles.lessonList}>
          {chapters.map((c) => (
            <li key={c.id} className={c.id === chapter.id ? styles.activeLesson : ''}>
              <Link to={`/learn/${c.slug}`}>
                {c.sort_order}. {chapterText(c.slug, 'title', c.title)}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <section className={styles.center}>
        <article className={styles.card}>
          <h1>{localizedTitle || t('chapter.lessonFallback')}</h1>
          <p className={styles.objective}>
            <strong>{t('chapter.objectivePrefix')}</strong> {objective}
          </p>

          {ytId ? (
            <div className={styles.section}>
              <h3>{t('learn.videoPreviewTitle')}</h3>
              {videoTeaser ? <p className={styles.tryItDesc}>{videoTeaser}</p> : null}
              <div className={styles.videoWrap}>
                <iframe
                  title={localizedTitle}
                  src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : null}

          <div className={styles.section}>
            <h3>{t('chapter.conceptTitle')}</h3>
            <div className={styles.content}>{localizedContent || t('chapter.noContent')}</div>
          </div>

          <div className={styles.section}>
            <h3>{t('chapter.vizTitle')}</h3>
            <p className={styles.tryItDesc}>{t('chapter.vizDesc')}</p>
            <div className={styles.links}>
              <Link to="/editor">{t('chapter.openBuilder')}</Link>
              <Link to="/playground">{t('chapter.openPlayground')}</Link>
            </div>
          </div>

          <div className={styles.section}>
            <h3>{t('chapter.microTitle')}</h3>
            <p className={styles.tryItDesc}>{t('chapter.microDesc')}</p>
            <label className={styles.checkline}>
              <input type="checkbox" checked={taskDone} onChange={(e) => setTaskDone(e.target.checked)} /> {t('chapter.taskDone')}
            </label>
          </div>

          <div className={styles.section}>
            <h3>{t('chapter.quizCheckpoint')}</h3>
            <Link to={`/quiz?chapterId=${chapter.id}`} className={styles.btnQuiz}>
              {t('chapter.takeCheckpoint')}
            </Link>
          </div>

          <div className={styles.section}>
            <h3>{t('chapter.summaryTitle')}</h3>
            <p className={styles.tryItDesc}>
              {t('chapter.summaryIntro')} <strong>{localizedTitle}</strong>.{' '}
              {next
                ? `${t('chapter.summaryNext')} ${chapterText(next.slug, 'title', next.title)}.`
                : t('chapter.summaryAllDone')}
            </p>
          </div>

          <div className={styles.bottomNav}>
            {prev ? (
              <Link to={`/learn/${prev.slug}`} className={styles.btnBack}>
                {t('chapter.prevLesson')}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link to={`/learn/${next.slug}`} className={styles.btnBack}>
                {t('chapter.nextLesson')}
              </Link>
            ) : (
              <Link to="/profile" className={styles.btnBack}>
                {t('chapter.goProfile')}
              </Link>
            )}
          </div>
        </article>
      </section>

      <aside className={styles.right}>
        <div className={styles.card}>
          <h3>{t('chapter.keyTerms')}</h3>
          <div className={styles.termWrap}>
            {keyTerms.length ? (
              keyTerms.map((term) => (
                <span key={term} className={styles.termChip}>
                  {term}
                </span>
              ))
            ) : (
              <span className={styles.termChip}>neural</span>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <h3>{t('chapter.progressTitle')}</h3>
          <div className={styles.lessonProgress}>
            <span style={{ width: `${quizProgress}%` }} />
          </div>
          <p className={styles.tryItDesc}>{t('chapter.progressThrough').replace('{n}', String(quizProgress))}</p>
        </div>

        <div className={styles.card}>
          <h3>{t('chapter.askTutor')}</h3>
          <textarea
            className={styles.askBox}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={t('chapter.askPlaceholder')}
          />
          <button type="button" className={styles.askBtn} onClick={askTutor}>
            {t('chapter.ask')}
          </button>
          {chatReply ? <p className={styles.tutorReply}>{chatReply}</p> : null}
        </div>

        <div className={styles.card}>
          <h3>{t('chapter.glossary')}</h3>
          <div className={styles.termWrap}>
            {keyTerms.slice(0, 4).map((term) => (
              <span key={term} className={styles.termChip}>
                {term}
              </span>
            ))}
          </div>
          {videos.length || docs.length ? (
            <div className={styles.links}>
              {videos.map((url, i) => (
                <a key={`v${i}`} href={url} target="_blank" rel="noopener noreferrer">
                  {t('chapter.video')}
                </a>
              ))}
              {docs.map((url, i) => (
                <a key={`d${i}`} href={url} target="_blank" rel="noopener noreferrer">
                  {t('chapter.doc')}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </aside>
      </div>
    </div>
  );
}
