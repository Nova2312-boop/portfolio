/**
 * Robot holographique debout derrière le terminal, qui le tient comme un tableau.
 * Tête + épaules au-dessus, bras le long des côtés (CSS, s'adaptent à la taille du terminal),
 * mains (SVG) dont les doigts passent devant le bord. Son humeur vient du parent :
 * .mood-read (il lit ce qu'on tape), .mood-nod (il hoche la tête à chaque commande).
 */
function Hand({ side }) {
  return (
    <svg className={`tb-hand tb-hand-${side}`} viewBox="0 0 70 92" aria-hidden="true">
      <rect className="s" x="2" y="14" width="34" height="62" rx="12" />
      <rect className="s" x="10" y="0" width="18" height="18" rx="6" />
      {[18, 32, 46, 60].map((y, i) => (
        <rect key={y} className="s tb-finger" x="28" y={y - 2} width={i === 0 || i === 3 ? 30 : 36} height="11" rx="5.5" />
      ))}
      <circle className="o" cx="18" cy="44" r="3.5" />
    </svg>
  );
}

export default function TermBot() {
  return (
    <>
      <div className="tb-back" aria-hidden="true">
        <svg className="tb-head" viewBox="0 0 200 140">
          <g className="tb-head-g">
            <line className="l" x1="100" y1="26" x2="100" y2="8" />
            <circle className="o tb-led" cx="100" cy="7" r="5" />
            <rect className="s" x="30" y="52" width="12" height="30" rx="5" />
            <rect className="s" x="158" y="52" width="12" height="30" rx="5" />
            <rect className="s" x="40" y="26" width="120" height="84" rx="24" />
            <rect className="s" x="54" y="42" width="92" height="32" rx="11" />
            <g className="tb-eyes">
              <rect className="g" x="70" y="51" width="16" height="13" rx="5" />
              <rect className="g" x="114" y="51" width="16" height="13" rx="5" />
            </g>
            <g className="tb-mouth">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <rect key={i} className="g" x={80 + i * 6} y="88" width="3" height="9" rx="1.5" style={{ '--d': `${i * 0.06}s` }} />
              ))}
            </g>
          </g>
          <rect className="s" x="84" y="110" width="32" height="30" rx="6" />
        </svg>
        <div className="tb-torso" />
        <div className="tb-pad tb-pad-l" />
        <div className="tb-pad tb-pad-r" />
        <div className="tb-arm tb-arm-l" />
        <div className="tb-arm tb-arm-r" />
      </div>
      <Hand side="l" />
      <Hand side="r" />
    </>
  );
}
