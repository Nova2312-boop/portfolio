import { useRef, useState } from 'react';
import { admin, assetUrl } from '../../api.js';

/**
 * Éditeur générique : le formulaire se construit à partir de la forme des données.
 * Un champ ajouté dans profile.json devient donc modifiable sans toucher à ce fichier.
 */

const LABELS = {
  name: 'Nom', handle: 'Identifiant (barre du haut)', location: 'Ville', coords: 'Coordonnées', timezone: 'Fuseau horaire',
  roles: 'Rôles (le 1er sert de titre)', tagline: "Phrase d'accroche", availability: 'Disponibilité', available: 'Disponible',
  label: 'Libellé', types: 'Types de contrat', about: 'Paragraphes « À propos »', specs: 'Fiche technique', value: 'Valeur',
  stats: 'Chiffres clés', suffix: 'Suffixe', marquee: 'Bandeau défilant', services: 'Offres', code: 'Code', title: 'Titre',
  description: 'Description', features: 'Fonctionnalités / points clés', price: 'Prix', delay: 'Délai', featured: 'Mise en avant',
  process: 'Étapes de la méthode', step: 'Étape', duration: 'Durée', text: 'Texte', skills: 'Compétences', group: 'Groupe',
  items: 'Éléments', level: 'Niveau', tools: 'Outils du quotidien', softSkills: 'Savoir-être', languages: 'Langues',
  projects: 'Projets', slug: 'Slug (adresse #projet-…)', category: 'Catégorie (sert de filtre)', tag: 'Étiquette', year: 'Année',
  role: 'Rôle', client: 'Client', team: 'Équipe', status: 'Statut', problem: 'Problème', solution: 'Solution',
  architecture: 'Architecture', challenges: 'Défis techniques', learnings: 'Ce que j’ai appris', results: 'Résultats chiffrés',
  stack: 'Stack (carte)', metric: 'Indicateur (carte)', viz: 'Animation si aucune capture', images: 'Captures',
  link: 'Lien du code source', demo: 'Lien du site en ligne', experience: 'Expérience', when: 'Période', org: 'Organisation',
  tags: 'Étiquettes', education: 'Formation', certifications: 'Certifications', issuer: 'Délivrée par', cv: 'CV',
  summary: 'Résumé', file: 'Fichier PDF', github: 'GitHub', username: 'Pseudo GitHub', repos: 'Dépôts affichés',
  language: 'Langage', platform: 'Plateforme', visibility: 'Visibilité', testimonials: 'Avis clients', quote: 'Citation',
  example: 'Exemple à remplacer', context: 'Collaboration (affichée tant qu’il n’y a pas de citation)', faq: 'Questions fréquentes', q: 'Question', a: 'Réponse', contact: 'Contact',
  email: 'Email', linkedin: 'LinkedIn', phone: 'Téléphone', whatsapp: 'WhatsApp (chiffres seulement)', src: 'Image',
  caption: 'Légende', photo: 'Photo', interests: 'Centres d’intérêt (CV)',
};
const LONG = new Set(['context', 'tagline', 'text', 'description', 'problem', 'solution', 'learnings', 'summary', 'quote', 'a', 'about']);
const SELECTS = { viz: ['wave', 'graph', 'bars'], visibility: ['privé', 'public'], platform: ['GitHub', 'GitLab', 'Bitbucket'] };
const DICTS = new Set(['architecture']);
const UPLOADS = { file: 'application/pdf', src: 'image/*', photo: 'image/*' };
const TITLE_KEYS = ['title', 'name', 'step', 'q', 'group', 'label', 'when', 'caption', 'value'];

// Modèles utilisés quand une liste est vide (sinon on part de la forme du premier élément)
const TEMPLATES = {
  roles: '', marquee: '', tools: '', softSkills: '', about: '', features: '', stack: '', types: '', tags: '',
  specs: { label: '', value: '' },
  stats: { value: 0, suffix: '', label: '' },
  services: { code: '', title: '', description: '', features: [], price: '', delay: '', featured: false },
  process: { step: '', duration: '', text: '' },
  skills: { group: '', items: [] },
  items: { name: '', level: 50 },
  languages: { name: '', level: '' },
  projects: {
    slug: '', title: '', tagline: '', category: 'Web', tag: '', year: '', role: '', client: '', duration: '', team: '', status: '',
    description: '', problem: '', solution: '', features: [], architecture: {}, challenges: [], learnings: '', results: [],
    stack: [], metric: '', viz: 'wave', images: [], link: '', demo: '',
  },
  challenges: { title: '', text: '' },
  results: { value: '', label: '' },
  images: { src: '', caption: '' },
  experience: { when: '', title: '', org: '', text: '', tags: [] },
  education: { when: '', title: '', org: '', text: '' },
  certifications: { name: '', issuer: '', year: '', link: '' },
  repos: { name: '', description: '', language: '', platform: 'GitHub', org: '', visibility: 'privé' },
  testimonials: { quote: '', name: '', role: '', context: '', example: false },
  faq: { q: '', a: '' },
  interests: { label: '', value: '' },
};

