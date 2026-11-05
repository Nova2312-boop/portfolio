import Modal from './Modal.jsx';
import { assetUrl, isDemo } from '../api.js';

/** Petites icônes du bloc coordonnées (traits fins, couleur du texte). */
const ICON = {
  phone: 'M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z',
  mail: 'M3 5h18v14H3z M3 6l9 7 9-7',
  pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  code: 'M8 7l-5 5 5 5 M16 7l5 5-5 5',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  car: 'M5 16h14 M4 16v-4l2-5h12l2 5v4 M7 19a1.5 1.5 0 1 0 0-3 M17 19a1.5 1.5 0 1 0 0-3',
};
const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);

/** Découpe un texte d'expérience en points (une phrase = un point). */
const points = (text = '') =>
  text
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Ý])/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean);

/** « 2026 — aujourd'hui » devient « Depuis 2026 », les tirets sont harmonisés. */
const period = (when = '') => {
  const m = /^(\d{4})\s*[—–-]\s*aujourd/i.exec(when);
  return m ? `Depuis ${m[1]}` : when.replace(/\s*[—-]\s*/g, ' – ');
};

/** CV au format A4, généré depuis profile.json (même contenu que le PDF téléchargeable). */
export default function CV({ open, onClose, profile }) {
  const c = profile.contact;
  const cv = profile.cv || {};
  const permis = profile.specs?.find((s) => /permis/i.test(s.label))?.value;
  const contact = [
    c.phone && [ICON.phone, c.phone],
    c.email && [ICON.mail, c.email],
    profile.location && [ICON.pin, profile.location],
    c.github && [ICON.code, c.github.replace(/^https?:\/\//, '')],
    c.linkedin && [ICON.link, c.linkedin.replace(/^https?:\/\/(www\.)?/, '')],
    permis && [ICON.car, `Permis ${permis}`],
  ].filter(Boolean);
  const langs = cv.languages?.length ? cv.languages : profile.languages.map((l) => ({ name: l.name, level: null }));

  return (
    <Modal open={open} onClose={onClose} label="Curriculum vitae" className="modal-cv">
      <div className="cv-actions">
        <span className="mono muted">~/cv/{profile.handle}.pdf</span>
        <div className="cta">
          {cv.file && (
            <a className="btn" href={assetUrl(cv.file)} download>
              Télécharger le PDF ↓
            </a>
          )}
          {!isDemo && !cv.file && (
            <button className="btn ghost" onClick={() => window.print()}>
              Enregistrer en PDF
            </button>
          )}
        </div>
      </div>

      <article className="cv-sheet cv3">
        <aside className="cv3-side">
          {cv.photo && (
            <div className="cv3-photo">
              <img src={assetUrl(cv.photo)} alt={`Photo de ${profile.name}`} />
            </div>
          )}

          <section>
            <h2>Profil</h2>
            <p>{cv.summary}</p>
          </section>

          <section>
            <h2>Coordonnées</h2>
            <ul className="cv3-contact">
              {contact.map(([d, t]) => (
                <li key={t}>
                  <Icon d={d} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Langues</h2>
            <ul className="cv3-langs">
              {langs.map((l) => (
                <li key={l.name}>
                  <span>{l.name}</span>
                  {typeof l.level === 'number' && (
                    <i>
                      <b style={{ width: `${l.level}%` }} />
                    </i>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {cv.toolGroups?.length > 0 && (
            <section>
              <h2>Outils</h2>
              {cv.toolGroups.map((g) => (
                <div className="cv3-tools" key={g.label}>
                  <h4>{g.label}</h4>
                  <p>{g.value}</p>
                </div>
              ))}
            </section>
          )}

          {cv.interests?.length > 0 && (
            <section>
              <h2>Intérêts</h2>
              {cv.interests.map((x) => (
                <div className="cv3-tools" key={x.label + x.value}>
                  <h4>{x.label}</h4>
                  <p>{x.value}</p>
                </div>
              ))}
            </section>
          )}
        </aside>

        <div className="cv3-main">
          <header>
            <h1>{profile.name}</h1>
            <div className="cv3-role">{cv.title || profile.roles.slice(0, 2).join(' · ')}</div>
          </header>

          <section>
            <h2>Formation</h2>
            <ul className="cv3-tl">
              {profile.education.map((e) => (
                <li key={e.when + e.title}>
                  <div className="cv3-row">
                    <h3>{e.title}</h3>
                    <em>{period(e.when)}</em>
                  </div>
                  <div className="cv3-org">{e.org === 'ESATIC' ? 'ESATIC · Abidjan' : e.org}</div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Expérience professionnelle</h2>
            <ul className="cv3-tl">
              {profile.experience.map((e) => (
                <li key={e.when + e.title}>
                  <div className="cv3-row">
                    <h3>{e.title}</h3>
                    <em>{period(e.when)}</em>
                  </div>
                  <div className="cv3-org cv3-org-i">{e.org}</div>
                  <ul className="cv3-pts">
                    {points(e.text).map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </article>
    </Modal>
  );
}
