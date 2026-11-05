import { useCallback, useEffect, useMemo, useState } from 'react';
import { admin, adminToken, isDemo } from '../../api.js';
import { Field } from './Fields.jsx';

/** Sections du menu, dans l'ordre du site. Les champs non listés tombent dans « Autres ». */
const SECTIONS = [
  { id: 'identite', label: 'Identité', keys: ['name', 'handle', 'roles', 'tagline', 'location', 'coords', 'timezone', 'availability'] },
  { id: 'about', label: 'À propos', keys: ['about', 'specs', 'stats'] },
  { id: 'marquee', label: 'Bandeau défilant', keys: ['marquee'] },
  { id: 'services', label: 'Offres', keys: ['services'] },
  { id: 'process', label: 'Méthode', keys: ['process'] },
  { id: 'skills', label: 'Compétences', keys: ['skills', 'tools', 'softSkills', 'languages'] },
  { id: 'projects', label: 'Projets', keys: ['projects'] },
  { id: 'parcours', label: 'Parcours', keys: ['experience', 'education', 'certifications'] },
  { id: 'github', label: 'Activité Git', keys: ['github'] },
  { id: 'avis', label: 'Avis clients', keys: ['testimonials'] },
  { id: 'faq', label: 'FAQ', keys: ['faq'] },
  { id: 'contact', label: 'Contact', keys: ['contact'] },
  { id: 'cv', label: 'CV', keys: ['cv'] },
];
const TOOLS = [
  { id: 'messages', label: 'Messages reçus' },
  { id: 'backups', label: 'Sauvegardes' },
  { id: 'json', label: 'JSON brut' },
];
const KNOWN = new Set(SECTIONS.flatMap((s) => s.keys));

function Login({ onLogged }) {
  const [password, setPassword] = useState('');
  const [state, setState] = useState({ busy: false, error: '', enabled: true });

  useEffect(() => {
    admin.status().then((s) => setState((x) => ({ ...x, enabled: s.enabled }))).catch(() => setState((x) => ({ ...x, error: 'Le serveur API ne répond pas.' })));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setState((x) => ({ ...x, busy: true, error: '' }));
    try {
      const { token } = await admin.login(password);
      adminToken.set(token);
      onLogged();
    } catch (err) {
      setState((x) => ({ ...x, busy: false, error: err.message }));
    }
  };

  return (
    <div className="ad-login">
      <form onSubmit={submit}>
        <p className="addr">0xAD · back-office</p>
        <h1>Administration</h1>
        {!state.enabled ? (
          <p className="muted">
            Back-office désactivé. Ajoute <code>ADMIN_PASSWORD=…</code> dans <code>server/.env</code>, puis redémarre le serveur.
          </p>
        ) : (
          <>
            <label className="ad-field">
              <span className="ad-label">Mot de passe</span>
              <input type="password" autoFocus autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <button className="btn" disabled={state.busy || !password}>{state.busy ? 'Connexion…' : 'Se connecter'}</button>
          </>
        )}
        {state.error && <p className="err">{state.error}</p>}
        <a className="link-btn" href="/">← retour au site</a>
      </form>
    </div>
  );
}

function Messages({ onAuthError }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => admin.messages().then(setList).catch((e) => (e.status === 401 ? onAuthError() : setError(e.message))), [onAuthError]);
  useEffect(() => {
    load();
  }, [load]);
  const remove = async (m) => {
    if (!confirm(`Supprimer le message de ${m.name} ?`)) return;
    await admin.deleteMessage(m.id).catch((e) => setError(e.message));
    load();
  };
  if (error) return <p className="err">{error}</p>;
  if (!list) return <p className="muted mono">Chargement…</p>;
  if (!list.length) return <p className="muted">Aucun message pour l'instant. Ceux du formulaire de contact apparaîtront ici.</p>;
  return (
    <div className="ad-array">
      {list.map((m) => (
        <article className="ad-card open ad-msg" key={m.id}>
          <div className="ad-card-head">
            <span className="ad-card-title">
              <b>{m.name}</b> · <a href={`mailto:${m.email}`}>{m.email}</a>
            </span>
            <span className="ad-tools">
              <span className="mono muted">{new Date(m.date).toLocaleString('fr-FR')}</span>
              <button type="button" className="ad-del" onClick={() => remove(m)} aria-label="Supprimer">✕</button>
            </span>
          </div>
          <p className="ad-card-body">{m.message}</p>
        </article>
      ))}
    </div>
  );
}

