import { useEffect, useMemo, useRef, useState } from 'react';

/** Palette de commandes (Ctrl+K / ⌘K) : navigation et actions rapides au clavier. */
export default function CommandPalette({ open, setOpen, actions }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
      setTimeout(() => input.current?.focus(), 10);
    }
  }, [open]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? actions.filter((a) => (a.label + ' ' + a.group).toLowerCase().includes(s)) : actions;
  }, [q, actions]);

  if (!open) return null;

  const run = (a) => {
    setOpen(false);
    setTimeout(a.run, 30);
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && list[sel]) run(list[sel]);
    else if (e.key === 'Escape') setOpen(false);
  };

  let lastGroup = '';
  return (
    <div className="modal-back palette-back" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Palette de commandes">
        <div className="palette-in">
          <span className="p">›</span>
          <input
            ref={input}
            id="palette-q"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={onKey}
            placeholder="Aller à une section, copier l'email, ouvrir le CV…"
            autoComplete="off"
            aria-label="Rechercher une commande"
          />
          <kbd>esc</kbd>
        </div>
        <ul>
          {list.length === 0 && <li className="palette-empty">Aucune commande pour « {q} »</li>}
          {list.map((a, i) => {
            const head = a.group !== lastGroup ? (lastGroup = a.group) : null;
            return (
              <li key={a.label}>
                {head && <div className="palette-group">{head}</div>}
                <button className={i === sel ? 'on' : ''} onMouseEnter={() => setSel(i)} onClick={() => run(a)}>
                  <span>{a.label}</span>
                  {a.hint && <kbd>{a.hint}</kbd>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
