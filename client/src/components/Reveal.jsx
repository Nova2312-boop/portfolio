import { useLayoutEffect, useState } from 'react';
import { useInView, reducedMotion } from '../hooks/motion.js';

/** Apparition au scroll. Le contenu reste visible si l'animation ne se lance pas. */
export default function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const [ref, inView] = useInView();
  const [below, setBelow] = useState(false);

  useLayoutEffect(() => {
    if (reducedMotion() || !ref.current) return;
    setBelow(ref.current.getBoundingClientRect().top > window.innerHeight);
  }, [ref]);

  const cls = `reveal ${below && !inView ? 'pre' : ''} ${className}`.trim();
  return (
    <Tag ref={ref} className={cls} {...rest}>
      {children}
    </Tag>
  );
}
