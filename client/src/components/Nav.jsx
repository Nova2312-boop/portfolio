import { useEffect, useState } from 'react';

export const SECTIONS = [
  ['about', 'profil'],
  ['services', 'services'],
  ['projects', 'projets'],
  ['parcours', 'parcours'],
  ['github', 'github'],
  ['contact', 'contact'],
];

export default function Nav({ profile, onPalette, onOpenCV, theme, toggleTheme }) {
  const [time, setTime] = useState('--:--:--');
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState('');

  useEffect(() => {
    const fmt = () =>
      setTime(new Date().toLocaleTimeString('fr-FR', { timeZone: profile.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, [profile.timezone]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      setProgress((h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) * 100);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    // section active dans le menu
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' }
    );
    document.querySelectorAll('section[id]').forEach((s) => io.observe(s));
    return () => {
      window.removeEventListener('scroll', onScroll);
      io.disconnect();
    };
  }, []);

  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <>
      <div className="progress" style={{ width: `${progress}%` }} />
      <nav>
        <div className="nav-in">
          <a href="#top" className="logo">
            ~/<b>{profile.handle}</b>.dev
          </a>
          <div className="nav-links">
            {SECTIONS.map(([id, label]) => (
              <a key={id} href={`#${id}`} className={active === id ? 'on' : ''}>
                ./{label}
              </a>
            ))}
          </div>
          <div className="nav-right">
            <div className="status">
              <span className={`dot ${profile.availability.available ? '' : 'off'}`} />
              ABJ {time}
            </div>
            <button className="nav-btn theme-btn" onClick={toggleTheme} aria-label={theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'} title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {theme === 'light' ? (
                  <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
                ) : (
                  <>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8" />
                  </>
                )}
              </svg>
            </button>
            <button className="nav-btn" onClick={onOpenCV}>CV</button>
            <button className="nav-btn" onClick={onPalette} aria-label="Ouvrir la palette de commandes">
              <span className="hide-sm">{mac ? '⌘' : 'Ctrl'} K</span>
              <span className="show-sm">menu</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
