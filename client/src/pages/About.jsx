import React from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import PageBackBar from '../components/PageBackBar';
import styles from './About.module.css';

export default function About() {
  const { t } = useLocale();

  const features = [
    { title: t('aboutPage.feat1Title'), text: t('aboutPage.feat1Text') },
    { title: t('aboutPage.feat2Title'), text: t('aboutPage.feat2Text') },
    { title: t('aboutPage.feat3Title'), text: t('aboutPage.feat3Text') },
    { title: t('aboutPage.feat4Title'), text: t('aboutPage.feat4Text') },
  ];

  const helpBullets = [
    t('aboutPage.helpB1'),
    t('aboutPage.helpB2'),
    t('aboutPage.helpB3'),
    t('aboutPage.helpB4'),
    t('aboutPage.helpB5'),
  ];

  return (
    <div className={styles.page}>
      <PageBackBar />
      <header className={styles.hero}>
        <p className={styles.kicker}>{t('aboutPage.kicker')}</p>
        <h1 className={styles.title}>{t('aboutPage.title')}</h1>
        <p className={styles.lead}>{t('aboutPage.lead')}</p>
        <figure className={styles.diagramBox}>
          <img
            src="/about-learning-loop.svg"
            width={720}
            height={280}
            alt=""
            loading="eager"
            decoding="async"
          />
          <figcaption className={styles.diagramCaption}>{t('aboutPage.diagramCaption')}</figcaption>
        </figure>
      </header>

      <section className={styles.section} aria-labelledby="about-what">
        <h2 id="about-what">{t('aboutPage.whatTitle')}</h2>
        <p>{t('aboutPage.whatP1')}</p>
        <p>{t('aboutPage.whatP2')}</p>
      </section>

      <section className={styles.section} aria-labelledby="about-help">
        <h2 id="about-help">{t('aboutPage.helpTitle')}</h2>
        <p>{t('aboutPage.helpIntro')}</p>
        <ul className={styles.bulletList}>
          {helpBullets.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="about-features">
        <h2 id="about-features">{t('aboutPage.featuresTitle')}</h2>
        <div className={styles.featureGrid}>
          {features.map((f) => (
            <article key={f.title} className={styles.featureCard}>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <div className={styles.quoteBand}>
        <p>{t('aboutPage.valuesText')}</p>
      </div>

      <section className={styles.section} aria-labelledby="about-who">
        <h2 id="about-who">{t('aboutPage.audienceTitle')}</h2>
        <p>{t('aboutPage.audienceP1')}</p>
        <p>{t('aboutPage.audienceP2')}</p>
      </section>

      <section className={styles.cta} aria-labelledby="about-cta">
        <h2 id="about-cta">{t('aboutPage.ctaTitle')}</h2>
        <p>{t('aboutPage.ctaLead')}</p>
        <div className={styles.ctaRow}>
          <Link to="/learn" className={styles.btnPrimary}>{t('home.startLearning')}</Link>
          <Link to="/how-it-works" className={styles.btnGhost}>{t('nav.howItWorks')}</Link>
          <Link to="/quiz" className={styles.btnGhost}>{t('nav.quiz')}</Link>
        </div>
      </section>

      <footer className={styles.exploreFoot}>
        <h3>{t('aboutPage.exploreTitle')}</h3>
        <nav className={styles.linkRow} aria-label={t('aboutPage.exploreTitle')}>
          <Link to="/">{t('common.home')}</Link>
          <Link to="/how-it-works">{t('nav.howItWorks')}</Link>
          <Link to="/learn">{t('nav.learn')}</Link>
          <Link to="/editor">{t('nav.builder')}</Link>
          <Link to="/tutor">{t('nav.tutorLink')}</Link>
          <Link to="/quiz">{t('nav.quiz')}</Link>
        </nav>
      </footer>
    </div>
  );
}