export const labelOf = (k) => LABELS[k] ?? k;

function blankLike(v) {
  if (Array.isArray(v)) return [];
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blankLike(x)]));
  if (typeof v === 'number') return 0;
  if (typeof v === 'boolean') return false;
  return '';
}
const templateFor = (k, arr) => (k in TEMPLATES ? structuredClone(TEMPLATES[k]) : arr.length ? blankLike(arr[0]) : '');

function itemTitle(item, i) {
  if (typeof item !== 'object' || !item) return `#${i + 1}`;
  const t = TITLE_KEYS.map((k) => item[k]).find((v) => typeof v === 'string' && v.trim());
  const extra = typeof item.level === 'number' ? ` · ${item.level} %` : '';
  return (t || `Élément ${i + 1}`) + extra;
}

const move = (arr, from, to) => {
  const out = [...arr];
  const [x] = out.splice(from, 1);
  out.splice(to, 0, x);
  return out;
};

function UploadButton({ accept, folder, onDone, label = 'Envoyer un fichier' }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    setErr('');
    try {
      const urls = [];
      for (const f of files) urls.push((await admin.upload(folder, f)).url);
      onDone(urls);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <span className="ad-upload">
      <button type="button" className="ad-btn" disabled={busy} onClick={() => input.current.click()}>
        {busy ? 'Envoi…' : label}
      </button>
      <input ref={input} type="file" accept={accept} multiple={accept.startsWith('image')} hidden onChange={pick} />
      {err && <span className="err">{err}</span>}
    </span>
  );
}

function Primitive({ k, value, onChange, ctx }) {
  if (typeof value === 'boolean') {
    return (
      <label className="ad-check">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} /> {labelOf(k)}
      </label>
    );
  }
  if (typeof value === 'number') {
    const isLevel = k === 'level';
    return (
      <div className="ad-num">
        <input type="number" value={value} min={isLevel ? 0 : undefined} max={isLevel ? 100 : undefined} onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))} />
        {isLevel && <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label="Niveau" />}
      </div>
    );
  }
  if (SELECTS[k]) {
    const opts = SELECTS[k].includes(value) ? SELECTS[k] : [value, ...SELECTS[k]];
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {opts.map((o) => (
          <option key={o} value={o}>{o || '—'}</option>
        ))}
      </select>
    );
  }
  const text = value ?? '';
  const input = LONG.has(k) || String(text).length > 90 ? (
    <textarea rows={Math.min(8, Math.max(3, Math.ceil(String(text).length / 80)))} value={text} onChange={(e) => onChange(e.target.value)} />
  ) : (
    <input type="text" value={text} onChange={(e) => onChange(e.target.value)} />
  );
  if (!UPLOADS[k]) return input;
  return (
    <div className="ad-filefield">
      {(k === 'src' || k === 'photo') && text && <img src={assetUrl(text)} alt="" />}
      {input}
      <UploadButton accept={UPLOADS[k]} folder={ctx.folder} label={k === 'file' ? 'Envoyer un PDF' : 'Remplacer l’image'} onDone={([u]) => onChange(u)} />
    </div>
  );
}

