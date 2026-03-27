import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import LanguageMenu from './LanguageMenu';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { t } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const showNavSearch = location.pathname !== '/' && location.pathname !== '/tutor';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/learn')) {
      const q = new URLSearchParams(location.search).get('q') || '';
      setSearch(q);
    }
  }, [location.pathname, location.search]);

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
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`} aria-label={t('layout.navAria')}>
        <Link to="/" className={styles.navBrand}>
          <span className={styles.brandBadge}>NN</span>
          <span>{t('nav.brand')}</span>
        </Link>
        <button
          type="button"
          className={styles.mobileToggle}
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={t('layout.toggleMenu')}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
        {showNavSearch ? (
          <form className={styles.navSearch} onSubmit={onSearchSubmit} role="search" aria-label={t('layout.searchAria')}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.navSearchInput}
              placeholder={t('layout.searchPlaceholder')}
              aria-label={t('layout.searchAria')}
            />
            <button type="submit" className={styles.navSearchBtn}>{t('layout.searchButton')}</button>
          </form>
        ) : null}
        <div className={`${styles.navRight} ${mobileOpen ? styles.navRightOpen : ''}`}>
          {user ? (
            <>
              <Link to="/learn" onClick={() => setMobileOpen(false)} className={styles.navLink}>{t('nav.learn')}</Link>
              <Link to="/tutor" onClick={() => setMobileOpen(false)} className={styles.navLink}>{t('nav.tutorLink')}</Link>
              <div className={styles.menuWrap}>
                <button type="button" className={styles.menuBtn} onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen}>
                  {t('nav.menu')} ▾
                </button>
                {menuOpen && (
                  <div className={styles.menu}>
                    <Link to="/profile" onClick={() => { setMenuOpen(false); setMobileOpen(false); }}>{t('nav.profile')}</Link>
                    <Link to="/quiz" onClick={() => { setMenuOpen(false); setMobileOpen(false); }}>{t('nav.quiz')}</Link>
                    <Link to="/editor" onClick={() => { setMenuOpen(false); setMobileOpen(false); }}>{t('nav.builder')}</Link>
                    <Link to="/about" onClick={() => { setMenuOpen(false); setMobileOpen(false); }}>{t('nav.about')}</Link>
                    <button type="button" onClick={handleLogout}>{t('nav.logout')}</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)} className={styles.navLinkCta}>{t('nav.signIn')}</Link>
          )}
          {!user ? <Link to="/about" onClick={() => setMobileOpen(false)} className={styles.navLink}>{t('nav.about')}</Link> : null}
          <Link to="/editor" onClick={() => setMobileOpen(false)} className={styles.navLinkMuted}>{t('nav.builder')}</Link>
          <LanguageMenu />
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
