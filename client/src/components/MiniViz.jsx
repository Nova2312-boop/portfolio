import { useEffect, useRef } from 'react';
import { reducedMotion } from '../hooks/motion.js';

const BLUE = '#6fc3ff';
const AMBER = '#ffb547';

/** Petite visualisation animée en Canvas 2D en haut de chaque carte projet. */
export default function MiniViz({ type }) {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext('2d');
    const nodes = Array.from({ length: 14 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.002, vy: (Math.random() - 0.5) * 0.002,
    }));
    let t = 0, raf;
    const still = reducedMotion();

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = (cv.width = cv.clientWidth * dpr);
      const h = (cv.height = cv.clientHeight * dpr);
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = '#1f2b3d';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 24 * dpr) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }

      if (type === 'wave') {
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.strokeStyle = k ? `rgba(111,195,255,${0.6 - k * 0.2})` : BLUE;
          ctx.lineWidth = 2 * dpr;
          for (let x = 0; x <= w; x += 4) {
            const y = h / 2 + Math.sin((x / w) * 8 + t * 2 + k) * h * 0.18 * Math.sin(t + k) + Math.sin((x / w) * 20 + t * 3) * h * 0.04;
            x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.stroke();
        }
      }

      if (type === 'graph') {
        nodes.forEach((n) => {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > 1) n.vx *= -1;
          if (n.y < 0 || n.y > 1) n.vy *= -1;
        });
        nodes.forEach((a, i) =>
          nodes.slice(i + 1).forEach((b) => {
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 0.35) {
              ctx.strokeStyle = `rgba(111,195,255,${1 - d / 0.35})`;
              ctx.beginPath(); ctx.moveTo(a.x * w, a.y * h); ctx.lineTo(b.x * w, b.y * h); ctx.stroke();
            }
          })
        );
        nodes.forEach((n, i) => {
          ctx.fillStyle = i === 0 ? AMBER : BLUE;
          ctx.beginPath(); ctx.arc(n.x * w, n.y * h, 3 * dpr, 0, Math.PI * 2); ctx.fill();
        });
      }

      if (type === 'bars') {
        const n = 18, bw = w / n;
        for (let i = 0; i < n; i++) {
          const v = 0.25 + 0.6 * Math.abs(Math.sin(i * 0.7 + t * 1.3) * Math.cos(i * 0.3 + t * 0.6));
          ctx.fillStyle = i % 5 === 0 ? AMBER : 'rgba(111,195,255,.85)';
          ctx.fillRect(i * bw + bw * 0.2, h - v * h * 0.85, bw * 0.6, v * h * 0.85);
        }
      }

      t += 0.016;
      if (!still) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [type]);

  return <canvas ref={ref} />;
}
