import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { t, locale, setLocale } = useLocale();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setMenuOpen(false);
      navigate('/');
    } catch (_) {}
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    const q = search.trim();
    navigate(q ? `/learn?q=${encodeURIComponent(q)}` : '/learn');
    setMobileOpen(false);
  };

  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles.skipLink}>
        {t('a11y.skipToContent')}
      </a>
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`} aria-label="Main">
        <Link to="/" className={styles.navBrand}>
          <span className={styles.brandBadge}>NN</span>
          <span>{t('nav.brand')}</span>
        </Link>
        <button
          type="button"
          className={styles.mobileToggle}
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label="Toggle menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
        <form className={styles.navSearch} onSubmit={onSearchSubmit} role="search" aria-label="Search learning topics">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.navSearchInput}
            placeholder="Search topics (e.g. backpropagation)"
            aria-label="Search topics"
          />
          <button type="submit" className={styles.navSearchBtn}>Search</button>
        </form>
        <div className={`${styles.navRight} ${mobileOpen ? styles.navRightOpen : ''}`}>
          {user ? (
            <>
              <Link to="/learn" onClick={() => setMobileOpen(false)} className={styles.navLink}>{t('nav.learn')}</Link>
              <Link to="/quiz" onClick={() => setMobileOpen(false)} className={styles.navLink}>{t('nav.quiz')}</Link>
              <Link to="/tutor" onClick={() => setMobileOpen(false)} className={styles.navLink}>Tutor AI</Link>
              <div className={styles.menuWrap}>
                <button type="button" className={styles.menuBtn} onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen}>
                  {user.name || 'Profile'} ▾
                </button>
                {menuOpen && (
                  <div className={styles.menu}>
                    <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
                    <Link to="/learn" onClick={() => setMenuOpen(false)}>Learn</Link>
                    <Link to="/quiz" onClick={() => setMenuOpen(false)}>Quiz</Link>
                    <Link to="/tutor" onClick={() => setMenuOpen(false)}>Tutor AI</Link>
                    <Link to="/editor" onClick={() => setMenuOpen(false)}>Network Builder</Link>
                    <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
                    <button type="button" onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className={styles.navLinkCta}>{t('nav.signIn')}</Link>
          )}
          <Link to="/about" onClick={() => setMobileOpen(false)} className={styles.navLink}>{t('nav.about')}</Link>
          <Link to="/editor" onClick={() => setMobileOpen(false)} className={styles.navLinkCta}>{t('nav.builder')}</Link>
          <label className={styles.langLabel}>
            <span className={styles.visuallyHidden}>Language</span>
            <select
              className={styles.langSelect}
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              aria-label="Language"
            >
              <option value="en">English</option>
              <option value="ur">اردو</option>
            </select>
          </label>
          <button type="button" className={styles.themeBtn} onClick={toggle} aria-label={t('nav.toggleTheme')}>
            {theme === 'light' ? '🌙' : '☀'}
          </button>
        </div>
      </nav>
      <main id="main-content" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>
      <footer className={styles.foot}>
        <div className={styles.footLinks}>
          <Link to="/about">{t('nav.about')}</Link>
          <Link to="/editor">{t('nav.builder')}</Link>
          <a href="https://github.com/tensorflow/playground" target="_blank" rel="noopener">GitHub</a>
        </div>
        <p className={styles.footNote}>{t('footer.tagline')}</p>
      </footer>
    </div>
  );
}
