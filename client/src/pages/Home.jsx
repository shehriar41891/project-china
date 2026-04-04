import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { api } from '../api/client';
import HomeParticlesBackground from '../components/HomeParticlesBackground';
import styles from './Home.module.css';

const IMAGES = {
  hero: {
    primary: 'https://illustrations.popsy.co/blue/artificial-intelligence.svg',
    fallback: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
  },
  builder: {
    primary: 'https://illustrations.popsy.co/blue/coding.svg',
    fallback: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80',
  },
  learn: {
    primary: 'https://illustrations.popsy.co/blue/developer-activity.svg',
    fallback: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80',
  },
  /** Training / metrics — fits “visualize training” playground */
  playground: {
    primary: 'https://illustrations.popsy.co/blue/data-report.svg',
    fallback: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
  },
  quiz: {
    primary: 'https://illustrations.popsy.co/blue/online-learning.svg',
    fallback: 'https://images.unsplash.com/photo-1434030216411-0b793f4ed417?w=600&q=80',
  },
  /** Quick Access “Take a Quiz” — checkpoint / exam vibe (distinct from generic “quiz” module art) */
  quizCard: {
    primary: 'https://images.unsplash.com/photo-1434030216411-0b793f4ed417?w=640&q=80',
    fallback: 'https://illustrations.popsy.co/blue/online-learning.svg',
  },
  tutor: {
    primary: 'https://illustrations.popsy.co/blue/artificial-intelligence.svg',
    fallback: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80',
  },
  learningPath: {
    primary: 'https://illustrations.popsy.co/blue/rocket-launch.svg',
    fallback: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
  },
};

function ImgWithFallback({ primary, fallback, alt, className, ...props }) {
  const [src, setSrc] = useState(primary);
  useEffect(() => {
    setSrc(primary);
  }, [primary]);
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setSrc(fallback)}
      {...props}
    />
  );
}

