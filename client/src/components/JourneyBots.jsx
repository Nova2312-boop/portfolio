/**
 * Hologrammes de la section Parcours (SVG + CSS, classes .s surface / .l trait / .g lumière / .o voyant).
 * - ExpBot : robot placé devant chaque expérience, qui en joue le rôle (développeur au clavier ou stagiaire qui suit).
 * - SyncDrone : drone qui synchronise les formations une à une.
 */

/** Le rôle se déduit de l'intitulé : un stage → robot qui suit, sinon robot développeur. */
export const roleOf = (ev) => (/stagiaire|stage|intern|alternan/i.test(`${ev?.title || ''}`) ? 'intern' : 'dev');

function Head({ x, y, look = 0 }) {
  return (
    <g className="xb-head">
      <line className="l" x1={x + 28} y1={y} x2={x + 28} y2={y - 12} />
      <circle className="o xb-led" cx={x + 28} cy={y - 14} r="3.5" />
      <rect className="s" x={x} y={y} width="56" height="44" rx="12" />
      <rect className="s" x={x + 7} y={y + 10} width="42" height="14" rx="5" />
      <g className="xb-eyes" transform={`translate(${look} 0)`}>
        <rect className="g" x={x + 13} y={y + 13} width="9" height="7" rx="3" />
        <rect className="g" x={x + 34} y={y + 13} width="9" height="7" rx="3" />
      </g>
      <rect className="g" x={x + 20} y={y + 32} width="16" height="3" rx="1.5" opacity="0.7" />
      <rect className="s" x={x - 5} y={y + 15} width="5" height="13" rx="2.5" />
      <rect className="s" x={x + 56} y={y + 15} width="5" height="13" rx="2.5" />
    </g>
  );
}

/** Robot développeur : assis à son bureau, il tape sur son portable ; le code défile dans une fenêtre holographique. */
function Dev() {
  return (
    <g className="xb-scene xb-dev">
      {/* dossier de chaise */}
      <rect className="s" x="78" y="96" width="84" height="70" rx="10" opacity="0.5" />
      <Head x={92} y={40} look={4} />
      <rect className="s" x="111" y="84" width="18" height="10" rx="3" />
      <rect className="s" x="86" y="94" width="68" height="74" rx="13" />
      <circle className="o xb-core" cx="120" cy="122" r="6" />
      {/* bras vers le clavier, mains qui tapent */}
      <path className="l" d="M86 106 Q74 132 96 156 M154 106 Q166 132 144 156" />
      <g className="xb-tap xb-tap-a"><rect className="g" x="96" y="153" width="14" height="8" rx="3" /></g>
      <g className="xb-tap xb-tap-b"><rect className="g" x="130" y="153" width="14" height="8" rx="3" /></g>
      {/* bureau et portable */}
      <path className="s" d="M92 160 L148 160 L156 170 L84 170 Z" />
      <line className="l" x1="30" y1="171" x2="210" y2="171" />
      <line className="l" x1="44" y1="171" x2="44" y2="236" />
      <line className="l" x1="196" y1="171" x2="196" y2="236" />
      {/* fenêtre de code holographique */}
      <line className="l xb-link" x1="150" y1="160" x2="176" y2="112" />
      <g className="xb-win">
        <rect className="s" x="160" y="30" width="72" height="82" rx="5" />
        <line className="l" x1="160" y1="42" x2="232" y2="42" />
        <circle className="o" cx="167" cy="36" r="2" />
        <circle className="g" cx="174" cy="36" r="2" />
        <svg x="164" y="46" width="64" height="62" overflow="hidden">
          <g className="xb-code">
            {[44, 30, 52, 22, 38, 48, 26, 40, 34, 50, 28, 44, 30, 52, 22, 38, 48, 26].map((w, i) => (
              <rect key={i} className={i % 5 === 2 ? 'o' : 'g'} x={(i % 3) * 6} y={i * 7} width={w - (i % 3) * 6} height="3" rx="1.5" opacity="0.8" />
            ))}
          </g>
        </svg>
      </g>
    </g>
  );
}

