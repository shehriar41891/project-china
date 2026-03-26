import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function Signup() {
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
      setError('Please enter email, password and name.');
      return;
    }
    setLoading(true);
    try {
      await signup(email.trim(), password, name.trim());
      navigate('/');
    } catch (err) {
      setError(err.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <Link to="/" className={styles.back}>← Back to home</Link>
      <div className={styles.card}>
        <h1 className={styles.title}>Register</h1>
        <p className={styles.sub}>Create an account to save progress and take quizzes.</p>
        {error && <div className={styles.error} role="alert">{error}</div>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Your name"
          />
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="••••••••"
          />
          <button type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Register'}</button>
        </form>
        <p className={styles.footer}>Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
