import { useEffect, useState } from 'react';

export const SECTIONS = [
  ['about', 'profil'],
  ['services', 'services'],
  ['projects', 'projets'],
  ['parcours', 'parcours'],
  ['github', 'github'],
  ['contact', 'contact'],
];

export default function Nav({ profile, onPalette, onOpenCV }) {
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
