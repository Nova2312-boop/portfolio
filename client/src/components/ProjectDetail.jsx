import { useEffect, useRef, useState } from 'react';
import MiniViz from './MiniViz.jsx';
import { assetUrl } from '../api.js';

const pad = (n) => String(n).padStart(2, '0');
const toImg = (im) => (typeof im === 'string' ? { src: assetUrl(im), caption: '' } : { ...im, src: assetUrl(im.src) });

/** Cadre de navigateur affiché tant qu'aucune capture n'est fournie. */
function Placeholder({ project, label }) {
  return (
    <div className="pd-ph">
      <MiniViz type={project.viz} />
      <span>{label}</span>
    </div>
  );
}

function Gallery({ project }) {
  const images = (project.images || []).map(toImg);
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);

  useEffect(() => setI(0), [project.slug]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setZoom(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [zoom]);

  const cur = images[i];
  return (
    <div className="pd-gallery">
      <div className="pd-frame">
        <div className="pd-frame-bar">
          <i /><i /><i />
          <span>{project.demo ? project.demo.replace(/^https?:\/\//, '') : `${project.slug}.app`}</span>
        </div>
        {cur ? (
          <button className="pd-shot" onClick={() => setZoom(true)} aria-label="Agrandir la capture">
            <img src={cur.src} alt={cur.caption || `Capture de ${project.title}`} />
          </button>
        ) : (
          <Placeholder project={project} label="Ajoute tes captures d'écran dans images[]" />
        )}
      </div>
      {cur?.caption && <div className="pd-caption">{cur.caption}</div>}
      {images.length > 1 && (
        <div className="pd-thumbs">
          {images.map((im, k) => (
            <button key={im.src} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Capture ${k + 1}`}>
              <img src={im.src} alt="" />
            </button>
          ))}
        </div>
      )}
      {zoom && cur && (
        <div className="lightbox" onClick={() => setZoom(false)}>
          <img src={cur.src} alt={cur.caption || ''} />
          {cur.caption && <p>{cur.caption}</p>}
        </div>
      )}
    </div>
  );
}

/** Page de détail plein écran d'un projet. ← → pour naviguer, Échap pour fermer. */
export default function ProjectDetail({ project: p, index, total, next, onClose, onPrev, onNext }) {
  const scroller = useRef(null);
  const [openChallenge, setOpenChallenge] = useState(0);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    setOpenChallenge(0);
  }, [p.slug]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onNext, onPrev]);

  const meta = [
    ['Année', p.year],
    ['Rôle', p.role],
    ['Client', p.client],
    ['Durée', p.duration],
    ['Équipe', p.team],
    ['Statut', p.status],
  ].filter(([, v]) => v);

  return (
    <div className="pd" role="dialog" aria-modal="true" aria-label={p.title}>
      <div className="pd-bar">
        <span className="pd-path">
          ~/projets/<b>{p.slug}</b>
        </span>
        <div className="pd-nav">
          <button onClick={onPrev} aria-label="Projet précédent">←</button>
          <span>
            {pad(index + 1)} / {pad(total)}
          </span>
          <button onClick={onNext} aria-label="Projet suivant">→</button>
          <button className="pd-close" onClick={onClose}>
            fermer ✕
          </button>
        </div>
      </div>

      <div className="pd-scroll" ref={scroller}>
        <div className="wrap pd-body" key={p.slug}>
          <header className="pd-head fade-in">
            <div className="tag">
              {p.tag} · {p.category}
            </div>
            <h1>{p.title}</h1>
            {p.tagline && <p className="pd-tagline">{p.tagline}</p>}
            <dl className="pd-meta">
              {meta.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </header>

          <Gallery project={p} />

          <div className="pd-results">
            {p.results.map((r) => (
              <div key={r.label}>
                <div className="pd-rv">{r.value}</div>
                <div className="pd-rl">{r.label}</div>
              </div>
            ))}
          </div>

          <div className="pd-cols">
            <div className="pd-main">
              <section className="pd-sec">
                <h2 className="mini-h">01 · Contexte</h2>
                <p className="pd-lead">{p.problem}</p>
              </section>
              <section className="pd-sec">
                <h2 className="mini-h">02 · Solution</h2>
                <p>{p.solution}</p>
              </section>
              {p.features?.length > 0 && (
                <section className="pd-sec">
                  <h2 className="mini-h">03 · Fonctionnalités clés</h2>
                  <ul className="pd-features">
                    {p.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </section>
              )}
              {p.challenges?.length > 0 && (
                <section className="pd-sec">
                  <h2 className="mini-h">04 · Défis techniques</h2>
                  <div className="pd-challenges">
                    {p.challenges.map((c, k) => (
                      <div key={c.title} className={`pd-ch ${openChallenge === k ? 'open' : ''}`}>
                        <button aria-expanded={openChallenge === k} onClick={() => setOpenChallenge(openChallenge === k ? -1 : k)}>
                          <span className="addr">ERR_{pad(k + 1)}</span>
                          <span>{c.title}</span>
                          <i aria-hidden="true">+</i>
                        </button>
                        <div className="faq-a">
                          <div>
                            <p>
                              <span className="ok-text mono">FIX › </span>
                              {c.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {p.learnings && (
                <section className="pd-sec">
                  <h2 className="mini-h">05 · Ce que j'en retiens</h2>
                  <blockquote className="pd-quote">{p.learnings}</blockquote>
                </section>
              )}
            </div>

            <aside className="pd-side">
              <div className="pd-box">
                <h2 className="mini-h">Architecture</h2>
                {Object.entries(p.architecture || {}).map(([layer, items]) => (
                  <div className="pd-layer" key={layer}>
                    <div className="pd-layer-name">{layer}</div>
                    <div className="stack">
                      {items.map((s) => (
                        <span key={s}>{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pd-box">
                <h2 className="mini-h">Liens</h2>
                <div className="pd-links">
                  {p.demo ? (
                    <a className="btn" href={p.demo} target="_blank" rel="noopener noreferrer">Voir le site en ligne ↗</a>
                  ) : (
                    <span className="muted mono">Démo non publique</span>
                  )}
                  {p.link && (
                    <a className="btn ghost" href={p.link} target="_blank" rel="noopener noreferrer">Code source ↗</a>
                  )}
                </div>
              </div>
            </aside>
          </div>

          {next && (
            <button className="pd-next" onClick={onNext}>
              <span className="addr">Projet suivant →</span>
              <span className="pd-next-title">{next.title}</span>
              <span className="muted">{next.tagline}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
