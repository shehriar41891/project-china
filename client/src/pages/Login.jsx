import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import PageBackBar from '../components/PageBackBar';
import styles from './Auth.module.css';

export default function Login() {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const safeNextPath = () => {
    const raw = searchParams.get('next');
    if (!raw || typeof raw !== 'string') return null;
    const path = raw.trim();
    if (!path.startsWith('/') || path.startsWith('//')) return null;
    return path;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError(t('auth.errEmail'));
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      const next = safeNextPath();
      navigate(next || '/', { replace: true });
    } catch (err) {
      setError(err.message || t('auth.signInFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <PageBackBar showModulesLink={false} />
      <div className={styles.card}>
        <h1 className={styles.title}>{t('auth.signInTitle')}</h1>
        <p className={styles.sub}>{t('auth.signInSub')}</p>
        {error && <div className={styles.error} role="alert">{error}</div>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="email">{t('auth.email')}</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
          <label htmlFor="password">{t('auth.password')}</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
          <button type="submit" disabled={loading}>{loading ? t('auth.signingIn') : t('auth.signInBtn')}</button>
        </form>
        <p className={styles.footer}>{t('auth.noAccount')} <Link to="/signup">{t('auth.register')}</Link></p>
      </div>
    </div>
  );
}
