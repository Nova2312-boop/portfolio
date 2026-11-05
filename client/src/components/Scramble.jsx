import { useEffect, useState } from 'react';
import { useInView, reducedMotion } from '../hooks/motion.js';

const CHARS = '!<>-_\\/[]{}—=+*^?#01ABCDEF';

/**
 * Texte qui se "décode" caractère par caractère quand il entre dans l'écran.
 * Mode parole : à chaque changement de `speak` (compteur), les lettres réapparaissent
 * une à une pendant `speakMs`, comme si quelqu'un prononçait le texte. La mise en page
 * ne bouge pas (les lettres pas encore dites sont seulement transparentes).
 */
export default function Scramble({ text, as: Tag = 'span', delay = 0, enabled = true, speak = 0, speakMs = 1400, className = '', ...rest }) {
  const [ref, inView] = useInView(0.3);
  const [out, setOut] = useState(text);
  const [said, setSaid] = useState(-1); // -1 = pas en train de parler

  useEffect(() => {
    if (!inView || !enabled || reducedMotion()) return setOut(text);
    const frames = 22;
    let f = 0;
    let iv;
    const to = setTimeout(() => {
      iv = setInterval(() => {
        f++;
        setOut(
          text
            .split('')
            .map((c, i) => (c === ' ' || i < (f / frames) * text.length ? c : CHARS[(Math.random() * CHARS.length) | 0]))
            .join('')
        );
        if (f >= frames) {
          clearInterval(iv);
          setOut(text);
        }
      }, 35);
    }, delay);
    return () => {
      clearTimeout(to);
      clearInterval(iv);
    };
  }, [inView, enabled, text, delay]);

  useEffect(() => {
    if (!speak || reducedMotion()) return;
    setOut(text);
    setSaid(0);
    const step = speakMs / text.length;
    let n = 0;
    const iv = setInterval(() => {
      n++;
      if (n > text.length) {
        clearInterval(iv);
        setSaid(-1);
      } else setSaid(n);
    }, step);
    return () => {
      clearInterval(iv);
      setSaid(-1);
    };
  }, [speak, speakMs, text]);

  const speaking = said >= 0;
  return (
    <Tag ref={ref} className={`${className} ${speaking ? 'speaking' : ''}`.trim()} {...rest}>
      {speaking
        ? text.split('').map((c, i) => (
            <span key={i} className={i >= said ? 'sc-hide' : i === said - 1 ? 'sc-now' : undefined}>
              {c}
            </span>
          ))
        : out}
    </Tag>
  );
}