function ArrayField({ k, value, onChange, ctx }) {
  const primitive = value.length ? typeof value[0] !== 'object' : typeof TEMPLATES[k] !== 'object';
  const [open, setOpen] = useState(() => new Set());
  const set = (i, v) => onChange(value.map((x, j) => (j === i ? v : x)));
  const remove = (i) => {
    if (primitive || confirm(`Supprimer « ${itemTitle(value[i], i)} » ?`)) onChange(value.filter((_, j) => j !== i));
  };
  const add = () => {
    onChange([...value, templateFor(k, value)]);
    setOpen((s) => new Set(s).add(value.length));
  };
  const toggle = (i) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  const tools = (i) => (
    <span className="ad-tools">
      <button type="button" onClick={() => onChange(move(value, i, i - 1))} disabled={i === 0} aria-label="Monter">↑</button>
      <button type="button" onClick={() => onChange(move(value, i, i + 1))} disabled={i === value.length - 1} aria-label="Descendre">↓</button>
      {!primitive && (
        <button type="button" onClick={() => onChange([...value.slice(0, i + 1), structuredClone(value[i]), ...value.slice(i + 1)])} aria-label="Dupliquer" title="Dupliquer">⧉</button>
      )}
      <button type="button" className="ad-del" onClick={() => remove(i)} aria-label="Supprimer">✕</button>
    </span>
  );

  return (
    <div className="ad-array">
      {k === 'images' && (
        <UploadButton accept="image/*" folder={ctx.folder} label="Ajouter des captures" onDone={(urls) => onChange([...value, ...urls.map((src) => ({ src, caption: '' }))])} />
      )}
      {value.map((item, i) =>
        primitive ? (
          <div className="ad-row" key={i}>
            <Primitive k={k} value={item} onChange={(v) => set(i, v)} ctx={ctx} />
            {tools(i)}
          </div>
        ) : (
          <div className={`ad-card ${open.has(i) ? 'open' : ''}`} key={i}>
            <div className="ad-card-head">
              <button type="button" className="ad-card-title" onClick={() => toggle(i)} aria-expanded={open.has(i)}>
                <span className="ad-caret">{open.has(i) ? '▾' : '▸'}</span>
                {k === 'images' && item.src && <img src={assetUrl(item.src)} alt="" />}
                {itemTitle(item, i)}
              </button>
              {tools(i)}
            </div>
            {open.has(i) && (
              <div className="ad-card-body">
                <ObjectField value={item} onChange={(v) => set(i, v)} ctx={k === 'projects' ? { ...ctx, folder: item.slug || 'projets' } : ctx} />
              </div>
            )}
          </div>
        )
      )}
      <button type="button" className="ad-add" onClick={add}>+ Ajouter</button>
    </div>
  );
}

function DictField({ value, onChange }) {
  const entries = Object.entries(value);
  const rebuild = (list) => onChange(Object.fromEntries(list));
  return (
    <div className="ad-array">
      {entries.map(([key, list], i) => (
        <div className="ad-card open" key={i}>
          <div className="ad-card-head">
            <input className="ad-dict-key" value={key} onChange={(e) => rebuild(entries.map((en, j) => (j === i ? [e.target.value, en[1]] : en)))} aria-label="Nom de la couche" />
            <span className="ad-tools">
              <button type="button" className="ad-del" onClick={() => rebuild(entries.filter((_, j) => j !== i))} aria-label="Supprimer">✕</button>
            </span>
          </div>
          <div className="ad-card-body">
            <ArrayField k="stack" value={list} onChange={(v) => rebuild(entries.map((en, j) => (j === i ? [en[0], v] : en)))} ctx={{}} />
          </div>
        </div>
      ))}
      <button type="button" className="ad-add" onClick={() => rebuild([...entries, [`Couche ${entries.length + 1}`, []]])}>+ Ajouter une couche</button>
    </div>
  );
}

export function Field({ k, value, onChange, ctx = {} }) {
  let body;
  if (DICTS.has(k) && value && typeof value === 'object' && !Array.isArray(value)) body = <DictField value={value} onChange={onChange} />;
  else if (Array.isArray(value)) body = <ArrayField k={k} value={value} onChange={onChange} ctx={ctx} />;
  else if (value && typeof value === 'object') body = <ObjectField value={value} onChange={onChange} ctx={ctx} />;
  else if (typeof value === 'boolean') return <div className="ad-field"><Primitive k={k} value={value} onChange={onChange} ctx={ctx} /></div>;
  else body = <Primitive k={k} value={value} onChange={onChange} ctx={ctx} />;
  const group = Array.isArray(value) || (value && typeof value === 'object');
  return (
    <div className={`ad-field ${group ? 'ad-group' : ''}`}>
      <span className="ad-label">{labelOf(k)}</span>
      {body}
    </div>
  );
}

export function ObjectField({ value, onChange, ctx }) {
  return (
    <div className="ad-object">
      {Object.entries(value).map(([k, v]) => (
        <Field key={k} k={k} value={v} ctx={ctx} onChange={(nv) => onChange({ ...value, [k]: nv })} />
      ))}
    </div>
  );
}
