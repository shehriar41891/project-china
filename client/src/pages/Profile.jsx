import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { api } from '../api/client';
import PageBackBar from '../components/PageBackBar';
import styles from './Profile.module.css';

export default function Profile() {
  const { t, chapterText } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    api('/api/profile')
      .then(setData)
      .catch(() => setErr('profile.loadError'))
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  const weakLine = useMemo(() => {
    if (!data || !data.byTopic) return '';
    const weak = Object.entries(data.byTopic)
      .filter(([, s]) => s && s.total >= 2 && s.correct / s.total < 0.6)
      .map(([name]) => name)
      .slice(0, 4);
    return weak.length ? weak.join(', ') : '';
  }, [data]);

  if (authLoading || !user) return null;

  if (loading || err) {
    return (
      <div className={styles.main}>
        <PageBackBar />
        <div className={styles.card}>{err ? t(err) : t('profile.loading')}</div>
      </div>
    );
  }

  const chapters = data.chapterProgress || [];
  const completedCh = chapters.filter((c) => c.completed_at).length;
  const totalCh = Math.max(chapters.length, 10);
  const pct = totalCh ? Math.round((100 * completedCh) / totalCh) : 0;

  return (
    <div className={styles.main}>
      <PageBackBar />
      <header className={styles.header}>
        <div className={styles.avatar}>{data.user?.name ? data.user.name.charAt(0).toUpperCase() : '?'}</div>
        <div className={styles.headerBody}>
          <h1>{data.user?.name || t('profile.userFallback')}</h1>
          <p className={styles.email}>{data.user?.email || ''}</p>
          <div className={styles.progressRow}>
            <div className={styles.progressBar} role="progressbar" aria-valuenow={completedCh} aria-valuemin={0} aria-valuemax={totalCh}>
              <div className={styles.progressFill} style={{ width: `${pct}%` }} />
            </div>
            <span className={styles.progressMeta}>
              {t('profile.chaptersMeta').replace('{done}', String(completedCh)).replace('{total}', String(totalCh))}
            </span>
          </div>
          <div className={styles.actions}>
            <Link to="/learn" className={styles.primary}>{t('profile.continueLearning')}</Link>
            <Link to="/quiz" className={styles.ghost}>{t('profile.quizLink')}</Link>
          </div>
        </div>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t('profile.tableTitle')}</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('profile.colModule')}</th>
                <th>{t('profile.colStatus')}</th>
                <th>{t('profile.colQuiz')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {chapters.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/learn/${c.slug}`} className={styles.moduleLink}>
                      {c.slug ? chapterText(c.slug, 'title', c.title) : c.title || t('profile.chapterN').replace('{n}', String(c.id))}
                    </Link>
                  </td>
                  <td>{c.completed_at ? t('profile.statusDone') : t('profile.statusInProgress')}</td>
                  <td>{c.quiz_best || '—'}</td>
                  <td className={styles.actionsCell}>
                    {c.needs_retake ? (
                      <Link to={`/quiz?chapterId=${c.id}`} className={styles.linkBtn}>{t('profile.retake')}</Link>
                    ) : !c.quiz_best ? (
                      <Link to={`/quiz?chapterId=${c.id}`} className={styles.linkBtnOutline}>{t('profile.takeQuiz')}</Link>
                    ) : (
                      <span className={styles.dash}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {(data.recommendations || weakLine) && (
        <section className={styles.note}>
          {weakLine ? (
            <p className={styles.weak}>
              <strong>{t('profile.practiceStrong')}</strong> {weakLine}
            </p>
          ) : null}
          {data.recommendations ? <p className={styles.rec}>{data.recommendations}</p> : null}
        </section>
      )}
    </div>
  );
}
