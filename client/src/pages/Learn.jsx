import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
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

function getCategory(chapter) {
  if (chapter.sort_order <= 3) return 'basics';
  if (chapter.sort_order <= 7) return 'training';
  return 'debugging';
}

export default function Learn() {
  const { t, locale } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [viewTab, setViewTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 4;

  const qFromUrl = searchParams.get('q') || '';
  const [localQuery, setLocalQuery] = useState(qFromUrl);

  useEffect(() => {
    setLocalQuery(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    api('/api/chapters')
      .then((data) => setChapters(data.chapters || []))
      .catch(() => setErr('learn.loadError'))
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  useEffect(() => {
    setPage(1);
  }, [viewTab, categoryFilter, qFromUrl]);

  const searchLower = qFromUrl.trim().toLowerCase();

  const VIEW_TABS = useMemo(
    () => [
      { id: 'recommended', label: t('learn.recommended') },
      { id: 'beginner', label: t('learn.beginnerPath') },
      { id: 'all', label: t('learn.allModules') },
      { id: 'completed', label: t('learn.completed') },
    ],
    [t, locale]
  );

  const CATEGORY_TABS = useMemo(
    () => [
      { id: 'all', label: t('learn.all') },
      { id: 'basics', label: t('learn.basics') },
      { id: 'training', label: t('learn.training') },
      { id: 'debugging', label: t('learn.debugging') },
    ],
    [t, locale]
  );

  const catLabel = (id) => {
    if (id === 'basics') return t('learn.basics');
    if (id === 'training') return t('learn.training');
    return t('learn.debugging');
  };

  const baseForView = useMemo(() => {
    switch (viewTab) {
      case 'recommended':
        return chapters
          .filter((c) => !c.completed_at)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          .slice(0, 3);
      case 'beginner':
        return chapters.filter((c) => c.sort_order <= 3).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      case 'completed':
        return chapters.filter((c) => c.completed_at);
      case 'all':
      default:
        return [...chapters].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
  }, [chapters, viewTab]);

  const filteredList = useMemo(() => {
    const catOk = (c) => categoryFilter === 'all' || getCategory(c) === categoryFilter;
    const searchOk = (c) => !searchLower || (c.title || '').toLowerCase().includes(searchLower);
    return baseForView.filter((c) => catOk(c) && searchOk(c));
  }, [baseForView, categoryFilter, searchLower]);

  const totalPages = Math.max(Math.ceil(filteredList.length / PAGE_SIZE), 1);
  const pagedList = useMemo(() => {
    if (viewTab !== 'all') return filteredList;
    const start = (page - 1) * PAGE_SIZE;
    return filteredList.slice(start, start + PAGE_SIZE);
  }, [filteredList, page, viewTab]);

  const displayList = viewTab === 'all' ? pagedList : filteredList;

  if (authLoading || !user) return null;

  const completedCount = chapters.filter((c) => c.completed_at).length;
  const totalCount = chapters.length || 10;
  const progressPct = Math.round((completedCount / Math.max(totalCount, 1)) * 100);
  const inProgressCount = chapters.filter((c) => !c.completed_at && c.quiz_best).length;

  function getDifficulty(chapter) {
    if (chapter.sort_order <= 3) return t('learn.levelBeginner');
    if (chapter.sort_order <= 7) return t('learn.levelIntermediate');
    return t('learn.levelAdvanced');
  }

  function getEstTime(chapter) {
    return 10 + chapter.sort_order * 3;
  }

  function onSearchSubmit(e) {
    e.preventDefault();
    const query = localQuery.trim();
    const next = new URLSearchParams(searchParams);
    if (query) next.set('q', query);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  }

  const moduleCountLabel =
    filteredList.length === 1 ? t('learn.oneModule') : t('learn.nModules').replace('{n}', String(filteredList.length));

  function renderCards(list) {
    if (!list.length) {
      return <div className={styles.empty}>{t('learn.empty')}</div>;
    }
    return (
      <ul className={styles.chapterList}>
        {list.map((c) => {
          const image = CHAPTER_IMAGES[c.sort_order] || CHAPTER_IMAGES[1];
          const statusText = c.completed_at
            ? t('learn.statusCompleted')
            : c.quiz_best
              ? t('learn.statusInProgress')
              : t('learn.statusNotStarted');
          const totalQuiz = c.quiz_best ? Number((c.quiz_best.split('/')[1] || '0')) : 6;
          const correctQuiz = c.quiz_best ? Number((c.quiz_best.split('/')[0] || '0')) : 0;
          const lessonProgress = c.completed_at ? 100 : Math.round((correctQuiz / Math.max(totalQuiz, 1)) * 100);
          return (
            <li key={c.id}>
              <article className={styles.chapterItem}>
                <img className={styles.thumb} src={image} alt={c.title || t('learn.chapterFallback')} loading="lazy" />
                <div className={styles.chapterBody}>
                  <div className={styles.chapterHead}>
                    <span className={styles.chapterNum}>{t('learn.moduleN').replace('{n}', String(c.sort_order))}</span>
                    <span className={c.completed_at ? styles.done : styles.pending}>{statusText}</span>
                  </div>
                  <h3>{c.title || t('learn.chapterFallback')}</h3>
                  <p className={styles.meta}>
                    {getDifficulty(c)} • {getEstTime(c)} {t('learn.min')} •{' '}
                    {c.quiz_best ? `${t('learn.quizLabel')} ${c.quiz_best}` : t('learn.quizNotTaken')}
                  </p>
                  <p className={styles.desc}>{t('learn.cardDesc')}</p>
                  <div className={styles.lessonProgress}>
                    <span style={{ width: `${lessonProgress}%` }} />
                  </div>
                  <div className={styles.cardActions}>
                    <Link to={`/learn/${c.slug}`} className={styles.cta}>
                      {c.completed_at || c.quiz_best ? t('learn.continue') : t('learn.start')}
                    </Link>
                    <span className={styles.timeBadge}>{catLabel(getCategory(c))}</span>
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
          <p className={styles.kicker}>{t('learn.kicker')}</p>
          <h1 className={styles.title}>{t('learn.title')}</h1>
          <p className={styles.sub}>{t('learn.sub')}</p>
        </div>
        <form className={styles.searchWrap} onSubmit={onSearchSubmit}>
          <input
            className={styles.search}
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder={t('learn.searchPlaceholder')}
            aria-label={t('learn.ariaSearch')}
          />
          <button type="submit">{t('learn.search')}</button>
        </form>
      </section>

      {searchLower ? (
        <p className={styles.searchBanner}>
          {t('learn.resultsFor')} <strong>{qFromUrl.trim()}</strong>
          <button type="button" className={styles.clearSearch} onClick={() => { setLocalQuery(''); setSearchParams({}, { replace: true }); }}>
            {t('learn.clear')}
          </button>
        </p>
      ) : null}

      <div className={styles.layout}>
        <aside className={styles.leftPanel}>
          <div className={styles.progressCard}>
            <p className={styles.progressLabel}>{t('learn.yourProgress')}</p>
            <p className={styles.progressValue}>
              {completedCount}/{totalCount} {t('learn.chapters')}
            </p>
            <div className={styles.progressBar} role="progressbar" aria-valuenow={completedCount} aria-valuemin={0} aria-valuemax={totalCount}>
              <span style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <section className={styles.summaryStrip}>
            <div>
              <p className={styles.summaryLabel}>{t('learn.done')}</p>
              <p className={styles.summaryValue}>{completedCount}</p>
            </div>
            <div>
              <p className={styles.summaryLabel}>{t('learn.inProgress')}</p>
              <p className={styles.summaryValue}>{inProgressCount}</p>
            </div>
            <div>
              <p className={styles.summaryLabel}>{t('learn.left')}</p>
              <p className={styles.summaryValue}>{Math.max(totalCount - completedCount, 0)}</p>
            </div>
          </section>

          <p className={styles.panelLabel}>{t('learn.view')}</p>
          <div className={styles.viewTabs}>
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={viewTab === tab.id ? styles.viewTabActive : styles.viewTab}
                onClick={() => setViewTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className={styles.panelLabel}>{t('learn.track')}</p>
          <div className={styles.categoryTabs}>
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={categoryFilter === tab.id ? styles.catActive : styles.cat}
                onClick={() => setCategoryFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.rightPanel}>
          {loading && <div className={styles.loading}>{t('learn.loading')}</div>}
          {err && <div className={styles.err}>{t(err)}</div>}

          {!loading && !err && (
            <>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>
                  {VIEW_TABS.find((v) => v.id === viewTab)?.label}
                  <span className={styles.countBadge}>{moduleCountLabel}</span>
                </h2>
                {viewTab === 'all' && totalPages > 1 ? (
                  <div className={styles.pagination}>
                    <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                      {t('learn.previous')}
                    </button>
                    <span>
                      {t('learn.pageOf').replace('{page}', String(page)).replace('{total}', String(totalPages))}
                    </span>
                    <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                      {t('learn.next')}
                    </button>
                  </div>
                ) : null}
              </div>
              {renderCards(displayList)}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
