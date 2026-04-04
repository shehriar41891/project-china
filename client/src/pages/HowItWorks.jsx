import React from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import PageBackBar from '../components/PageBackBar';
import styles from './HowItWorks.module.css';

export default function HowItWorks() {
  const { t } = useLocale();

  const steps = [
    { key: 'step1', icon: '📘', example: t('howItWorks.ex1') },
    { key: 'step2', icon: '🔧', example: t('howItWorks.ex2') },
    { key: 'step3', icon: '📊', example: t('howItWorks.ex3') },
    { key: 'step4', icon: '✅', example: t('howItWorks.ex4') },
    { key: 'step5', icon: '🎯', example: t('howItWorks.ex5') },
  ];

  return (
    <div className={styles.page}>
      <PageBackBar />
      <header className={styles.hero}>
        <p className={styles.kicker}>{t('howItWorks.kicker')}</p>
        <h1 className={styles.title}>{t('howItWorks.title')}</h1>
        <p className={styles.lead}>{t('howItWorks.lead')}</p>
      </header>

      <div className={styles.track}>
        {steps.map((s, i) => (
          <article key={s.key} className={styles.stepCard} style={{ animationDelay: `${i * 0.08}s` }}>
            <div className={styles.stepNum} aria-hidden="true">
              <span className={styles.stepIcon}>{s.icon}</span>
              <span className={styles.stepIndex}>{i + 1}</span>
            </div>
            <div className={styles.stepBody}>
              <h2>{t(`home.${s.key}`)}</h2>
              <p className={styles.example}>{s.example}</p>
            </div>
            {i < steps.length - 1 ? <div className={styles.connector} aria-hidden="true" /> : null}
          </article>
        ))}
      </div>

      <section className={styles.cta}>
        <p>{t('howItWorks.cta')}</p>
        <div className={styles.ctaRow}>
          <Link to="/learn" className={styles.btnPrimary}>{t('home.startLearning')}</Link>
          <Link to="/quiz" className={styles.btnGhost}>{t('nav.quiz')}</Link>
        </div>
      </section>
    </div>
  );
}
