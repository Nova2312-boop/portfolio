import { useEffect, useRef, useState } from 'react';
import SectionHead from './SectionHead.jsx';
import { canSpeak, speak, stopSpeaking, voicePref } from '../hooks/voice.js';

/** Égaliseur affiché à côté de la question lue à voix haute. */
function Wave() {
  return (
    <span className="faq-wave" aria-hidden="true">
      <b /><b /><b /><b /><b />
    </span>
  );
}

export default function Faq({ items }) {
  const [open, setOpen] = useState(0);
  const [voiceOn, setVoiceOn] = useState(() => canSpeak && voicePref.get());
  const [talking, setTalking] = useState(-1);
  const hoverTimer = useRef(0);

  // la question est lue par une voix de femme, la réponse par une voix d'homme
  const read = (i, part) => {
    if (!voiceOn) return;
    const f = items[i];
    const answer = part === 'a';
    speak(answer ? f.a : f.q, {
      gender: answer ? 'male' : 'female',
      onStart: () => setTalking(i),
      onEnd: () => setTalking((t) => (t === i ? -1 : t)),
    });
  };
  const hover = (i, part = 'q') => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => read(i, part), 220);
  };
  const leave = () => clearTimeout(hoverTimer.current);

  const toggleVoice = () => {
    const on = !voiceOn;
    setVoiceOn(on);
    voicePref.set(on);
    if (!on) {
      stopSpeaking();
      setTalking(-1);
    }
  };

  useEffect(() => {
    const onHide = () => document.hidden && stopSpeaking();
    document.addEventListener('visibilitychange', onHide);
    return () => {
      clearTimeout(hoverTimer.current);
      document.removeEventListener('visibilitychange', onHide);
      stopSpeaking();
    };
  }, []);

  return (
    <section id="faq">
      <div className="wrap">
        <SectionHead addr="0x08" title="Questions fréquentes" />
        {canSpeak && (
          <button type="button" className={`faq-voice ${voiceOn ? 'on' : ''}`} onClick={toggleVoice} aria-pressed={voiceOn}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 9v6h4l5 4V5L8 9z" />
              {voiceOn ? <path d="M16 9a4 4 0 0 1 0 6 M18.5 6.5a7.5 7.5 0 0 1 0 11" /> : <path d="M16.5 9.5l5 5 M21.5 9.5l-5 5" />}
            </svg>
            Voix robot : {voiceOn ? 'activée' : 'désactivée'}
            {!voiceOn && <small>clique pour l’activer</small>}
          </button>
        )}
        <div className="faq" onMouseLeave={() => { leave(); stopSpeaking(); setTalking(-1); }}>
          {items.map((f, i) => (
            <div className={`faq-item ${open === i ? 'open' : ''} ${talking === i ? 'talking' : ''}`} key={f.q}>
              <button
                id={`faq-${i}`}
                aria-expanded={open === i}
                aria-controls={`faq-a-${i}`}
                onMouseEnter={() => hover(i)}
                onMouseLeave={leave}
                onFocus={() => hover(i)}
                onClick={() => {
                  const next = open === i ? -1 : i;
                  setOpen(next);
                  if (next === i) read(i, 'a');
                  else stopSpeaking();
                }}
              >
                <span>{f.q}</span>
                {talking === i && <Wave />}
                <i aria-hidden="true">+</i>
              </button>
              <div className="faq-a" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-${i}`}>
                <div>
                  <p onMouseEnter={() => open === i && hover(i, 'a')} onMouseLeave={leave}>{f.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
