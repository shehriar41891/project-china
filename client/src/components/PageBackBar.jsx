import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';
import styles from './PageBackBar.module.css';

export default function PageBackBar({ showModulesLink = true, modulesTo = '/learn' }) {
  const navigate = useNavigate();
  const { t } = useLocale();

  return (
    <nav className={styles.bar} aria-label={t('common.backNav')}>
      <button type="button" className={styles.btn} onClick={() => navigate(-1)}>
        {t('common.back')}
      </button>
      {showModulesLink ? (
        <Link to={modulesTo} className={styles.link}>
          {t('common.allModules')}
        </Link>
      ) : null}
      <Link to="/" className={styles.link}>
        {t('common.home')}
      </Link>
    </nav>
  );
}
