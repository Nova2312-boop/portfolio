/**
 * Robot holographique qui « explique » la méthode avec des gestes (SVG + CSS).
 * Les poses sont pilotées par la classe pose-N (N = étape active) : rotations
 * épaule / coude en variables CSS, transitions douces, gestuelle de parole en plus.
 */

function Arm({ side }) {
  // side = 'l' (gauche à l'écran) ou 'r' ; le bras pend vers le bas à 0°
  const x = side === 'l' ? 62 : 138;
  return (
    <g transform={`translate(${x} 98)`}>
      <g className={`pb-sh pb-sh-${side}`}>
        <circle className="s" r="11" />
        <rect className="s" x="-7" y="4" width="14" height="42" rx="7" />
        <g transform="translate(0 46)">
          <g className={`pb-el pb-el-${side}`}>
            <g className={`pb-talk pb-talk-${side}`}>
              <circle className="s" r="6.5" />
              <rect className="s" x="-6" y="3" width="12" height="38" rx="6" />
              <g transform="translate(0 45)">
                <circle className="g" r="7.5" />
                <rect className="g pb-finger" x="-2" y="4" width="4" height="9" rx="2" />
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
}

export default function ProcessBot({ active, label, duration }) {
  return (
    <div className={`pbot pose-${active % 5}`} aria-hidden="true">
      <div className="pbot-say" key={active}>
        <span className="pbot-n">{String(active + 1).padStart(2, '0')}</span>
        <span className="pbot-l">{label}</span>
        {duration && <span className="pbot-d">{duration}</span>}
      </div>
      <svg viewBox="0 0 200 290" className="pbot-art">
        <defs>
          <linearGradient id="pb-beam" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.32" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* émetteur et faisceau */}
        <path d="M44 262 L70 150 L130 150 L156 262 Z" fill="url(#pb-beam)" />
        <ellipse className="l" cx="100" cy="264" rx="62" ry="10" />
        <ellipse className="l pb-ring" cx="100" cy="264" rx="44" ry="6.5" />
        <ellipse className="g" cx="100" cy="264" rx="18" ry="2.5" opacity="0.6" />

        <g className="pb-float">
          {/* corps */}
          <rect className="s" x="66" y="86" width="68" height="74" rx="14" />
          <path className="l" d="M80 160 L86 176 L114 176 L120 160" />
          <path className="g pb-flame" d="M92 177 L100 194 L108 177 Z" />
          <circle className="o pb-core" cx="100" cy="116" r="7" />
          <circle className="l" cx="100" cy="116" r="12" />
          <rect className="s" x="93" y="76" width="14" height="11" rx="3" />

          <Arm side="l" />
          <Arm side="r" />

          {/* tête */}
          <g className="pb-head">
            <line className="l" x1="100" y1="30" x2="100" y2="14" />
            <circle className="o pb-led" cx="100" cy="12" r="4" />
            <rect className="s" x="68" y="30" width="64" height="48" rx="13" />
            <rect className="s" x="76" y="40" width="48" height="16" rx="6" />
            <g className="pb-eyes">
              <rect className="g" x="82" y="44" width="10" height="8" rx="3" />
              <rect className="g" x="108" y="44" width="10" height="8" rx="3" />
            </g>
            <g className="pb-mouth">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <rect key={i} className="g" x={83 + i * 5} y="62" width="3" height="8" rx="1.5" style={{ '--d': `${i * 0.07}s` }} />
              ))}
            </g>
            <rect className="s" x="62" y="46" width="6" height="14" rx="3" />
            <rect className="s" x="132" y="46" width="6" height="14" rx="3" />
          </g>
        </g>
      </svg>
    </div>
  );
}
