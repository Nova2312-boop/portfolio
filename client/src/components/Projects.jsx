import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SectionHead from './SectionHead.jsx';
import MiniViz from './MiniViz.jsx';
import ProjectDetail from './ProjectDetail.jsx';
import HoloShowcase from './HoloShowcase.jsx';
import { reducedMotion } from '../hooks/motion.js';
import { assetUrl } from '../api.js';

const HASH = 'projet-';

/** Carte entièrement cliquable, avec inclinaison 3D et reflet qui suit la souris. */
function TiltCard({ project, onOpen }) {
  const ref = useRef(null);
  const move = (e) => {
    if (reducedMotion()) return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.transform = `rotateY(${(x - 0.5) * 10}deg) rotateX(${(0.5 - y) * 10}deg)`;
    el.style.setProperty('--gx', `${x * 100}%`);
    el.style.setProperty('--gy', `${y * 100}%`);
  };
  const leave = () => (ref.current.style.transform = '');
  const cover = project.images?.[0];
  const coverSrc = assetUrl(typeof cover === 'string' ? cover : cover?.src);

  return (
    <article className="card">
      <div
        ref={ref}
        className="card-in clickable"
        role="button"
        tabIndex={0}
        aria-label={`Voir le détail du projet ${project.title}`}
        onMouseMove={move}
        onMouseLeave={leave}
        onClick={() => onOpen(project)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(project))}
      >
        <div className="glare" />
        <div className="vis">
          {coverSrc ? <img className="cover" src={coverSrc} alt="" /> : <MiniViz type={project.viz} />}
          <span className="open-hint">ouvrir le projet ↗</span>
        </div>
        <div className="tag">
          {project.tag} · {project.year}
        </div>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <div className="stack">
          {project.stack.map((s) => (
            <span key={s}>{s}</span>
          ))}
        </div>
        <div className="card-foot">
          <span className="metric">{project.metric}</span>
          <span className="link-btn">détails →</span>
        </div>
      </div>
    </article>
  );
}

export default function Projects({ projects }) {
  const cats = useMemo(() => ['Tous', ...new Set(projects.map((p) => p.category))], [projects]);
  const [cat, setCat] = useState('Tous');
  const [openSlug, setOpenSlug] = useState(null);
  const list = cat === 'Tous' ? projects : projects.filter((p) => p.category === cat);

  // Lien direct vers un projet : monsite.com/#projet-payflow-ci
  useEffect(() => {
    const fromHash = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      setOpenSlug(h.startsWith(HASH) && projects.some((p) => p.slug === h.slice(HASH.length)) ? h.slice(HASH.length) : null);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [projects]);

  const open = useCallback((p) => {
    setOpenSlug(p.slug);
    history.replaceState(null, '', `#${HASH}${p.slug}`);
  }, []);
  const close = useCallback(() => {
    setOpenSlug(null);
    history.replaceState(null, '', '#projects');
  }, []);

  const idx = list.findIndex((p) => p.slug === openSlug);
  const nav = list.length ? list : projects;
  const i = idx === -1 ? projects.findIndex((p) => p.slug === openSlug) : idx;
  const pool = idx === -1 ? projects : list;
  const current = pool[i];
  const go = useCallback((d) => open(pool[(i + d + pool.length) % pool.length]), [open, pool, i]);
  const onPrev = useCallback(() => go(-1), [go]);
  const onNext = useCallback(() => go(1), [go]);

  return (
    <section id="projects">
      <div className="wrap">
        <SectionHead addr="0x05" title="Projets" />
        <HoloShowcase projects={projects} onOpen={open} />
        <div className="filters" role="tablist" aria-label="Filtrer les projets">
          {cats.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>
              {c}
              <sup>{c === 'Tous' ? projects.length : projects.filter((p) => p.category === c).length}</sup>
            </button>
          ))}
        </div>
        <div className="grid">
          {nav.map((p) => (
            <TiltCard key={p.slug} project={p} onOpen={open} />
          ))}
        </div>
      </div>
      {current && (
        <ProjectDetail
          project={current}
          index={i}
          total={pool.length}
          next={pool[(i + 1) % pool.length] !== current ? pool[(i + 1) % pool.length] : null}
          onClose={close}
          onPrev={onPrev}
          onNext={onNext}
        />
      )}
    </section>
  );
}
