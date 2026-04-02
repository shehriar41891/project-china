import React from 'react';
import { useLocale } from '../context/LocaleContext';
import PageBackBar from '../components/PageBackBar';
import styles from './About.module.css';

export default function About() {
  const { t } = useLocale();
  return (
    <div className={styles.main}>
      <PageBackBar showModulesLink={false} />
      <div className={styles.card}>
        <h1>{t('about.title')}</h1>
        <p>{t('about.p1')}</p>
        <p>{t('about.p2')}</p>
      </div>
    </div>
  );
}
