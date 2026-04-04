import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { api } from '../api/client';
import { profileChapterStatus } from '../utils/chapterProgress';
import PageBackBar from '../components/PageBackBar';
import styles from './Profile.module.css';

export default function Profile() {
  const { t, chapterText } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [recOpen, setRecOpen] = useState(false);

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

  useEffect(() => {
    if (!recOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setRecOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [recOpen]);

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
  const pct =
    typeof data.overall_progress_pct === 'number'
      ? data.overall_progress_pct
      : totalCh
        ? Math.round(chapters.reduce((s, c) => s + (c.progress_pct || 0), 0) / chapters.length)
        : 0;
  const displayName = data.user?.name || t('profile.userFallback');
  const hasRecContent = !!(weakLine || (data.recommendations && data.recommendations.trim()));

  return (
    <div className={styles.main}>
      <PageBackBar />

      <div className={styles.shell}>
        <aside className={styles.sidebar} aria-label={t('profile.sidebarAccount')}>
          <div className={styles.sideAvatar}>{displayName.charAt(0).toUpperCase()}</div>
          <h1 className={styles.sideName}>{displayName}</h1>
          <p className={styles.sideEmail}>{data.user?.email || ''}</p>
          <div className={styles.sideProgress}>
            <div className={styles.sideProgressBar} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className={styles.sideProgressFill} style={{ width: `${pct}%` }} />
            </div>
            <span className={styles.sideProgressMeta}>
              {t('profile.courseProgressMeta')
                .replace('{pct}', String(pct))
                .replace('{done}', String(completedCh))
                .replace('{total}', String(totalCh))}
            </span>
          </div>
          <nav className={styles.sideNav}>
            <Link to="/learn" className={styles.sideNavLink}>{t('profile.sidebarModules')}</Link>
            <Link to="/quiz" className={styles.sideNavLink}>{t('profile.quizLink')}</Link>
            <span className={styles.sideNavActive}>{t('profile.sidebarAccount')}</span>
          </nav>
          <div className={styles.sideActions}>
            <Link to="/learn" className={styles.primary}>{t('profile.continueLearning')}</Link>
            {hasRecContent ? (
              <button type="button" className={styles.recBtn} onClick={() => setRecOpen(true)}>
                {t('profile.viewRecommendations')}
              </button>
            ) : null}
          </div>
        </aside>

        <div className={styles.content}>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>{t('profile.panelPersonal')}</h2>
            <div className={styles.fieldGrid}>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>{t('profile.fieldName')}</span>
                <span className={styles.fieldValue}>{data.user?.name || '—'}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>{t('profile.fieldEmail')}</span>
                <span className={styles.fieldValue}>{data.user?.email || '—'}</span>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>{t('profile.panelAccount')}</h2>
            <div className={styles.fieldGrid}>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>{t('profile.fieldAccountId')}</span>
                <span className={styles.fieldValue}>{String(data.user?.id ?? '—')}</span>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>{t('profile.panelProgress')}</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('profile.colModule')}</th>
                    <th>{t('profile.colStatus')}</th>
                    <th>{t('profile.colProgress')}</th>
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
                      <td>{profileChapterStatus(c, t)}</td>
                      <td>{typeof c.progress_pct === 'number' ? `${c.progress_pct}%` : '—'}</td>
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
        </div>
      </div>

      {recOpen ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setRecOpen(false)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rec-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHead}>
              <h2 id="rec-modal-title" className={styles.modalTitle}>{t('profile.recModalTitle')}</h2>
              <button type="button" className={styles.modalClose} onClick={() => setRecOpen(false)}>
                {t('common.close')}
              </button>
            </div>
            <div className={styles.modalBody}>
              {weakLine ? (
                <p className={styles.modalWeak}>
                  <strong>{t('profile.recModalWeak')}:</strong> {weakLine}
                </p>
              ) : null}
              {data.recommendations ? <p className={styles.modalRec}>{data.recommendations}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
