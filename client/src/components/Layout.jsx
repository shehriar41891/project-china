import React, { useEffect, useState, useMemo } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LocaleContext';
import { api } from '../api/client';
import LanguageMenu from './LanguageMenu';
import styles from './Layout.module.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { t, chapterText, locale } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [navChapters, setNavChapters] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
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

  useEffect(() => {
    if (!user) {
      setNavChapters([]);
      return;
    }
    api('/api/chapters')
      .then((data) => setNavChapters(data.chapters || []))
      .catch(() => setNavChapters([]));
  }, [user]);

  const searchMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !navChapters.length) return [];
    return navChapters
      .filter((c) => {
        const raw = (c.title || '').toLowerCase();
        const loc = chapterText(c.slug, 'title', c.title).toLowerCase();
        const slug = (c.slug || '').toLowerCase();
        return raw.includes(q) || loc.includes(q) || slug.includes(q);
      })
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .slice(0, 12);
  }, [navChapters, search, chapterText, locale]);

  const showChapterDropdown = Boolean(
    showNavSearch && user && search.trim().length >= 1 && searchFocused
  );

  function goToChapter(slug) {
    navigate(`/learn/${slug}`);
    setSearch('');
    setMobileOpen(false);
  }

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
          <div className={styles.navSearchWrap}>
            <form className={styles.navSearch} onSubmit={onSearchSubmit} role="search" aria-label={t('layout.searchAria')}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => {
                  window.setTimeout(() => setSearchFocused(false), 200);
                }}
                className={styles.navSearchInput}
                placeholder={t('layout.searchPlaceholder')}
                aria-label={t('layout.searchAria')}
                autoComplete="off"
                aria-expanded={showChapterDropdown}
                aria-controls="nav-chapter-suggest"
              />
              <button type="submit" className={styles.navSearchBtn}>{t('layout.searchButton')}</button>
            </form>
            {showChapterDropdown ? (
              <div id="nav-chapter-suggest" className={styles.searchDropdown} role="listbox">
                <div className={styles.searchDropdownLabel}>{t('layout.searchChapters')}</div>
                {searchMatches.length === 0 ? (
                  <div className={styles.searchDropdownEmpty} role="option">{t('layout.searchNoResults')}</div>
                ) : (
                  searchMatches.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="option"
                      className={styles.searchDropdownItem}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        goToChapter(c.slug);
                      }}
                    >
                      <span className={styles.searchDropdownTitle}>{chapterText(c.slug, 'title', c.title)}</span>
                      <span className={styles.searchDropdownMeta}>{c.slug}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className={`${styles.navRight} ${mobileOpen ? styles.navRightOpen : ''}`}>
          <Link to="/how-it-works" onClick={() => setMobileOpen(false)} className={styles.navLinkMuted}>
            {t('nav.howItWorks')}
          </Link>
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
                    <Link to="/quiz" onClick={() => { setMenuOpen(false); setMobileOpen(false); }}>{t('nav.quiz')}</Link>
                    <Link to="/editor" onClick={() => { setMenuOpen(false); setMobileOpen(false); }}>{t('nav.builder')}</Link>
                    <button type="button" onClick={handleLogout}>{t('nav.logout')}</button>
                  </div>
                )}
              </div>
            </>
          ) : null}
          <Link to="/editor" onClick={() => setMobileOpen(false)} className={styles.navLinkMuted}>{t('nav.builder')}</Link>
          <LanguageMenu />
          {user ? (
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className={styles.navProfileBtn}
              aria-label={t('nav.profile')}
              title={t('nav.profile')}
            >
              <span className={styles.navProfileIcon} aria-hidden>
                {(user.name || user.email || '?').charAt(0).toUpperCase()}
              </span>
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className={`${styles.navLinkCta} ${styles.navSignInEnd}`}
            >
              {t('nav.signIn')}
            </Link>
          )}
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
          <Link to="/how-it-works">{t('nav.howItWorks')}</Link>
          <Link to="/editor">{t('nav.builder')}</Link>
        </div>
        <p className={styles.footNote}>{t('footer.tagline')}</p>
      </footer>
    </div>
  );
}
