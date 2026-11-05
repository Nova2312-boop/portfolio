import { useEffect, useRef } from 'react';

/** Fenêtre modale : Échap pour fermer, clic à l'extérieur, défilement de la page bloqué. */
export default function Modal({ open, onClose, label, className = '', children }) {
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    box.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        <button className="modal-x" onClick={onClose} aria-label="Fermer">
          esc ✕
        </button>
        {children}
      </div>
    </div>
  );
}
