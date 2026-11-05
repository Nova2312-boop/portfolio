import Modal from './Modal.jsx';
import { assetUrl, isDemo } from '../api.js';

/** CV complet généré depuis profile.json, imprimable en PDF. */
export default function CV({ open, onClose, profile }) {
  const c = profile.contact;
  const allSkills = profile.skills.flatMap((g) => g.items.map((i) => i.name));

  return (
    <Modal open={open} onClose={onClose} label="Curriculum vitae" className="modal-cv">
      <div className="cv-actions">
        <span className="mono muted">~/cv/{profile.handle}.pdf</span>
        <div className="cta">
          {profile.cv.file && (
            <a className="btn" href={assetUrl(profile.cv.file)} download>
              Télécharger le PDF ↓
            </a>
          )}
          {!isDemo && (
            <button className="btn ghost" onClick={() => window.print()}>
              Enregistrer en PDF
            </button>
          )}
        </div>
      </div>

      <article className="cv-sheet">
        <header className="cv-head">
          <div>
            <h1>{profile.name}</h1>
            <div className="cv-role">{profile.roles[0]}</div>
          </div>
          <ul className="cv-contact">
            <li>{c.email}</li>
            <li>{c.phone}</li>
            <li>{profile.location}</li>
            <li>{c.github.replace('https://', '')}</li>
            <li>{c.linkedin.replace('https://', '')}</li>
          </ul>
        </header>

        <p className="cv-summary">{profile.cv.summary}</p>

        <div className="cv-cols">
          <div>
            <h2>Expérience</h2>
            {profile.experience.map((e) => (
              <div className="cv-item" key={e.when + e.title}>
                <div className="cv-when">{e.when}</div>
                <h3>{e.title}</h3>
                <div className="cv-org">{e.org}</div>
                <p>{e.text}</p>
              </div>
            ))}
            <h2>Projets choisis</h2>
            {profile.projects.slice(0, 3).map((p) => (
              <div className="cv-item" key={p.title}>
                <h3>
                  {p.title} <span className="cv-org">· {p.year}</span>
                </h3>
                <p>{p.results[0] ? `${p.results[0].value} ${p.results[0].label}. ` : ''}{p.stack.join(', ')}.</p>
              </div>
            ))}
          </div>
          <aside>
            <h2>Formation</h2>
            {profile.education.map((e) => (
              <div className="cv-item" key={e.title}>
                <div className="cv-when">{e.when}</div>
                <h3>{e.title}</h3>
                <div className="cv-org">{e.org}</div>
              </div>
            ))}
            <h2>Compétences</h2>
            <p className="cv-tags">{allSkills.join(' · ')}</p>
            <h2>Outils</h2>
            <p className="cv-tags">{profile.tools.join(' · ')}</p>
            <h2>Certifications</h2>
            {profile.certifications.map((x) => (
              <div className="cv-item" key={x.name}>
                <h3>{x.name}</h3>
                <div className="cv-org">
                  {x.issuer} · {x.year}
                </div>
              </div>
            ))}
            <h2>Langues</h2>
            {profile.languages.map((l) => (
              <div key={l.name} className="cv-lang">
                <b>{l.name}</b> — {l.level}
              </div>
            ))}
          </aside>
        </div>
      </article>
    </Modal>
  );
}
