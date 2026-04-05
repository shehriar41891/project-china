import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import PageBackBar from '../components/PageBackBar';
import styles from './HowItWorks.module.css';

/**
 * step4 = “Take quiz” — use same-origin SVG first so the image always loads
 * (external Unsplash is often blocked offline or by network policy).
 */
const STEP_IMAGES = {
  step1:
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=480&q=85&fit=crop&auto=format',
  step2:
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=480&q=85&fit=crop&auto=format',
  step3:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=480&q=85&fit=crop&auto=format',
  step4: '/quiz-card-art.svg',
  step5:
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=480&q=85&fit=crop&auto=format',
};

const STEP_FALLBACKS = {
  step1:
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=480&q=85&fit=crop&auto=format',
  step2:
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=480&q=85&fit=crop&auto=format',
  step3:
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=480&q=85&fit=crop&auto=format',
  step4:
    'https://images.unsplash.com/photo-1434030216411-0b793f4ed417?w=480&q=85&fit=crop&auto=format',
  step5:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=480&q=85&fit=crop&auto=format',
};

function StepImage({ stepKey }) {
  const primary = STEP_IMAGES[stepKey] || STEP_IMAGES.step1;
  const fallback = STEP_FALLBACKS[stepKey] || STEP_FALLBACKS.step1;
  const [src, setSrc] = useState(primary);
  useEffect(() => {
    setSrc(primary);
  }, [primary]);
  return (
    <img
      className={styles.stepImage}
      src={src}
      alt=""
      loading={stepKey === 'step4' ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => {
        setSrc((prev) => (prev !== fallback ? fallback : prev));
      }}
    />
  );
}

export default function HowItWorks() {
  const { t } = useLocale();

  const steps = [
    { key: 'step1', example: t('howItWorks.ex1') },
    { key: 'step2', example: t('howItWorks.ex2') },
    { key: 'step3', example: t('howItWorks.ex3') },
    { key: 'step4', example: t('howItWorks.ex4') },
    { key: 'step5', example: t('howItWorks.ex5') },
  ];

  return (
    <div className={styles.page}>
      <PageBackBar />
      <header className={styles.hero}>
        <p className={styles.kicker}>{t('howItWorks.kicker')}</p>
        <h1 className={styles.title}>{t('howItWorks.title')}</h1>
        <p className={styles.lead}>{t('howItWorks.lead')}</p>
      </header>

      <div className={styles.stepsRow} role="list">
        {steps.map((s, i) => (
          <article key={s.key} className={styles.stepCard} role="listitem" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className={styles.stepImageWrap}>
              <StepImage stepKey={s.key} />
              <span className={styles.stepBadge}>{i + 1}</span>
            </div>
            <div className={styles.stepBody}>
              <h2>{t(`home.${s.key}`)}</h2>
              <p className={styles.example}>{s.example}</p>
            </div>
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
