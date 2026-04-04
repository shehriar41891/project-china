import React, { useEffect, useMemo, useState, memo } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import styles from './HomeParticlesBackground.module.css';

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduce;
}

function HomeParticlesBackground() {
  const reduceMotion = usePrefersReducedMotion();
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (reduceMotion) return undefined;
    let cancelled = false;
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      if (!cancelled) setInit(true);
    });
    return () => {
      cancelled = true;
    };
  }, [reduceMotion]);

  const options = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: 'transparent' } },
      fpsLimit: 60,
      detectRetina: true,
      interactivity: {
        events: {
          onClick: { enable: false },
          onHover: { enable: false },
          resize: { enable: true },
        },
      },
      particles: {
        color: { value: ['#60a5fa', '#38bdf8', '#93c5fd', '#7dd3fc', '#bfdbfe'] },
        links: {
          color: '#93c5fd',
          distance: 150,
          enable: true,
          opacity: 0.32,
          width: 0.9,
        },
        move: {
          enable: true,
          speed: 0.55,
          direction: 'none',
          random: true,
          straight: false,
          outModes: { default: 'out' },
        },
        number: {
          value: 70,
          density: { enable: true, width: 1000, height: 1000 },
        },
        opacity: {
          value: { min: 0.15, max: 0.5 },
          animation: {
            enable: true,
            speed: 0.35,
            sync: false,
            minimumValue: 0.12,
          },
        },
        shape: { type: 'circle' },
        size: {
          value: { min: 1, max: 2.8 },
        },
      },
    }),
    []
  );

  if (reduceMotion || !init) {
    return <div className={styles.staticFallback} aria-hidden="true" />;
  }

  return (
    <div className={styles.wrap} aria-hidden="true">
      <Particles id="home-tsparticles" options={options} />
    </div>
  );
}

/** Isolated from parent (e.g. hero search typing) so tsparticles isn’t reset every keystroke */
export default memo(HomeParticlesBackground);
