import { useEffect, useState } from 'react';
import SectionHead from './SectionHead.jsx';
import Reveal from './Reveal.jsx';
import ProcessBot from './ProcessBot.jsx';
import { useInView, reducedMotion } from '../hooks/motion.js';

const STEP_MS = 4200;

/** Les étapes d'un projet : la numérotation est réelle, c'est l'ordre de travail. */
export default function Process({ steps }) {
  const [ref, inView] = useInView(0.3);
  const [active, setActive] = useState(0);
  const [hold, setHold] = useState(false);

  // le robot présente les étapes une à une tant que la section est visible
  useEffect(() => {
    if (!inView || hold || reducedMotion() || steps.length < 2) return;
    const id = setInterval(() => setActive((a) => (a + 1) % steps.length), STEP_MS);
    return () => clearInterval(id);
  }, [inView, hold, steps.length]);

  const cur = steps[active] || steps[0];
  return (
    <section id="process">
      <div className="wrap">
        <SectionHead addr="0x03" title="Ma méthode" />
        <div className="process-wrap">
          <ProcessBot active={active} label={cur?.step} duration={cur?.duration} />
          <ol className={`process ${inView ? 'run' : ''}`} ref={ref} onMouseLeave={() => setHold(false)}>
            {steps.map((s, i) => (
              <Reveal
                as="li"
                key={s.step}
                style={{ '--i': i }}
                className={i === active ? 'on' : ''}
                onMouseEnter={() => {
                  setActive(i);
                  setHold(true);
                }}
              >
                <div className="p-num">{String(i + 1).padStart(2, '0')}</div>
                <h3>{s.step}</h3>
                <div className="p-dur">{s.duration}</div>
                <p>{s.text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
