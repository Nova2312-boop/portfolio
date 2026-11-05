import { useEffect, useState } from 'react';

const LINES = [
  '[ BIOS ] init portfolio v2026.11',
  '[  OK  ] mount /dev/creativite',
  '[  OK  ] load modules: react, three, terminal',
  '[  OK  ] GET /api/profile → 200',
  '[  OK  ] render pipeline ready',
  '> welcome.',
];

/** Séquence de démarrage façon terminal. Attend que l'API ait répondu. */
export default function Boot({ ready, onDone }) {
  const [n, setN] = useState(0);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    if (n >= LINES.length) return;
    // on bloque sur la ligne de l'API tant que le profil n'est pas chargé
    if (n === 3 && !ready) return;
    const t = setTimeout(() => setN(n + 1), 170);
    return () => clearTimeout(t);
  }, [n, ready]);

  useEffect(() => {
    if (n < LINES.length) return;
    const a = setTimeout(() => setHide(true), 250);
    const b = setTimeout(onDone, 800);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [n, onDone]);

  return (
    <div className={`boot ${hide ? 'done' : ''}`} aria-hidden="true">
      <pre>
        {LINES.slice(0, n).map((l) => (
          <div key={l}>
            {l.includes('OK') ? (
              <>
                [  <span className="ok">OK</span>  ]{l.slice(8)}
              </>
            ) : (
              l
            )}
          </div>
        ))}
      </pre>
    </div>
  );
}
