import { useCallback, useEffect, useState } from 'react';

/**
 * Thème clair / sombre. Le choix est mémorisé ; sans choix, on suit le système.
 * Le thème est posé sur <html data-theme="…"> (déjà appliqué avant l'affichage par index.html).
 */
const KEY = 'portfolio-theme';

const saved = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const system = () => (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || saved() || system());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f4f7fb' : '#0a0e15');
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(KEY, next);
      } catch {}
      return next;
    });
  }, []);

  return [theme, toggle];
}