export default function Home() {
  const { t, locale, chapterText } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [heroSearch, setHeroSearch] = useState('');
  const [heroSearchFocused, setHeroSearchFocused] = useState(false);
  const [catalogChapters, setCatalogChapters] = useState([]);

  useEffect(() => {
    if (!user) return;
    api('/api/profile').then(setProfile).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    api('/api/chapters')
      .then((d) => setCatalogChapters(d.chapters || []))
      .catch(() => setCatalogChapters([]));
  }, [user]);

  const weakTopics = useMemo(() => {
    if (!profile || !profile.byTopic) return [];
    return Object.entries(profile.byTopic)
      .map(([topic, stats]) => {
        const total = stats.total || 0;
        const correct = stats.correct || 0;
        const pct = total ? correct / total : 0;
        return { topic, pct };
      })
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 3)
      .map((x) => x.topic);
  }, [profile]);

  const nextLesson = useMemo(() => {
    if (!profile || !profile.chapterProgress) return null;
    return profile.chapterProgress.find((c) => !c.completed_at) || null;
  }, [profile]);

  const heroSearchMatches = useMemo(() => {
    if (!user || !catalogChapters.length) return [];
    const q = heroSearch.trim().toLowerCase();
    if (!q) return [];
    return catalogChapters
      .filter((c) => {
        const raw = (c.title || '').toLowerCase();
        const loc = chapterText(c.slug, 'title', c.title).toLowerCase();
        const slug = (c.slug || '').toLowerCase();
        return raw.includes(q) || loc.includes(q) || slug.includes(q);
      })
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .slice(0, 10);
  }, [user, catalogChapters, heroSearch, chapterText, locale]);

  const showHeroChapterDropdown = Boolean(
    user && heroSearch.trim().length >= 1 && heroSearchFocused
  );

  const quickAccess = useMemo(
    () => [
      { title: t('home.qa1Title'), desc: t('home.qa1Desc'), to: '/learn', imageKey: 'learn' },
      { title: t('home.qa2Title'), desc: t('home.qa2Desc'), to: '/editor', imageKey: 'builder' },
      { title: t('home.qa3Title'), desc: t('home.qa3Desc'), to: '/playground', imageKey: 'playground' },
      { title: t('home.qa4Title'), desc: t('home.qa4Desc'), to: '/quiz', imageKey: 'quizCard' },
      { title: t('home.qa5Title'), desc: t('home.qa5Desc'), to: '/tutor', imageKey: 'tutor' },
      { title: t('home.qa6Title'), desc: t('home.qa6Desc'), to: '/learn', imageKey: 'learningPath' },
    ],
    [t, locale]
  );

  const moduleCards = useMemo(
    () => [
      { id: 'm1', imageKey: 'hero' },
      { id: 'm2', imageKey: 'playground' },
      { id: 'm3', imageKey: 'quiz' },
      { id: 'm4', imageKey: 'learningPath' },
      { id: 'm5', imageKey: 'builder' },
      { id: 'm6', imageKey: 'tutor' },
    ],
    []
  );

  const popularCourses = useMemo(
    () => [
      { title: t('home.course1'), meta: `${t('home.levelBeginner')} • 12.4k ${t('home.studentsK')}`, to: '/learn', imageKey: 'learn' },
      { title: t('home.course2'), meta: `${t('home.levelIntermediate')} • 8.9k ${t('home.studentsK')}`, to: '/learn', imageKey: 'playground' },
      { title: t('home.course3'), meta: `${t('home.levelIntermediate')} • 10.2k ${t('home.studentsK')}`, to: '/learn', imageKey: 'hero' },
      { title: t('home.course4'), meta: `${t('home.levelAdvanced')} • 6.3k ${t('home.studentsK')}`, to: '/learn', imageKey: 'builder' },
    ],
    [t, locale]
  );

  const submitHeroSearch = (e) => {
    e.preventDefault();
    const q = heroSearch.trim();
    const learnPath = q ? `/learn?q=${encodeURIComponent(q)}` : '/learn';
    if (user) {
      navigate(learnPath);
      return;
    }
    navigate(`/login?next=${encodeURIComponent(learnPath)}`);
  };

  return (
    <div className={`${styles.landing} ${styles.landingBlue}`}>
      <HomeParticlesBackground />
      <div className={styles.landingForeground}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.heroKicker}>{t('home.heroKicker')}</p>
            <h1 className={styles.heroHeadline}>{t('home.heroTitle')}</h1>
            <p className={styles.heroText}>{t('home.heroText')}</p>
            <div className={styles.heroSearchWrap}>
              <form className={styles.heroSearch} onSubmit={submitHeroSearch} role="search" aria-label={t('layout.searchAria')}>
                <div className={styles.heroSearchRow}>
                  <input
                    type="search"
                    name="q"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    onFocus={() => setHeroSearchFocused(true)}
                    onBlur={() => window.setTimeout(() => setHeroSearchFocused(false), 200)}
                    placeholder={t('layout.searchPlaceholder')}
                    className={styles.heroSearchInput}
                    aria-label={t('layout.searchAria')}
                    autoComplete="off"
                    aria-expanded={showHeroChapterDropdown}
                    aria-controls="home-chapter-suggest"
                  />
                  <button type="submit" className={styles.heroSearchBtn}>{t('layout.searchButton')}</button>
                </div>
                {showHeroChapterDropdown ? (
                  <div id="home-chapter-suggest" className={styles.heroSearchDropdown} role="listbox">
                    <div className={styles.heroSearchDropdownLabel}>{t('layout.searchChapters')}</div>
                    {heroSearchMatches.length === 0 ? (
                      <div className={styles.heroSearchDropdownEmpty} role="option">
                        {t('layout.searchNoResults')}
                      </div>
                    ) : (
                      heroSearchMatches.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          role="option"
                          className={styles.heroSearchDropdownItem}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            navigate(`/learn/${c.slug}`);
                            setHeroSearch('');
                            setHeroSearchFocused(false);
                          }}
                        >
                          <span className={styles.heroSearchDropdownTitle}>{chapterText(c.slug, 'title', c.title)}</span>
                          <span className={styles.heroSearchDropdownMeta}>{c.slug}</span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </form>
              <p className={styles.heroSearchHint}>{t('home.searchHint')}</p>
            </div>
            <div className={styles.heroActions}>
              <Link to="/learn" className={styles.heroBtnPrimary}>{t('home.startLearning')}</Link>
              <Link to="/editor" className={styles.heroBtnSecondary}>{t('home.openBuilder')}</Link>
            </div>
          </div>
          <div className={styles.heroMedia}>
            <div className={styles.heroIllusWrap}>
              <ImgWithFallback primary={IMAGES.hero.primary} fallback={IMAGES.hero.fallback} alt={t('home.heroAlt')} width={500} height={400} loading="eager" />
              <span className={styles.heroFloat1} aria-hidden="true" />
              <span className={styles.heroFloat2} aria-hidden="true" />
              <span className={styles.heroFloat3} aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className={styles.surfaceSection}>
          <div className={styles.sectionHead}>
            <h2>{t('home.quickAccessTitle')}</h2>
            <p>{t('home.quickAccessSub')}</p>
          </div>
          <div className={styles.featureGridSix}>
            {quickAccess.map((card, idx) => {
              const img = IMAGES[card.imageKey];
              return (
                <article className={styles.featureCard} key={card.to + idx}>
                  <div className={styles.cardMediaSlot}>
                    <ImgWithFallback
                      primary={img.primary}
                      fallback={img.fallback}
                      alt=""
                      className={styles.cardMediaImg}
                      width={320}
                      height={180}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                  <Link to={card.to} className={styles.featureLink}>{t('home.openModule')}</Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.surfaceSection}>
          <div className={styles.sectionHead}>
            <h2>{t('home.modulesTitle')}</h2>
            <p>{t('home.modulesSub')}</p>
          </div>
          <div className={styles.moduleGrid}>
            {moduleCards.map((row, idx) => {
              const sorted = [...catalogChapters].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
              const ch = sorted[idx];
              const img = IMAGES[row.imageKey];
              const title = ch ? chapterText(ch.slug, 'title', ch.title) : t(`home.${row.id}`);
              const cardInner = (
                <>
                  <div className={styles.cardMediaSlot}>
                    <ImgWithFallback
                      primary={img.primary}
                      fallback={img.fallback}
                      alt=""
                      className={styles.cardMediaImg}
                      width={320}
                      height={180}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3>{title}</h3>
                  <p>{t('home.moduleCardDesc')}</p>
                  {ch ? <span className={styles.moduleCardCta}>{t('home.modulesCta')} →</span> : null}
                </>
              );
              return ch ? (
                <Link key={row.id} to={`/learn/${ch.slug}`} className={styles.moduleCardLink}>
                  {cardInner}
                </Link>
              ) : (
                <article key={row.id} className={styles.moduleCard}>
                  {cardInner}
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.surfaceSection}>
          <div className={styles.sectionHead}>
            <h2>{t('home.popularTitle')}</h2>
            <p>{t('home.popularSub')}</p>
          </div>
          <div className={styles.popularGrid}>
            {popularCourses.map((c) => {
              const img = IMAGES[c.imageKey];
              return (
                <article key={c.title} className={styles.popularCard}>
                  <div className={styles.cardMediaSlot}>
                    <ImgWithFallback
                      primary={img.primary}
                      fallback={img.fallback}
                      alt=""
                      className={styles.cardMediaImg}
                      width={320}
                      height={180}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <h3>{c.title}</h3>
                  <p>{c.meta}</p>
                  <Link to={c.to}>{t('home.viewCourse')}</Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.progressSection}>
          <div className={styles.progressPanel}>
            <h2>{t('home.continueTitle')}</h2>
            {user && profile ? (
              <>
                <p><strong>{t('home.completedStrong')}</strong> {profile.chapterProgress ? profile.chapterProgress.filter((c) => c.completed_at).length : 0}</p>
                <p><strong>{t('home.weakStrong')}</strong> {weakTopics.length ? weakTopics.join(', ') : t('home.noWeak')}</p>
                <p>
                  <strong>{t('home.nextStrong')}</strong>{' '}
                  {nextLesson
                    ? chapterText(nextLesson.slug, 'title', nextLesson.title)
                    : t('home.allDone')}
                </p>
                {nextLesson ? (
                  <Link
                    to={nextLesson.slug ? `/learn/${nextLesson.slug}` : '/learn'}
                    className={styles.ctaPrimary}
                  >
                    {t('home.continueNext')}
                  </Link>
                ) : (
                  <Link to="/profile" className={styles.ctaPrimary}>
                    {t('home.goProfile')}
                  </Link>
                )}
              </>
            ) : (
              <>
                <p>{t('home.newLearner')}</p>
                <div className={styles.ctaRow}>
                  <Link to="/quiz" className={styles.ctaPrimary}>{t('home.diagnosticQuiz')}</Link>
                  <Link to="/learn" className={styles.ctaSecondary}>{t('home.beginnerPath')}</Link>
                </div>
              </>
            )}
          </div>
          <div className={styles.tutorPanel}>
            <h3>{t('home.tutorHelpTitle')}</h3>
            <p>{t('home.tutorHelpText')}</p>
            <Link to="/tutor" className={styles.ctaPrimary}>{t('home.openTutor')}</Link>
          </div>
        </section>

        <Link to="/tutor" className={styles.tutorFab} aria-label={t('home.fabTutor')}>🤖</Link>
      </div>
    </div>
  );
}
