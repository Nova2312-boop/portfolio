import { useRef } from 'react';

/** Élément "magnétique" : il glisse légèrement vers le curseur. */
export default function Magnetic({ as: Tag = 'button', children, ...rest }) {
  const ref = useRef(null);
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.25;
    const y = (e.clientY - r.top - r.height / 2) * 0.35;
    ref.current.style.transform = `translate(${x}px, ${y}px)`;
  };
  const leave = () => (ref.current.style.transform = '');
  return (
    <Tag ref={ref} onMouseMove={move} onMouseLeave={leave} {...rest}>
      {children}
    </Tag>
  );
}
