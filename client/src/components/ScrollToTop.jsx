import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scrolls to top on client-side navigation (e.g. opening Tutor from bottom of home). */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
