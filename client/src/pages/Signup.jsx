import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import styles from './Auth.module.css';

export default function Signup() {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password || !name.trim()) {
      setError(t('auth.errSignup'));
      return;
    }
    setLoading(true);
    try {
      await signup(email.trim(), password, name.trim());
      navigate('/');
    } catch (err) {
      setError(err.message || t('auth.signUpFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <Link to="/" className={styles.back}>{t('auth.backHome')}</Link>
      <div className={styles.card}>
        <h1 className={styles.title}>{t('auth.registerTitle')}</h1>
        <p className={styles.sub}>{t('auth.registerSub')}</p>
        {error && <div className={styles.error} role="alert">{error}</div>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="name">{t('auth.name')}</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder={t('auth.namePlaceholder')}
          />
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
            autoComplete="new-password"
            placeholder="••••••••"
          />
          <button type="submit" disabled={loading}>{loading ? t('auth.creating') : t('auth.registerBtn')}</button>
        </form>
        <p className={styles.footer}>{t('auth.haveAccount')} <Link to="/login">{t('nav.signIn')}</Link></p>
      </div>
    </div>
  );
}
