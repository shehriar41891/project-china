import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import styles from './Learn.module.css';

const CHAPTER_IMAGES = {
  1: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&q=80',
  2: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200&q=80',
  3: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80',
  4: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&q=80',
  5: 'https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=1200&q=80',
  6: 'https://images.unsplash.com/photo-1488229297570-58520851e868?w=1200&q=80',
  7: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80',
  8: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80',
  9: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80',
  10: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80',
};

export default function Learn() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [localQuery, setLocalQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 4;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    api('/api/chapters')
      .then((data) => setChapters(data.chapters || []))
      .catch(() => setErr('Could not load course. Sign in and try again.'))
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  if (authLoading || !user) return null;

  const completedCount = chapters.filter((c) => c.completed_at).length;
  const totalCount = chapters.length || 10;
  const progressPct = Math.round((completedCount / Math.max(totalCount, 1)) * 100);
  const inProgressCount = chapters.filter((c) => !c.completed_at && c.quiz_best).length;

  function getCategory(chapter) {
    if (chapter.sort_order <= 3) return 'basics';
    if (chapter.sort_order <= 7) return 'training';
    return 'debugging';
  }

  function getDifficulty(chapter) {
    if (chapter.sort_order <= 3) return 'Beginner';
    if (chapter.sort_order <= 7) return 'Intermediate';
    return 'Advanced';
  }

  function getEstTime(chapter) {
    return 10 + chapter.sort_order * 3;
  }

  const navQuery = new URLSearchParams(location.search).get('q') || '';
  const effectiveQuery = (localQuery || navQuery).trim().toLowerCase();

  useEffect(() => {
    setLocalQuery(navQuery);
  }, [navQuery]);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, effectiveQuery]);
  const filtered = chapters.filter((c) => {
    const byFilter = activeFilter === 'all' ? true : getCategory(c) === activeFilter;
    const byQuery = !effectiveQuery || (c.title || '').toLowerCase().includes(effectiveQuery);
    return byFilter && byQuery;
  });
  const recommended = chapters.filter((c) => !c.completed_at).slice(0, 3);
  const beginnerPath = chapters.filter((c) => c.sort_order <= 3);
  const completedModules = chapters.filter((c) => c.completed_at);
  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const pagedModules = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'basics', label: 'Basics' },
    { id: 'training', label: 'Training' },
    { id: 'debugging', label: 'Debugging' },
  ];

  function renderCards(list) {
    return (
      <ul className={styles.chapterList}>
        {list.map((c) => {
          const image = CHAPTER_IMAGES[c.sort_order] || CHAPTER_IMAGES[1];
          const statusText = c.completed_at ? 'Completed' : c.quiz_best ? 'In progress' : 'Not started';
          const totalQuiz = c.quiz_best ? Number((c.quiz_best.split('/')[1] || '0')) : 6;
          const correctQuiz = c.quiz_best ? Number((c.quiz_best.split('/')[0] || '0')) : 0;
          const lessonProgress = c.completed_at ? 100 : Math.round((correctQuiz / Math.max(totalQuiz, 1)) * 100);
          return (
            <li key={c.id}>
              <article className={styles.chapterItem}>
                <img className={styles.thumb} src={image} alt={c.title || 'Chapter'} loading="lazy" />
                <div className={styles.chapterBody}>
                  <div className={styles.chapterHead}>
                    <span className={styles.chapterNum}>Module {c.sort_order}</span>
                    <span className={c.completed_at ? styles.done : styles.pending}>{statusText}</span>
                  </div>
                  <h3>{c.title || 'Chapter'}</h3>
                  <p className={styles.meta}>
                    {getDifficulty(c)} • {getEstTime(c)} min • {c.quiz_best ? 'Quiz ' + c.quiz_best : 'Quiz not taken'}
                  </p>
                  <p className={styles.desc}>Learn key ideas, explore visually, and pass the checkpoint quiz.</p>
                  <div className={styles.lessonProgress}>
                    <span style={{ width: lessonProgress + '%' }} />
                  </div>
                  <div className={styles.cardActions}>
                    <Link to={'/learn/' + c.slug} className={styles.cta}>
                      {c.completed_at || c.quiz_best ? 'Continue' : 'Start'}
                    </Link>
                    <span className={styles.timeBadge}>{getCategory(c)}</span>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className={styles.main}>
      <section className={styles.topBar}>
        <div>
          <p className={styles.kicker}>Learning Catalog</p>
          <h1 className={styles.title}>Deep Learning Foundations</h1>
          <p className={styles.sub}>10 chapters with concept explanations, guided visualizations, and adaptive quiz checkpoints.</p>
        </div>
        <form
          className={styles.searchWrap}
          onSubmit={(e) => {
            e.preventDefault();
            const query = localQuery.trim();
            navigate(query ? `/learn?q=${encodeURIComponent(query)}` : '/learn');
          }}
        >
          <input
            className={styles.search}
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search module titles..."
            aria-label="Search modules"
          />
          <button type="submit">Search</button>
        </form>
      </section>

      <div className={styles.layout}>
        <aside className={styles.leftPanel}>
          <div className={styles.progressCard}>
            <p className={styles.progressLabel}>Your progress</p>
            <p className={styles.progressValue}>{completedCount}/{totalCount} chapters completed</p>
            <div className={styles.progressBar} role="progressbar" aria-valuenow={completedCount} aria-valuemin={0} aria-valuemax={totalCount}>
              <span style={{ width: progressPct + '%' }} />
            </div>
          </div>

          <section className={styles.summaryStrip}>
            <div>
              <p className={styles.summaryLabel}>Completed</p>
              <p className={styles.summaryValue}>{completedCount}</p>
            </div>
            <div>
              <p className={styles.summaryLabel}>In progress</p>
              <p className={styles.summaryValue}>{inProgressCount}</p>
            </div>
            <div>
              <p className={styles.summaryLabel}>Remaining</p>
              <p className={styles.summaryValue}>{Math.max(totalCount - completedCount, 0)}</p>
            </div>
          </section>

          <div className={styles.tabs}>
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={activeFilter === t.id ? styles.tabActive : styles.tab}
                onClick={() => setActiveFilter(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {effectiveQuery ? <p className={styles.searchHint}>Showing results for: <strong>{effectiveQuery}</strong></p> : null}
        </aside>

        <section className={styles.rightPanel}>
          {loading && <div className={styles.loading}>Loading chapters…</div>}
          {err && <div className={styles.err}>{err}</div>}

          {!loading && !err && (
            <>
              <h2 className={styles.sectionTitle}>Recommended for you</h2>
              {renderCards(recommended.length ? recommended : filtered.slice(0, 3))}

              <h2 className={styles.sectionTitle}>Beginner path</h2>
              {renderCards(beginnerPath)}

              <h2 className={styles.sectionTitle}>All modules</h2>
              {renderCards(pagedModules)}
              <div className={styles.pagination}>
                <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  Previous
                </button>
                <span>Page {page} / {totalPages}</span>
                <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  Next
                </button>
              </div>

              <h2 className={styles.sectionTitle}>Completed modules</h2>
              {completedModules.length ? renderCards(completedModules) : <div className={styles.empty}>No completed modules yet.</div>}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
