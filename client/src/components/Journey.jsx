import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import SectionHead from './SectionHead.jsx';
import { ExpBot, SyncDrone } from './JourneyBots.jsx';
import { useInView, reducedMotion } from '../hooks/motion.js';

const SYNC_MS = 1300; // le drone synchronise une formation toutes les 1,3 s

function Event({ ev, className = '', innerRef, ...rest }) {
  return (
    <div ref={innerRef} className={`ev fade-in ${className}`} {...rest}>
      <div className="when">{ev.when}</div>
      <h3>{ev.title}</h3>
      <div className="org">{ev.org}</div>
      <p>{ev.text}</p>
      {ev.tags && (
        <div className="stack ev-tags">
          {ev.tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Expérience : un robot hologramme reste à côté de la frise pendant le défilement
 * et joue le rôle de l'expérience qui passe au milieu de l'écran (ou de celle survolée).
 */
function Experience({ items }) {
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState(-1);
  const refs = useRef([]);

  useEffect(() => {
    // une expérience devient active quand elle traverse la bande centrale de l'écran
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number(e.target.dataset.i))),
      { rootMargin: '-45% 0px -45% 0px' }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [items.length]);

  const cur = hover >= 0 ? hover : active;
  return (
    <div className="xp-wrap">
      <ExpBot ev={items[cur]} index={cur} />
      <div className="tl" onMouseLeave={() => setHover(-1)}>
        {items.map((ev, i) => (
          <Event
            key={ev.when + ev.title}
            ev={ev}
            innerRef={(el) => (refs.current[i] = el)}
            data-i={i}
            className={i === cur ? 'on' : ''}
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </div>
    </div>
  );
}

/** Formation : le drone en haut synchronise les diplômes un à un, son faisceau descend sur la frise. */
function Education({ items, inView }) {
  const still = reducedMotion();
  const [sync, setSync] = useState(still ? items.length - 1 : 0);
  const [beam, setBeam] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    if (!inView || still) return;
    // on laisse l'ensemble « synchronisé » un temps avant de recommencer
    const id = setInterval(() => setSync((s) => (s + 1) % (items.length + 2)), SYNC_MS);
    return () => clearInterval(id);
  }, [inView, still, items.length]);

  const cur = Math.min(sync, items.length - 1);
  useLayoutEffect(() => {
    const el = refs.current[cur];
    if (el) setBeam(el.offsetTop + 14);
  }, [cur, items.length]);

  const done = sync >= items.length - 1;
  const label = done ? `SYNC OK · ${items.length}/${items.length} formations` : `SYNC ${String(cur + 1).padStart(2, '0')}/${String(items.length).padStart(2, '0')} · ${items[cur]?.title}`;
  return (
    <div className="tl tl-sync">
      <SyncDrone label={label} />
      <div className="sync-beam" style={{ height: beam }} aria-hidden="true">
        <i />
      </div>
      {items.map((ev, i) => (
        <div key={ev.when + ev.title} ref={(el) => (refs.current[i] = el)}>
          <Event ev={ev} className={`${i <= sync ? 'synced' : ''} ${i === cur && !done ? 'on' : ''}`} />
        </div>
      ))}
    </div>
  );
}

/** Parcours en onglets : expérience, formation, certifications. */
export default function Journey({ profile }) {
  const tabs = [
    ['experience', 'Expérience', profile.experience.length],
    ['education', 'Formation', profile.education.length],
    ['certs', 'Certifications', profile.certifications.length],
  ];
  const [tab, setTab] = useState('experience');
  const [ref, inView] = useInView(0.2);

  return (
    <section id="parcours" ref={ref}>
      <div className="wrap">
        <SectionHead addr="0x06" title="Parcours" />
        <div className="filters" role="tablist" aria-label="Parcours">
          {tabs.map(([id, label, n]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
              {label}
              <sup>{n}</sup>
            </button>
          ))}
        </div>

        {tab === 'experience' && <Experience key="xp" items={profile.experience} />}
        {tab === 'education' && <Education key="edu" items={profile.education} inView={inView} />}
        {tab === 'certs' && (
          <div className="certs">
            {profile.certifications.map((c) => {
              const Tag = c.link ? 'a' : 'div';
              return (
                <Tag className="cert fade-in" key={c.name} {...(c.link ? { href: c.link, target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  <div className="cert-seal" aria-hidden="true">✓</div>
                  <div>
                    <h3>{c.name}</h3>
                    <div className="org">
                      {c.issuer} · {c.year}
                    </div>
                  </div>
                  {c.link && <span className="cert-go">vérifier ↗</span>}
                </Tag>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
