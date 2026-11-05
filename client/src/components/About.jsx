import SectionHead from './SectionHead.jsx';
import Reveal from './Reveal.jsx';
import { useCountUp, useInView } from '../hooks/motion.js';

function Stat({ stat, active }) {
  const n = useCountUp(stat.value, active, 1400);
  return (
    <div className="stat">
      <div className="stat-n">
        {n.toLocaleString('fr-FR')}
        <span>{stat.suffix}</span>
      </div>
      <div className="stat-l">{stat.label}</div>
    </div>
  );
}

export default function About({ profile, onOpenCV }) {
  const [ref, inView] = useInView();
  const a = profile.availability;
  return (
    <section id="about">
      <div className="wrap">
        <SectionHead addr="0x01" title="Profil" />
        <div className="about">
          <Reveal>
            {profile.about.map((p) => (
              <p key={p.slice(0, 20)}>{p}</p>
            ))}
            <button className="btn" onClick={onOpenCV}>
              Consulter mon CV ↗
            </button>
          </Reveal>
          <div className="specs">
            {profile.specs.map((s) => (
              <div key={s.label}>
                <span>{s.label}</span>
                <span>{s.value}</span>
              </div>
            ))}
            <div>
              <span>Contrat</span>
              <span>{a.types.join(' · ')}</span>
            </div>
            <div>
              <span>Statut</span>
              <span className={a.available ? 'ok-text' : 'warn-text'}>● {a.available ? 'Disponible' : 'En mission'}</span>
            </div>
          </div>
        </div>
        <div className="stats" ref={ref}>
          {profile.stats.map((s) => (
            <Stat key={s.label} stat={s} active={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
