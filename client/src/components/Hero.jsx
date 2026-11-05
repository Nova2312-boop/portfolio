import { useCallback, useEffect, useState } from 'react';
import WaveField from './WaveField.jsx';
import HoloRobot from './HoloRobot.jsx';
import Scramble from './Scramble.jsx';
import Magnetic from './Magnetic.jsx';
import { reducedMotion } from '../hooks/motion.js';

/** Effet "machine à écrire" qui alterne entre plusieurs rôles. */
function useTyped(words, active) {
  const [text, setText] = useState(words[0]);
  useEffect(() => {
    if (!active || reducedMotion()) return;
    let w = 0, c = words[0].length, deleting = true, t;
    const step = () => {
      if (deleting) {
        c--;
        if (c <= 0) {
          deleting = false;
          w = (w + 1) % words.length;
        }
      } else {
        c++;
        if (c >= words[w].length) {
          deleting = true;
          setText(words[w]);
          t = setTimeout(step, 2200);
          return;
        }
      }
      setText(words[w].slice(0, Math.max(c, 0)));
      t = setTimeout(step, deleting ? 35 : 70);
    };
    t = setTimeout(step, 2600);
    return () => clearTimeout(t);
  }, [words, active]);
  return text;
}

export default function Hero({ profile, started, onOpenCV }) {
  const [fps, setFps] = useState(60);
  const onFps = useCallback((f) => setFps(f), []);
  // quand le robot parle, le grand nom s'écrit lettre par lettre à son rythme
  const [speech, setSpeech] = useState({ n: 0, ms: 1400 });
  const onSpeak = useCallback((ms) => setSpeech((s) => ({ n: s.n + 1, ms })), []);
  const role = useTyped(profile.roles, started);

  return (
    <header className="hero" id="top">
      <WaveField onFps={onFps} />
      <HoloRobot name={profile.name} started={started} onSpeak={onSpeak} />
      <div className="wrap hero-c">
        <div className="hero-top">
          <div className="eyebrow">// Informaticien · {profile.location}</div>
          <div className={`avail ${profile.availability.available ? '' : 'busy'}`}>
            <span className="dot" />
            {profile.availability.label}
          </div>
        </div>
        <h1>
          <Scramble className="glitch" data-text={profile.name} text={profile.name} enabled={started} speak={speech.n} speakMs={speech.ms} />
        </h1>
        <div className="role">
          {role}
          <span className="caret">&nbsp;</span>
        </div>
        <p className="lead">{profile.tagline}</p>
        <div className="cta">
          <Magnetic as="a" href="#projects" className="btn">
            Voir mes projets →
          </Magnetic>
          <Magnetic className="btn ghost" onClick={onOpenCV}>
            Voir mon CV
          </Magnetic>
        </div>
      </div>
      <div className="hero-meta">
        {profile.coords}
        <br />
        RENDER: WebGL · {fps} FPS
        <br />
        BUILD 2026.11
      </div>
    </header>
  );
}