/** Robot stagiaire : debout, il suit les consignes, prend des notes et coche la liste. */
function Intern() {
  return (
    <g className="xb-scene xb-intern">
      <g className="xb-nod">
        <Head x={68} y={26} look={3} />
      </g>
      <rect className="s" x="87" y="70" width="18" height="10" rx="3" />
      <rect className="s" x="64" y="80" width="64" height="72" rx="13" />
      <circle className="o xb-core" cx="96" cy="108" r="6" />
      {/* jambes */}
      <rect className="s" x="72" y="150" width="18" height="74" rx="8" />
      <rect className="s" x="102" y="150" width="18" height="74" rx="8" />
      <rect className="s" x="66" y="222" width="28" height="10" rx="4" />
      <rect className="s" x="98" y="222" width="28" height="10" rx="4" />
      {/* bras gauche qui tient la tablette, bras droit qui écrit */}
      <path className="l" d="M64 92 Q52 118 74 132" />
      <g transform="rotate(-12 112 126)">
        <rect className="s" x="94" y="112" width="40" height="28" rx="4" />
        <line className="l" x1="100" y1="121" x2="124" y2="121" />
        <line className="l xb-write" x1="100" y1="129" x2="122" y2="129" />
      </g>
      <g className="xb-pen">
        <path className="l" d="M128 92 Q146 112 128 124" />
        <line className="l" x1="128" y1="124" x2="120" y2="132" />
        <circle className="g" cx="128" cy="124" r="5" />
      </g>
      {/* consignes holographiques cochées une à une */}
      <line className="l xb-link" x1="134" y1="112" x2="164" y2="96" />
      <g className="xb-win">
        <rect className="s" x="160" y="36" width="72" height="110" rx="5" />
        <line className="l" x1="160" y1="48" x2="232" y2="48" />
        <rect className="o" x="166" y="40" width="22" height="4" rx="2" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(0 ${58 + i * 20})`}>
            <rect className="l" x="166" y="0" width="10" height="10" rx="2" />
            <path className="l xb-tick" d="M168 5 l3 3 l5 -6" style={{ '--d': `${i * 0.9}s` }} />
            <rect className="g" x="182" y="3" width={[38, 28, 34, 24][i]} height="4" rx="2" opacity="0.7" />
          </g>
        ))}
        <rect className="l" x="166" y="138" width="60" height="3" rx="1.5" />
        <rect className="g xb-prog" x="166" y="138" width="60" height="3" rx="1.5" />
      </g>
    </g>
  );
}

/** Robot qui accompagne le défilement : il joue le rôle de l'expérience active. */
export function ExpBot({ ev, index }) {
  const role = roleOf(ev);
  return (
    <div className={`xbot is-${role}`} aria-hidden="true">
      <div className="xbot-say" key={index}>
        <span className="xbot-n">{ev?.when}</span>
        <span className="xbot-l">{role === 'dev' ? 'Mode développeur' : 'Mode stagiaire'}</span>
        <span className="xbot-o">{ev?.org}</span>
      </div>
      <svg viewBox="0 0 240 250" className="xbot-art">
        <ellipse className="l" cx="120" cy="242" rx="90" ry="7" opacity="0.6" />
        <Dev />
        <Intern />
      </svg>
    </div>
  );
}

/** Drone qui survole la frise et synchronise les formations. */
export function SyncDrone({ label }) {
  return (
    <div className="sdrone" aria-hidden="true">
      <svg viewBox="0 0 140 60" className="sdrone-art">
        <g className="sd-sway">
          <line className="l" x1="50" y1="26" x2="26" y2="18" />
          <line className="l" x1="90" y1="26" x2="114" y2="18" />
          <ellipse className="g sd-rotor" cx="26" cy="16" rx="18" ry="2" />
          <ellipse className="g sd-rotor" cx="114" cy="16" rx="18" ry="2" />
          <rect className="s" x="46" y="20" width="48" height="16" rx="7" />
          <circle className="o sd-led" cx="70" cy="28" r="3" />
          <path className="s" d="M60 36 L70 46 L80 36" />
          <circle className="g" cx="70" cy="46" r="3" />
        </g>
      </svg>
      <span className="sdrone-txt">{label}</span>
    </div>
  );
}
