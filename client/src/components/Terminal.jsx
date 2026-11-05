import { useEffect, useMemo, useRef, useState } from 'react';
import SectionHead from './SectionHead.jsx';
import { getHealth, isDemo } from '../api.js';
import TermBot from './TermBot.jsx';
import { canSpeak, speak, stopSpeaking, voicePref } from '../hooks/voice.js';

// message d'accueil prononcé par le robot qui tient le terminal
const WELCOME_SPOKEN = 'Bienvenue. Tape « help » pour la liste des commandes.';

const CHIPS = ['help', 'whoami', 'services', 'projects', 'cv', 'contact', 'status', 'sudo hire-me', 'clear'];

/** Terminal interactif : les réponses sont générées à partir du profil servi par l'API Node. */
export default function Terminal({ profile, onOpenCV }) {
  const [lines, setLines] = useState([
    { type: 'out', text: 'Bienvenue. Tape « help » pour la liste des commandes.' },
  ]);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState([]);
  const [hIndex, setHIndex] = useState(0);
  const body = useRef(null);
  const input = useRef(null);
  // humeur du robot qui tient le terminal : il lit pendant la frappe, hoche la tête à chaque commande
  const [mood, setMood] = useState('idle');
  const moodTimer = useRef(0);
  const react = (m) => {
    setMood(m);
    clearTimeout(moodTimer.current);
    moodTimer.current = setTimeout(() => setMood('idle'), m === 'nod' ? 1100 : 900);
  };
  useEffect(() => () => clearTimeout(moodTimer.current), []);

  // le robot dit le message d'accueil à voix haute quand le terminal apparaît à l'écran
  const stage = useRef(null);
  const [voiceOn, setVoiceOn] = useState(() => canSpeak && voicePref.get());
  const [talking, setTalking] = useState(false);
  const voiceRef = useRef(voiceOn);
  voiceRef.current = voiceOn;
  const greet = () => {
    if (!voiceRef.current) return;
    speak(WELCOME_SPOKEN, { onStart: () => setTalking(true), onEnd: () => setTalking(false) });
  };
  useEffect(() => {
    let last = -Infinity;
    const io = new IntersectionObserver(
      ([e]) => {
        // une fois à l'arrivée, puis de nouveau si on revient après 30 s
        if (e.isIntersecting && Date.now() - last > 30000) {
          last = Date.now();
          greet();
        }
      },
      { threshold: 0.5 }
    );
    if (stage.current) io.observe(stage.current);
    return () => {
      io.disconnect();
      stopSpeaking();
    };
  }, []);
  const toggleVoice = () => {
    const on = !voiceOn;
    setVoiceOn(on);
    voicePref.set(on);
    if (on) {
      voiceRef.current = true;
      greet();
    } else {
      stopSpeaking();
      setTalking(false);
    }
  };

  const commands = useMemo(
    () => ({
      help: () =>
        ['Commandes disponibles :', '  whoami     qui je suis', '  skills     ma stack', '  projects   mes projets', '  services   mes offres et tarifs', '  cv         ouvrir mon CV',
          '  contact    me joindre', '  status     état du serveur Node', '  date       heure à Abidjan', '  ls         contenu du site',
          '  clear      nettoyer l\'écran'].join('\n'),
      whoami: () => `${profile.name} — ${profile.roles[0]} basé à ${profile.location}.\n${profile.about[0]}`,
      skills: () => profile.skills.map((g) => `${g.group.padEnd(10)}: ${g.items.map((i) => i.name).join(', ')}`).join('\n'),
      services: () => profile.services.map((x) => `${x.code}  ${x.title.padEnd(28)} ${x.price}`).join('\n'),
      cv: () => { onOpenCV(); return 'Ouverture du CV…'; },
      projects: () => profile.projects.map((p, i) => `[${i + 1}] ${p.title.padEnd(14)} — ${p.description.split(' ').slice(0, 6).join(' ')}…`).join('\n') + '\n\nTape « open 1 » pour ouvrir un projet.',
      contact: () => `email    : ${profile.contact.email}\ngithub   : ${profile.contact.github}\nlinkedin : ${profile.contact.linkedin}`,
      ls: () => 'profil/  stack/  projets/  parcours/  contact/  cv.pdf',
      date: () => new Date().toLocaleString('fr-FR', { timeZone: profile.timezone, dateStyle: 'full', timeStyle: 'medium' }),
      'sudo hire-me': () => '[sudo] mot de passe pour visiteur : ********\n✔ Accès accordé. Excellent choix. Rendez-vous dans la section contact ↓',
      status: async () => {
        const t0 = performance.now();
        const r = await getHealth();
        return `GET /api/health → 200 (${Math.round(performance.now() - t0)} ms)\nserveur : ${r.status} · uptime ${r.uptime}s${isDemo ? '\n(aperçu : le vrai serveur Node répond une fois le projet lancé)' : ''}`;
      },
    }),
    [profile, onOpenCV]
  );

  const run = async (raw) => {
    const cmd = raw.trim();
    if (cmd === 'clear') return setLines([]);
    const next = [{ type: 'in', text: cmd }];
    if (cmd) {
      const m = cmd.toLowerCase().match(/^open\s+(\d+)$/);
      const pr = m && profile.projects[+m[1] - 1];
      const fn = pr ? () => { location.hash = `projet-${pr.slug}`; return `Ouverture de ${pr.title}…`; } : commands[cmd.toLowerCase()];
      try {
        next.push({ type: 'out', text: fn ? await fn() : `bash: ${cmd}: commande introuvable. Tape « help ».` });
      } catch {
        next.push({ type: 'err', text: 'Erreur : le serveur Node ne répond pas.' });
      }
    }
    setLines((l) => [...l, ...next]);
  };

  useEffect(() => {
    body.current.scrollTop = body.current.scrollHeight;
  }, [lines]);

  const onKey = (e) => {
    if (e.key === 'Enter') {
      react('nod');
      setHistory((h) => [...h, value]);
      setHIndex(history.length + 1);
      run(value);
      setValue('');
    } else if (e.key === 'ArrowUp' && hIndex > 0) {
      e.preventDefault();
      setHIndex(hIndex - 1);
      setValue(history[hIndex - 1]);
    } else if (e.key === 'ArrowDown') {
      const i = Math.min(hIndex + 1, history.length);
      setHIndex(i);
      setValue(history[i] || '');
    }
  };

  const prompt = 'visiteur@portfolio:~$';

  return (
    <section id="terminal">
      <div className="wrap">
        <SectionHead addr="0x08" title="Terminal" />
        <div className={`term-stage mood-${mood} ${talking ? 'talking' : ''}`} ref={stage}>
        <TermBot />
        <div className="term">
          <div className="term-bar">
            <i /><i /><i />
            <span>visiteur@{profile.handle}.dev — bash</span>
            {canSpeak && (
              <button type="button" className={`term-voice ${voiceOn ? 'on' : ''}`} onClick={toggleVoice} aria-pressed={voiceOn} title={voiceOn ? 'Couper la voix du robot' : 'Activer la voix du robot'}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 9v6h4l5 4V5L8 9z" />
                  {voiceOn ? <path d="M16 9a4 4 0 0 1 0 6 M18.5 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M16.5 9.5l5 5 M21.5 9.5l-5 5" />}
                </svg>
                <span>{voiceOn ? 'voix' : 'muet'}</span>
              </button>
            )}
          </div>
          <div className="term-body" ref={body} onClick={() => input.current.focus()}>
            {lines.map((l, i) =>
              l.type === 'in' ? (
                <div key={i}><span className="p">{prompt}</span> {l.text}</div>
              ) : (
                <div key={i} className={l.type === 'err' ? 'o err' : 'o'}>{l.text}</div>
              )
            )}
            <div className="term-in">
              <span className="p">{prompt}</span>
              <input
                ref={input}
                id="cmd"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  react('read');
                }}
                onKeyDown={onKey}
                autoComplete="off"
                spellCheck="false"
                aria-label="Commande du terminal"
              />
            </div>
          </div>
        </div>
        </div>
        <div className="chips">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => {
                run(c);
                react('nod');
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
