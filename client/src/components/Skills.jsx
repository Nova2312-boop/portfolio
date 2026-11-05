import SectionHead from './SectionHead.jsx';
import Reveal from './Reveal.jsx';
import { useInView } from '../hooks/motion.js';

/** Compétences présentées comme un moniteur système (un "processus" par domaine). */
export default function Skills({ profile }) {
  const [ref, inView] = useInView();
  return (
    <section id="skills">
      <div className="wrap">
        <SectionHead addr="0x04" title="Compétences" />
        <div className="mon" ref={ref}>
          {profile.skills.map((g, i) => (
            <div className="proc" key={g.group}>
              <h3>
                PID {String(i + 1).padStart(2, '0')} · {g.group}
              </h3>
              {g.items.map((s) => (
                <div className="bar" key={s.name}>
                  <div className="lbl">
                    <span>{s.name}</span>
                    <span>{s.level}%</span>
                  </div>
                  <div className="track">
                    <div className="fill" style={{ width: inView ? `${s.level}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="skills-extra">
          <Reveal>
            <h3 className="mini-h">Outils du quotidien</h3>
            <div className="stack">
              {profile.tools.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </Reveal>
          <Reveal>
            <h3 className="mini-h">Savoir-être</h3>
            <ul className="soft">
              {profile.softSkills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal>
            <h3 className="mini-h">Langues</h3>
            <ul className="soft">
              {profile.languages.map((l) => (
                <li key={l.name}>
                  <b>{l.name}</b> · {l.level}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
