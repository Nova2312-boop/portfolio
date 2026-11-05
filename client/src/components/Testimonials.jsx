import { useEffect, useState } from 'react';
import SectionHead from './SectionHead.jsx';
import { reducedMotion } from '../hooks/motion.js';

/** Avis clients en carrousel automatique (pause au survol). */
export default function Testimonials({ items }) {
  const [i, setI] = useState(0);
  const [pause, setPause] = useState(false);

  useEffect(() => {
    if (pause || reducedMotion() || items.length < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % items.length), 6000);
    return () => clearInterval(id);
  }, [pause, items.length]);

  const t = items[i];
  return (
    <section id="avis">
      <div className="wrap">
        <SectionHead addr="0x08" title="Ils m'ont fait confiance" />
        <div className="testi" onMouseEnter={() => setPause(true)} onMouseLeave={() => setPause(false)}>
          <blockquote key={i} className="fade-in">
            {/* sans citation (pas encore recueillie), on présente la collaboration elle-même */}
            {t.quote ? <p>« {t.quote} »</p> : t.context && <p className="testi-ctx">{t.context}</p>}
            <footer>
              <b>{t.name}</b> · {t.role}
              {t.example && <span className="pill pill-dim">exemple à remplacer</span>}
            </footer>
          </blockquote>
          <div className="testi-nav">
            {items.map((_, k) => (
              <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Avis ${k + 1}`} />
            ))}
            <span className="mono muted">
              {String(i + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
