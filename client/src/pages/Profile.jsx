import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import styles from './Profile.module.css';

export default function Profile() {
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
      .catch(() => setErr('Could not load profile.'))
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  const weakTopics = useMemo(() => {
    if (!data || !data.byTopic) return [];
    return Object.entries(data.byTopic)
      .filter(([, s]) => s && s.total >= 2 && s.correct / s.total < 0.6)
      .map(([name]) => name)
      .slice(0, 5);
  }, [data]);

  if (authLoading || !user) return null;

  if (loading || err) {
    return (
      <div className={styles.main}>
        <div className={styles.card}>{err || 'Loading profile…'}</div>
      </div>
    );
  }

  const chapters = data.chapterProgress || [];
  const completedCh = chapters.filter((c) => c.completed_at).length;
  const totalCh = 10;
  const pct = totalCh ? Math.round(100 * completedCh / totalCh) : 0;

  return (
    <div className={styles.main}>
      <section className={styles.progressWrap}>
        <h3>Your learning progress</h3>
        <div className={styles.progressBar} role="progressbar" aria-valuenow={completedCh} aria-valuemin={0} aria-valuemax={totalCh}>
          <div className={styles.progressFill} style={{ width: pct + '%' }} />
        </div>
        <p className={styles.progressText}>{completedCh} of {totalCh} chapters completed</p>
      </section>

      <section className={styles.hero}>
        <div className={styles.avatar}>{data.user?.name ? data.user.name.charAt(0).toUpperCase() : '?'}</div>
        <div className={styles.heroInfo}>
          <h1>{data.user?.name || 'User'}</h1>
          <p>{data.user?.email || ''}</p>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>{completedCh}</span>
              <span className={styles.statLabel}>Chapters completed</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>{(data.attempts || []).length}</span>
              <span className={styles.statLabel}>Quizzes taken</span>
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <Link to="/learn">Continue learning</Link>
          <Link to="/editor" className={styles.outline}>Network Builder</Link>
        </div>
      </section>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2>Chapter progress</h2>
          <ul className={styles.list}>
            {chapters.map((c) => (
              <li key={c.id}>
                <span className={styles.label}>{c.title || 'Chapter ' + c.id}</span>
                <span className={styles.value}>{c.completed_at ? '✓ Done' : '—'} {c.quiz_best || ''}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.card}>
          <h2>Quizzes by chapter</h2>
          <p className={styles.cardDesc}>Score less than 100%? Retake to get new questions on the same concepts.</p>
          <ul className={styles.list}>
            {chapters.map((c) => (
              <li key={c.id}>
                <span className={styles.label}>{c.title || 'Chapter ' + c.id}</span>
                <span className={styles.value}>{c.quiz_best || 'Not taken'}</span>
                {c.quiz_best_total > 0 && c.quiz_best_correct >= c.quiz_best_total && ' ✓'}
                {c.needs_retake && <Link to={'/quiz?chapterId=' + c.id} className={styles.retakeBtn}>Retake</Link>}
                {!c.quiz_best && <Link to={'/quiz?chapterId=' + c.id} className={styles.retakeBtnOutline}>Take quiz</Link>}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.card}>
          <h2>Progress by topic</h2>
          <div className={styles.topicGrid}>
            {Object.entries(data.byTopic || {}).map(([t, s]) => {
              const pctTopic = s.total > 0 ? Math.round(100 * s.correct / s.total) : 0;
              return (
                <div key={t} className={styles.topicChip}>
                  <strong>{t || 'General'}</strong>
                  <span className={styles.pct}>{s.correct}/{s.total} ({pctTopic}%)</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className={[styles.card, styles.cardFull].join(' ')}>
          <h2>Recommendations</h2>
          {weakTopics.length > 0 && (
            <p className={styles.transparentNote}>
              Based on your quiz history, these topics need more practice: <strong>{weakTopics.join(', ')}</strong>.
              The suggestions below also reflect this.
            </p>
          )}
          <p className={styles.recommendations}>{data.recommendations || 'Complete at least one quiz to get personalized recommendations.'}</p>
        </div>
      </div>
    </div>
  );
}
