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
    fallback: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&q=80',
  },
  learn: {
    primary: 'https://illustrations.popsy.co/blue/developer-activity.svg',
    fallback: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80',
  },
  quiz: {
    primary: 'https://illustrations.popsy.co/blue/online-learning.svg',
    fallback: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&q=80',
  },
  progress: {
    primary: 'https://illustrations.popsy.co/blue/data-report.svg',
    fallback: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
  },
  guide: {
    primary: 'https://illustrations.popsy.co/blue/rocket-launch.svg',
    fallback: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80',
  },
};

function ImgWithFallback({ primary, fallback, alt, className, ...props }) {
  const [src, setSrc] = useState(primary);
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

  useEffect(() => {
    if (!user) return;
    api('/api/profile').then(setProfile).catch(() => {});
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

  const quickAccess = useMemo(
    () => [
      { title: t('home.qa1Title'), desc: t('home.qa1Desc'), to: '/learn' },
      { title: t('home.qa2Title'), desc: t('home.qa2Desc'), to: '/editor' },
      { title: t('home.qa3Title'), desc: t('home.qa3Desc'), to: '/playground' },
      { title: t('home.qa4Title'), desc: t('home.qa4Desc'), to: '/quiz' },
      { title: t('home.qa5Title'), desc: t('home.qa5Desc'), to: '/tutor' },
      { title: t('home.qa6Title'), desc: t('home.qa6Desc'), to: '/learn' },
    ],
    [t, locale]
  );

  const modulePreview = useMemo(
    () => [t('home.m1'), t('home.m2'), t('home.m3'), t('home.m4'), t('home.m5'), t('home.m6')],
    [t, locale]
  );

  const popularCourses = useMemo(
    () => [
      { title: t('home.course1'), meta: `${t('home.levelBeginner')} • 12.4k ${t('home.studentsK')}`, to: '/learn' },
      { title: t('home.course2'), meta: `${t('home.levelIntermediate')} • 8.9k ${t('home.studentsK')}`, to: '/learn' },
      { title: t('home.course3'), meta: `${t('home.levelIntermediate')} • 10.2k ${t('home.studentsK')}`, to: '/learn' },
      { title: t('home.course4'), meta: `${t('home.levelAdvanced')} • 6.3k ${t('home.studentsK')}`, to: '/learn' },
    ],
    [t, locale]
  );

  const loopSteps = useMemo(() => [t('home.step1'), t('home.step2'), t('home.step3'), t('home.step4'), t('home.step5')], [t, locale]);

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
            <form className={styles.heroSearch} onSubmit={submitHeroSearch} role="search" aria-label={t('layout.searchAria')}>
              <div className={styles.heroSearchRow}>
                <input
                  type="search"
                  name="q"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder={t('layout.searchPlaceholder')}
                  className={styles.heroSearchInput}
                  aria-label={t('layout.searchAria')}
                  autoComplete="off"
                />
                <button type="submit" className={styles.heroSearchBtn}>{t('layout.searchButton')}</button>
              </div>
              <p className={styles.heroSearchHint}>{t('home.searchHint')}</p>
            </form>
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
            {quickAccess.map((card, idx) => (
              <article className={styles.featureCard} key={card.to + idx}>
                <div className={styles.featureCardImgWrap}>
                  <ImgWithFallback
                    primary={[IMAGES.builder.primary, IMAGES.learn.primary, IMAGES.hero.primary, IMAGES.quiz.primary, IMAGES.guide.primary, IMAGES.progress.primary][idx]}
                    fallback={[IMAGES.builder.fallback, IMAGES.learn.fallback, IMAGES.hero.fallback, IMAGES.quiz.fallback, IMAGES.guide.fallback, IMAGES.progress.fallback][idx]}
                    alt={card.title}
                    className={styles.featureCardImg}
                    width={260}
                    height={140}
                    loading="lazy"
                  />
                </div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
                <Link to={card.to} className={styles.featureLink}>{t('home.openModule')}</Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.loopSection}>
          <div className={styles.sectionHead}>
            <h2>{t('home.howTitle')}</h2>
            <p>{t('home.howSub')}</p>
          </div>
          <div className={styles.loopSteps}>
            {loopSteps.map((step, index) => (
              <article key={step} className={styles.loopStep}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.surfaceSection}>
          <div className={styles.sectionHead}>
            <h2>{t('home.modulesTitle')}</h2>
            <p>{t('home.modulesSub')}</p>
          </div>
          <div className={styles.moduleGrid}>
            {modulePreview.map((m) => (
              <article key={m} className={styles.moduleCard}>
                <h3>{m}</h3>
                <p>{t('home.moduleCardDesc')}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.surfaceSection}>
          <div className={styles.sectionHead}>
            <h2>{t('home.popularTitle')}</h2>
            <p>{t('home.popularSub')}</p>
          </div>
          <div className={styles.popularGrid}>
            {popularCourses.map((c) => (
              <article key={c.title} className={styles.popularCard}>
                <h3>{c.title}</h3>
                <p>{c.meta}</p>
                <Link to={c.to}>{t('home.viewCourse')}</Link>
              </article>
            ))}
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
