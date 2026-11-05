import Modal from './Modal.jsx';
import { assetUrl, isDemo } from '../api.js';

/** Petites icônes du bloc contact (traits fins, couleur du texte). */
const ICON = {
  pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  mail: 'M3 5h18v14H3z M3 6l9 7 9-7',
  phone: 'M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z',
  code: 'M8 7l-5 5 5 5 M16 7l5 5-5 5 M14 4l-4 16',
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

const Title = ({ children }) => (
  <h2 className="cv2-h">
    {children}
    <i />
  </h2>
);

/** CV au format A4, généré depuis profile.json : colonne sombre (photo, profil, contact), contenu à droite. */
export default function CV({ open, onClose, profile }) {
  const c = profile.contact;
  const cv = profile.cv || {};
  const permis = profile.specs?.find((s) => /permis/i.test(s.label))?.value;
  const contact = [
    profile.location && [ICON.pin, profile.location],
    c.email && [ICON.mail, c.email],
    c.phone && [ICON.phone, c.phone],
    c.github && [ICON.code, c.github.replace(/^https?:\/\//, '')],
    c.linkedin && [ICON.link, c.linkedin.replace(/^https?:\/\/(www\.)?/, '')],
    permis && [ICON.car, `Permis ${permis}`],
  ].filter(Boolean);
  const stack = profile.skills.flatMap((g) => g.items.map((i) => i.name));

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
          {!isDemo && (
            <button className="btn ghost" onClick={() => window.print()}>
              Enregistrer en PDF
            </button>
          )}
        </div>
      </div>

      <article className="cv-sheet cv2">
        <aside className="cv2-side">
          {cv.photo && <img className="cv2-photo" src={assetUrl(cv.photo)} alt={`Photo de ${profile.name}`} />}

          <section>
            <Title>Profil</Title>
            <p className="cv2-profile">{cv.summary}</p>
          </section>

          <section>
            <Title>Contact</Title>
            <ul className="cv2-contact">
              {contact.map(([d, t]) => (
                <li key={t}>
                  <Icon d={d} />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>

          {cv.interests?.length > 0 && (
            <section>
              <Title>Intérêts</Title>
              <ul className="cv2-interests">
                {cv.interests.map((x) => (
                  <li key={x.label + x.value}>
                    <b>{x.label}</b>
                    <span>{x.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        <div className="cv2-main">
          <header className="cv2-head">
            <h1>{profile.name}</h1>
            <div className="cv2-role">{profile.roles.slice(0, 2).join(' · ')}</div>
          </header>

          <section>
            <Title>Formation</Title>
            <ul className="cv2-edu">
              {profile.education.map((e) => (
                <li key={e.when + e.title}>
                  <b>{e.when}</b> – {e.title} <span>– {e.org}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <Title>Expérience</Title>
            {profile.experience.map((e) => (
              <div className="cv2-job" key={e.when + e.title}>
                <div className="cv2-job-when">
                  <b>{e.when}</b>
                  <span>{e.org}</span>
                </div>
                <div>
                  <h3>{e.title}</h3>
                  <ul>
                    {points(e.text).map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </section>

          <section>
            <Title>Compétences</Title>
            <div className="cv2-skills">
              <div>
                <h4>Langues</h4>
                <ul className="cv2-lang">
                  {profile.languages.map((l) => (
                    <li key={l.name}>
                      <span>{l.name}</span>
                      <span>: {l.level}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Technologies</h4>
                <ul className="cv2-list">
                  {stack.slice(0, 8).map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Outils maîtrisés</h4>
                <ul className="cv2-list">
                  {profile.tools.slice(0, 8).map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      </article>
    </Modal>
  );
}
