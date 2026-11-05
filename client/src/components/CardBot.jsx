/**
 * Petits robots holographiques de maintenance posés sur le bord haut des cartes « Services ».
 * SVG + CSS uniquement (léger, pas de WebGL). Le bas du dessin (y = 80) correspond au bord de la carte.
 * Classes : .s surface, .l trait, .g lumière, .o voyant orange.
 */

function Head({ x = 45, y = 8 }) {
  return (
    <>
      <line className="l" x1={x + 15} y1={y} x2={x + 15} y2={y - 6} />
      <circle className="o cb-led" cx={x + 15} cy={y - 7} r="2" />
      <rect className="s" x={x} y={y} width="30" height="20" rx="6" />
      <g className="cb-eyes">
        <rect className="g" x={x + 7} y={y + 7} width="5" height="4" rx="1.5" />
        <rect className="g" x={x + 18} y={y + 7} width="5" height="4" rx="1.5" />
      </g>
      <line className="l" x1={x + 10} y1={y + 15} x2={x + 20} y2={y + 15} />
    </>
  );
}

/** Robot qui tient la carte à deux mains, en vol stationnaire. */
function Carrier() {
  return (
    <g className="cb-bob">
      <path className="l" d="M47 35 Q36 50 40 76 M73 35 Q84 50 80 76" />
      <rect className="g" x="35" y="75" width="10" height="5" rx="1" />
      <rect className="g" x="75" y="75" width="10" height="5" rx="1" />
      <Head />
      <rect className="s" x="47" y="30" width="26" height="22" rx="5" />
      <circle className="o" cx="60" cy="41" r="3" />
      <path className="g cb-flame" d="M55 53 L60 63 L65 53 Z" />
    </g>
  );
}

/** Drone qui suspend la carte avec deux câbles d'énergie. */
function Drone() {
  return (
    <g className="cb-sway">
      <line className="l cb-tether" x1="50" y1="24" x2="22" y2="78" />
      <line className="l cb-tether" x1="70" y1="24" x2="98" y2="78" />
      <rect className="g" x="17" y="76" width="10" height="4" rx="1" />
      <rect className="g" x="93" y="76" width="10" height="4" rx="1" />
      <line className="l" x1="42" y1="18" x2="28" y2="12" />
      <line className="l" x1="78" y1="18" x2="92" y2="12" />
      <ellipse className="g cb-rotor" cx="28" cy="10" rx="13" ry="1.6" />
      <ellipse className="g cb-rotor" cx="92" cy="10" rx="13" ry="1.6" />
      <rect className="s" x="42" y="14" width="36" height="11" rx="5" />
      <circle className="o cb-led" cx="60" cy="19.5" r="2.2" />
      <path className="s" d="M52 25 Q60 32 68 25" />
    </g>
  );
}

/** Robot assis sur le coin, qui resserre un boulon (étincelles). */
function Mechanic() {
  return (
    <>
      <g className="cb-bob-soft">
        <Head x={50} y={24} />
        <rect className="s" x="52" y="46" width="26" height="28" rx="5" />
        <circle className="o" cx="65" cy="58" r="2.6" />
        <path className="l" d="M58 74 L56 80 M72 74 L74 80" />
        <path className="l" d="M78 52 Q90 60 86 72" />
      </g>
      <g className="cb-wrench">
        <path className="l" d="M52 52 L36 70" />
        <path className="l" d="M36 70 m-4 4 a5 5 0 1 1 6 -6" />
      </g>
      <circle className="g" cx="30" cy="78" r="2.5" />
      <circle className="o cb-spark" cx="30" cy="76" r="1.2" />
      <circle className="o cb-spark cb-d2" cx="31" cy="76" r="1" />
      <circle className="g cb-spark cb-d3" cx="29" cy="76" r="0.9" />
    </>
  );
}

/** Petit robot sphérique en vol stationnaire au-dessus de la carte. */
function Scanner() {
  return (
    <g className="cb-bob">
      <line className="l" x1="60" y1="8" x2="60" y2="2" />
      <circle className="o cb-led" cx="60" cy="2" r="2" />
      <circle className="s" cx="60" cy="22" r="14" />
      <circle className="g cb-eye" cx="60" cy="24" r="4" />
      <path className="l" d="M46 22 L38 18 M74 22 L82 18" />
      <path className="s" d="M52 35 L60 40 L68 35" />
    </g>
  );
}

const BOTS = [Carrier, Drone, Mechanic, Scanner];
const PLACES = ['cb-left', 'cb-right', 'cb-corner', 'cb-left'];

export default function CardBot({ index }) {
  const Bot = BOTS[index % BOTS.length];
  return (
    <span className={`cardbot ${PLACES[index % PLACES.length]}`} aria-hidden="true">
      <svg viewBox="0 0 120 80" width="120" height="80">
        <Bot />
      </svg>
    </span>
  );
}

