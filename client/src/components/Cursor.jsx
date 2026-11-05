import { useEffect, useRef } from 'react';

/** Curseur personnalisé : anneau qui suit avec inertie + point précis. */
export default function Cursor() {
  const ring = useRef(null);
  const dot = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    let mx = -100, my = -100, cx = -100, cy = -100, raf;
    const move = (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.current.style.transform = `translate(${mx - 2}px, ${my - 2}px)`;
      const hot = e.target.closest('a, button, input, textarea, .card');
      ring.current.classList.toggle('big', !!hot);
    };
    const loop = () => {
      cx += (mx - cx) * 0.18;
      cy += (my - cy) * 0.18;
      const s = ring.current.offsetWidth / 2;
      ring.current.style.transform = `translate(${cx - s}px, ${cy - s}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', move);
    loop();
    return () => {
      window.removeEventListener('mousemove', move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cur" />
      <div ref={dot} className="cur-dot" />
    </>
  );
}
