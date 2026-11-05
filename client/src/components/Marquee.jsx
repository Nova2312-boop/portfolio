/** Bandeau défilant infini des technologies. */
export default function Marquee({ items }) {
  const row = items.map((t) => (
    <span key={t}>
      {t}
      <i>◆</i>
    </span>
  ));
  return (
    <div className="marquee" aria-label={`Technologies : ${items.join(', ')}`}>
      <div className="marquee-track" aria-hidden="true">
        <div>{row}</div>
        <div>{row}</div>
      </div>
    </div>
  );
}
