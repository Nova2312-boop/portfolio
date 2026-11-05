import { useState } from 'react';
import Reveal from './Reveal.jsx';
import { sendContact } from '../api.js';

const EMPTY = { name: '', email: '', subject: 'Projet freelance', message: '', website: '' };
const SUBJECTS = ['Projet freelance', 'Offre d\'emploi', 'Collaboration', 'Autre'];

/** Formulaire relié à POST /api/contact (validation côté serveur + anti-spam). */
export default function Contact({ contact, availability }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [demo, setDemo] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setState('sending');
    setErrors({});
    try {
      const payload = { ...form, message: `[${form.subject}] ${form.message}` };
      const r = await sendContact(payload);
      setDemo(!!r.demo);
      setForm(EMPTY);
      setState('sent');
    } catch (err) {
      if (err.status === 400) {
        setErrors(err.data?.errors || {});
        return setState('idle');
      }
      setErrors({ global: err.message || "Le message n'a pas pu partir. Vérifie ta connexion et réessaie." });
      setState('error');
    }
  };

  const copy = () =>
    navigator.clipboard
      .writeText(contact.email)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => {});

  return (
    <section id="contact">
      <div className="wrap">
        <div className="contact">
          <Reveal>
            <div className="addr">0x0A</div>
            <p className="big">
              Un projet ?<br />
              <em>On en parle.</em>
            </p>
            <p className="muted">{availability.label ? `${availability.label}. ` : ''}Je réponds en général sous 24 h.</p>
            <div className="links">
              <div className="row">
                <span>email</span>
                <span>{contact.email}</span>
                <button className="copy" onClick={copy}>{copied ? 'copié ✓' : 'copier'}</button>
              </div>
              {contact.whatsapp && (
                <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <span>whatsapp</span>
                  <span>{contact.phone} ↗</span>
                </a>
              )}
              <a href={contact.github} target="_blank" rel="noopener noreferrer"><span>github</span><span>{contact.github.replace('https://', '')} ↗</span></a>
              <a href={contact.linkedin} target="_blank" rel="noopener noreferrer"><span>linkedin</span><span>{contact.linkedin.replace('https://', '')} ↗</span></a>
            </div>
          </Reveal>

          <Reveal as="form" className="form" onSubmit={submit} noValidate>
            <div className="form-bar">POST /api/contact</div>

            <label htmlFor="f-subject">Sujet</label>
            <div className="seg" id="f-subject" role="radiogroup">
              {SUBJECTS.map((s) => (
                <button type="button" key={s} role="radio" aria-checked={form.subject === s} className={form.subject === s ? 'on' : ''} onClick={() => setForm({ ...form, subject: s })}>
                  {s}
                </button>
              ))}
            </div>

            <div className="form-row">
              <div>
                <label htmlFor="f-name">Nom</label>
                <input id="f-name" value={form.name} onChange={set('name')} placeholder="Awa Koné" />
                {errors.name && <small className="err">{errors.name}</small>}
              </div>
              <div>
                <label htmlFor="f-email">Email</label>
                <input id="f-email" type="email" value={form.email} onChange={set('email')} placeholder="awa@entreprise.ci" />
                {errors.email && <small className="err">{errors.email}</small>}
              </div>
            </div>

            <label htmlFor="f-msg">Message</label>
            <textarea id="f-msg" rows="5" value={form.message} onChange={set('message')} placeholder="Parle-moi de ton projet, de ton budget et de tes délais…" />
            {errors.message && <small className="err">{errors.message}</small>}

            {/* champ piège anti-robot, invisible pour les humains */}
            <input className="hp" tabIndex="-1" autoComplete="off" value={form.website} onChange={set('website')} aria-hidden="true" />

            <button className="btn" type="submit" disabled={state === 'sending'}>
              {state === 'sending' ? 'Envoi…' : 'Envoyer le message →'}
            </button>
            {state === 'sent' && (
              <p className="ok-text mono">
                {demo ? '✔ Aperçu : le formulaire fonctionne, mais rien n\'est envoyé ici. Sur ton site, le message arrive sur ton serveur Node.' : '✔ 201 Created — message reçu, je te réponds vite.'}
              </p>
            )}
            {errors.global && <p className="err">{errors.global}</p>}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