function Backups({ onLoad, onAuthError }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    admin.backups().then(setList).catch((e) => (e.status === 401 ? onAuthError() : setError(e.message)));
  }, [onAuthError]);
  const when = (file) => {
    const m = /profile-(\d{4}-\d\d-\d\d)T(\d\d)-(\d\d)-(\d\d)/.exec(file);
    return m ? new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}Z`).toLocaleString('fr-FR') : file;
  };
  const load = async (file) => {
    if (!confirm('Charger cette version dans l’éditeur ? Elle ne sera publiée que si tu enregistres.')) return;
    try {
      onLoad(await admin.backup(file));
    } catch (e) {
      setError(e.message);
    }
  };
  if (error) return <p className="err">{error}</p>;
  if (!list) return <p className="muted mono">Chargement…</p>;
  return (
    <>
      <p className="muted">Une copie est créée avant chaque enregistrement (30 dernières conservées).</p>
      {!list.length && <p className="muted">Aucune sauvegarde pour l'instant.</p>}
      <div className="ad-array">
        {list.map((b) => (
          <div className="ad-row ad-backup" key={b.file}>
            <span className="mono">{when(b.file)}</span>
            <span className="muted mono">{Math.round(b.size / 1024)} ko</span>
            <button type="button" className="ad-btn" onClick={() => load(b.file)}>Charger</button>
          </div>
        ))}
      </div>
    </>
  );
}

function RawJson({ profile, onApply }) {
  const [text, setText] = useState(() => JSON.stringify(profile, null, 2));
  const [error, setError] = useState('');
  useEffect(() => setText(JSON.stringify(profile, null, 2)), [profile]);
  const apply = () => {
    try {
      onApply(JSON.parse(text));
      setError('');
    } catch (e) {
      setError(`JSON invalide : ${e.message}`);
    }
  };
  return (
    <>
      <p className="muted">Pour les modifications avancées. « Appliquer » met à jour le brouillon ; il faut ensuite enregistrer.</p>
      <textarea className="ad-json" spellCheck="false" value={text} onChange={(e) => setText(e.target.value)} />
      <div className="ad-row">
        <button type="button" className="ad-btn" onClick={apply}>Appliquer au brouillon</button>
        {error && <span className="err">{error}</span>}
      </div>
    </>
  );
}

export default function Admin() {
  const [logged, setLogged] = useState(() => Boolean(adminToken.get()));
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState('');
  const [section, setSection] = useState(() => (location.hash.slice(1) || 'identite'));
  const [status, setStatus] = useState({ busy: false, msg: '', error: '' });

  const logout = useCallback(() => {
    adminToken.set('');
    setLogged(false);
    setProfile(null);
  }, []);

  useEffect(() => {
    document.title = 'Back-office · Portfolio';
    if (!logged) return;
    admin
      .profile()
      .then((p) => {
        setProfile(p);
        setSaved(JSON.stringify(p));
      })
      .catch((e) => (e.status === 401 ? logout() : setStatus({ busy: false, msg: '', error: e.message })));
  }, [logged, logout]);

  const dirty = profile && JSON.stringify(profile) !== saved;

  const save = useCallback(async () => {
    if (!profile || status.busy) return;
    setStatus({ busy: true, msg: '', error: '' });
    try {
      await admin.save(profile);
      setSaved(JSON.stringify(profile));
      setStatus({ busy: false, msg: `Enregistré à ${new Date().toLocaleTimeString('fr-FR')} · en ligne sur le site`, error: '' });
    } catch (e) {
      if (e.status === 401) return logout();
      setStatus({ busy: false, msg: '', error: e.message });
    }
  }, [profile, status.busy, logout]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    const onLeave = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    addEventListener('keydown', onKey);
    addEventListener('beforeunload', onLeave);
    return () => {
      removeEventListener('keydown', onKey);
      removeEventListener('beforeunload', onLeave);
    };
  }, [save, dirty]);

  const go = (id) => {
    setSection(id);
    history.replaceState(null, '', `#${id}`);
    scrollTo(0, 0);
  };

  const others = useMemo(() => (profile ? Object.keys(profile).filter((k) => !KNOWN.has(k)) : []), [profile]);
  const sections = others.length ? [...SECTIONS, { id: 'autres', label: 'Autres', keys: others }] : SECTIONS;
  const current = sections.find((s) => s.id === section);

  if (isDemo) {
    return (
      <div className="fatal">
        <p className="addr">MODE APERÇU</p>
        <h2>Back-office indisponible</h2>
        <p>Le build de démonstration n'a pas de serveur. Lance le projet avec <code>npm run dev</code>.</p>
      </div>
    );
  }
  if (!logged) return <Login onLogged={() => setLogged(true)} />;

  return (
    <div className="ad">
      <header className="ad-bar">
        <span className="ad-brand">
          ~/admin<b>{profile ? ` · ${profile.name}` : ''}</b>
        </span>
        <span className={`ad-state ${status.error ? 'is-err' : dirty ? 'is-dirty' : ''}`} role="status">
          {status.error || (dirty ? 'Modifications non enregistrées' : status.msg || 'À jour')}
        </span>
        <div className="ad-actions">
          <a className="ad-btn" href="/" target="_blank" rel="noopener noreferrer">Voir le site ↗</a>
          <button type="button" className="btn" onClick={save} disabled={!dirty || status.busy} title="Ctrl + S">
            {status.busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button type="button" className="ad-btn" onClick={logout}>Déconnexion</button>
        </div>
      </header>

      <div className="ad-layout">
        <nav className="ad-nav" aria-label="Sections">
          <span className="ad-nav-h">Contenu</span>
          {sections.map((s) => (
            <button key={s.id} type="button" className={s.id === section ? 'on' : ''} onClick={() => go(s.id)}>{s.label}</button>
          ))}
          <span className="ad-nav-h">Outils</span>
          {TOOLS.map((s) => (
            <button key={s.id} type="button" className={s.id === section ? 'on' : ''} onClick={() => go(s.id)}>{s.label}</button>
          ))}
        </nav>

        <main className="ad-main">
          {!profile ? (
            <p className="muted mono">{status.error ? '' : 'Chargement du contenu…'}</p>
          ) : section === 'messages' ? (
            <><h2>Messages reçus</h2><Messages onAuthError={logout} /></>
          ) : section === 'backups' ? (
            <><h2>Sauvegardes</h2><Backups onAuthError={logout} onLoad={(p) => { setProfile(p); go('identite'); }} /></>
          ) : section === 'json' ? (
            <><h2>JSON brut</h2><RawJson profile={profile} onApply={setProfile} /></>
          ) : current ? (
            <>
              <h2>{current.label}</h2>
              <div className="ad-object">
                {current.keys.filter((k) => k in profile).map((k) => (
                  <Field key={k} k={k} value={profile[k]} onChange={(v) => setProfile((p) => ({ ...p, [k]: v }))} ctx={{ folder: 'divers' }} />
                ))}
              </div>
            </>
          ) : (
            <p className="muted">Section inconnue.</p>
          )}
        </main>
      </div>
    </div>
  );
}
