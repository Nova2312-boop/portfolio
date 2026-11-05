import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { reducedMotion } from '../hooks/motion.js';

/* Silhouette en nuage de points : bords plus lumineux (fresnel, grâce aux normales de surface),
   balayage vertical, scintillement. uRim = 0 pour la poussière (pas de normale utile). */
const pointVertex = /* glsl */ `
  attribute float aR;
  uniform float uT;
  uniform float uPx;
  uniform float uRim;
  varying float vA;
  varying float vR;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vec4 mv = viewMatrix * wp;
    vec3 n = normalize(mat3(modelMatrix) * normal);
    float fres = pow(1.0 - abs(dot(n, normalize(cameraPosition - wp.xyz))), 1.6);
    float rim = mix(1.0, 0.28 + fres * 1.5, uRim);
    float band = exp(-pow((wp.y - mod(uT * 0.7, 4.4) + 0.8) * 4.0, 2.0));
    float tw = 0.65 + 0.35 * sin(uT * 3.0 + aR * 40.0);
    vA = (0.35 + 0.65 * tw + band * 0.45) * rim * smoothstep(-0.8, -0.45, wp.y);
    vR = aR + band * 0.5 + fres * 0.5 * uRim;
    gl_PointSize = uPx * (0.55 + aR * 0.8 + band * 0.4) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const pointFragment = /* glsl */ `
  uniform vec3 uC;
  varying float vA;
  varying float vR;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    vec3 c = mix(uC, vec3(1.0), smoothstep(0.8, 1.4, vR));
    gl_FragColor = vec4(c, (1.0 - d * 2.0) * vA);
  }
`;

const ICONS = {
  chart: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  doc: 'M6 2h9l5 5v15H6z M15 2v5h5 M9 12h8 M9 16h8',
  chat: 'M3 4h18v12H8l-5 4z M7 9h10 M7 12h6',
  check: 'M3 3h18v18H3z M7 12l3 3 7-7',
  net: 'M12 3v6 M5 15v-3h14v3 M3 15h4v4H3z M10 15h4v4h-4z M17 15h4v4h-4z M9 3h6v6H9z',
  screen: 'M2 4h20v13H2z M8 21h8 M12 17v4 M6 9l3 3-3 3 M11 15h5',
};
const iconFor = (p, i) => (p.category === 'Réseau' ? 'net' : ['chart', 'doc', 'chat', 'check', 'screen'][i % 5]);

/** Échantillonne des points (avec leur normale) sur la surface d'une géométrie déjà positionnée. */
function sample(geo, count) {
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(geo)).build();
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const rnd = new Float32Array(count);
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(v, n);
    pos.set([v.x, v.y, v.z], i * 3);
    nor.set([n.x, n.y, n.z], i * 3);
    rnd[i] = Math.random();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('aR', new THREE.BufferAttribute(rnd, 1));
  return out;
}

/** Vitrine holographique : un robot androïde qui présente les projets dans des panneaux flottants. */
export default function HoloShowcase({ projects, onOpen }) {
  const items = projects.slice(0, 6);
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const panelRefs = useRef([]);
  const hoverRef = useRef(-1);
  const [hover, setHover] = useState(-1);
  const setHovered = (i) => {
    hoverRef.current = i;
    setHover(i);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      // sans WebGL : les panneaux restent utilisables, affichés en grille
      wrapRef.current?.classList.add('hshow-off');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const accent = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6fc3ff');

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    cam.position.set(0, 1.15, 7.6);
    cam.lookAt(0, 1.0, 0);

    const disposables = [];
    const keep = (x) => (disposables.push(x), x);
    const T = { value: 0 };
    const PX = { value: 30 };
    const pointsMat = (rim) =>
      keep(
        new THREE.ShaderMaterial({
          uniforms: { uT: T, uPx: PX, uRim: { value: rim }, uC: { value: accent } },
          vertexShader: pointVertex,
          fragmentShader: pointFragment,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
    const mat = pointsMat(1);
    const dustMat = pointsMat(0);
    const wireMat = keep(new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false }));
    const lineMat = keep(new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));

    /** Une partie du corps : maillage filaire discret + nuage de points sur la surface. */
    const part = (geo, count, parent, { p = [0, 0, 0], s = [1, 1, 1], r } = {}) => {
      if (r) geo.rotateX(r[0]).rotateY(r[1]).rotateZ(r[2]);
      geo.scale(...s).translate(...p);
      parent.add(new THREE.LineSegments(keep(new THREE.WireframeGeometry(geo)), wireMat));
      parent.add(new THREE.Points(keep(sample(geo, count)), mat));
      geo.dispose();
    };

    // ================= Robot androïde (sol à y = -0.63) =================
    // pièces mécaniques (blindages arrondis, articulations, segments) : proportions équilibrées
    const box = (w, h, d, r = 0.04) => new RoundedBoxGeometry(w, h, d, 3, r);
    const cyl = (rt, rb, h, seg = 18) => new THREE.CylinderGeometry(rt, rb, h, seg);
    const ball = (r) => new THREE.SphereGeometry(r, 16, 12);
    const figure = new THREE.Group();
    scene.add(figure);

    // tête : casque, visière, modules latéraux, antenne
    const head = new THREE.Group();
    head.position.set(0, 2.04, 0);
    figure.add(head);
    part(box(0.38, 0.36, 0.38, 0.09), 1100, head, { p: [0, 0.2, 0] });
    part(box(0.32, 0.09, 0.05, 0.03), 260, head, { p: [0, 0.22, 0.195] });
    part(box(0.2, 0.05, 0.04, 0.02), 90, head, { p: [0, 0.08, 0.19] });
    for (const sx of [-1, 1]) part(cyl(0.07, 0.07, 0.06, 16), 120, head, { p: [sx * 0.205, 0.2, 0], r: [0, 0, Math.PI / 2] });
    part(cyl(0.012, 0.012, 0.16, 6), 30, head, { p: [0.12, 0.45, -0.05] });
    part(ball(0.025), 30, head, { p: [0.12, 0.54, -0.05] });

    // cou et colonne mécanique
    part(cyl(0.075, 0.09, 0.16), 160, figure, { p: [0, 1.96, 0] });
    for (const [y, r] of [[1.06, 0.2], [1.17, 0.19]]) part(cyl(r, r, 0.08, 24), 260, figure, { p: [0, y, 0] });

    // torse blindé : poitrine, plaques, réacteur, bassin
    part(box(0.9, 0.62, 0.46, 0.1), 2600, figure, { p: [0, 1.55, 0] });
    part(box(0.7, 0.28, 0.1, 0.05), 420, figure, { p: [0, 1.62, 0.23] });
    part(cyl(0.085, 0.085, 0.04, 24), 160, figure, { p: [0, 1.5, 0.27], r: [Math.PI / 2, 0, 0] });
    for (const sx of [-1, 1]) part(box(0.16, 0.05, 0.04, 0.015), 50, figure, { p: [sx * 0.26, 1.36, 0.23] });
    part(box(0.62, 0.26, 0.36, 0.07), 900, figure, { p: [0, 0.82, 0] });

    // jambes robustes : hanche, cuisse blindée, genou, tibia large, botte
    for (const sx of [-1, 1]) {
      const x = sx * 0.2;
      part(ball(0.12), 220, figure, { p: [x, 0.7, 0] });
      part(cyl(0.14, 0.12, 0.6), 760, figure, { p: [x, 0.36, 0] });
      part(box(0.22, 0.4, 0.07, 0.03), 260, figure, { p: [x, 0.42, 0.13] });
      part(ball(0.1), 180, figure, { p: [x, 0.03, 0] });
      part(box(0.16, 0.14, 0.06, 0.03), 110, figure, { p: [x, 0.03, 0.1] });
      part(cyl(0.11, 0.14, 0.5), 640, figure, { p: [x, -0.24, 0] });
      part(box(0.26, 0.11, 0.42, 0.04), 360, figure, { p: [x, -0.575, 0.06] });
    }

    // bras : épaulière, épaule, bras, coude, avant-bras blindé, main (paume, doigts, pouce)
    const arms = {};
    for (const sx of [-1, 1]) {
      const shoulder = new THREE.Group();
      shoulder.position.set(sx * 0.56, 1.8, 0);
      figure.add(shoulder);
      part(ball(0.15), 300, shoulder);
      part(box(0.3, 0.14, 0.3, 0.06), 300, shoulder, { p: [sx * 0.03, 0.1, 0] });
      part(cyl(0.08, 0.075, 0.46), 420, shoulder, { p: [0, -0.28, 0] });
      const elbow = new THREE.Group();
      elbow.position.set(0, -0.52, 0);
      shoulder.add(elbow);
      part(ball(0.09), 150, elbow);
      part(cyl(0.1, 0.08, 0.42), 460, elbow, { p: [0, -0.25, 0] });
      const hand = new THREE.Group();
      hand.position.set(0, -0.48, 0);
      elbow.add(hand);
      part(box(0.11, 0.12, 0.05, 0.02), 170, hand, { p: [0, -0.06, 0] });
      for (let f = 0; f < 4; f++) part(new THREE.CapsuleGeometry(0.014, 0.07 + (f === 1 || f === 2 ? 0.015 : 0), 2, 6), 40, hand, { p: [-0.039 + f * 0.026, -0.17, 0] });
      part(new THREE.CapsuleGeometry(0.016, 0.06, 2, 6), 40, hand, { p: [sx * -0.065, -0.07, 0.015], r: [0, 0, sx * -0.7] });
      arms[sx] = { shoulder, elbow, hand };
    }

    // socle et poussière
    const ringMat = keep(new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    const rings = new THREE.Group();
    rings.position.y = -0.63;
    scene.add(rings);
    for (const [r, w] of [[1.1, 0.025], [1.45, 0.01], [0.8, 0.012]]) {
      const m = new THREE.Mesh(keep(new THREE.RingGeometry(r - w, r + w, 64)), ringMat);
      m.rotation.x = -Math.PI / 2;
      rings.add(m);
    }
    const D = 260;
    const dust = new Float32Array(D * 3);
    const dustR = new Float32Array(D);
    for (let i = 0; i < D; i++) {
      dust.set([(Math.random() - 0.5) * 10, Math.random() * 4.6 - 0.5, (Math.random() - 0.5) * 3 - 1], i * 3);
      dustR[i] = Math.random() * 0.4;
    }
    const dustGeo = keep(new THREE.BufferGeometry());
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dust, 3));
    dustGeo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(D * 3), 3));
    dustGeo.setAttribute('aR', new THREE.BufferAttribute(dustR, 1));
    scene.add(new THREE.Points(dustGeo, dustMat));

    // ================= Panneaux : 2 dans les mains, les autres flottent autour =================
    // sur les côtés, plus bas que les panneaux tenus (puis au-dessus s'il y a plus de 4 projets)
    const FLOAT = [[-3.7, 0.75, 0.1], [3.7, 0.85, 0.1], [-3.7, 3.6, -0.4], [3.7, 3.65, -0.4]];
    const anchors = items.map(() => new THREE.Vector3());
    const links = items.map(() => {
      const g = keep(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]));
      scene.add(new THREE.Line(g, lineMat));
      return g;
    });

    let hw = 4, ppw = 100, narrow = false;
    const halfW = items.map(() => 1.4); // demi-largeur de chaque panneau, en unités de la scène
    const still = reducedMotion();
    const layout = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return false;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z;
      hw = (viewH * cam.aspect) / 2;
      ppw = h / viewH; // pixels par unité au plan de la silhouette
      narrow = window.matchMedia('(max-width: 760px)').matches; // même seuil que le CSS
      PX.value = Math.min(34, h * 0.066) * Math.min(window.devicePixelRatio, 2);
      panelRefs.current.forEach((el, i) => el && (halfW[i] = el.offsetWidth / 2 / ppw));
      return true;
    };

    const v = new THREE.Vector3();
    const from = new THREE.Vector3();
    let t = 0;
    const draw = (dt) => {
      t += dt;
      T.value = t;
      const hv = hoverRef.current;
      figure.position.y = Math.sin(t * 0.9) * 0.025;
      rings.rotation.y = t * 0.2;

      // bras levés qui tiennent les panneaux ; la main concernée se lève au survol
      for (const sx of [-1, 1]) {
        const lift = (sx === -1 && hv === 0) || (sx === 1 && hv === 1) ? 0.25 : 0;
        const a = arms[sx];
        a.shoulder.rotation.z += (sx * (1.3 + lift) + Math.sin(t * 0.8 + sx) * 0.035 - a.shoulder.rotation.z) * 0.12;
        a.shoulder.rotation.x = -0.22;
        a.elbow.rotation.z += (sx * (1.05 + lift * 0.6) - a.elbow.rotation.z) * 0.12;
        a.hand.rotation.z = sx * -0.25;
      }
      // la tête se tourne vers le panneau survolé
      const target = hv >= 0 ? anchors[hv] : null;
      const yaw = target ? THREE.MathUtils.clamp(target.x * 0.16, -0.6, 0.6) : Math.sin(t * 0.4) * 0.2;
      const pitch = target ? THREE.MathUtils.clamp(-(target.y - 2.25) * 0.15, -0.3, 0.3) : 0;
      head.rotation.y += (yaw - head.rotation.y) * 0.08;
      head.rotation.x += (pitch - head.rotation.x) * 0.08;

      items.forEach((_, i) => {
        if (i < 2) {
          // panneau tenu : son bord intérieur se pose sur la main
          const sx = i === 0 ? -1 : 1;
          arms[sx].hand.getWorldPosition(from);
          anchors[i].set(from.x + sx * (halfW[i] - 0.05), from.y + 0.05, from.z + 0.2);
        } else {
          const [x, y, z] = FLOAT[(i - 2) % FLOAT.length];
          const lim = Math.max(0.5, hw - halfW[i] - 0.15);
          from.set(0, 2.25 + figure.position.y, 0);
          anchors[i].set(THREE.MathUtils.clamp(x, -lim, lim), y + Math.sin(t * 0.9 + i) * 0.08, z);
        }
        const a = links[i].attributes.position;
        a.setXYZ(0, from.x, from.y, from.z);
        a.setXYZ(1, anchors[i].x, anchors[i].y, anchors[i].z);
        a.needsUpdate = true;
        links[i].computeBoundingSphere();
      });
      scene.children.forEach((c) => c.isLine && (c.visible = !narrow));

      renderer.render(scene, cam);

      // panneaux HTML posés sur leurs ancrages (en grille sous la silhouette sur mobile)
      const w = canvas.clientWidth, h = canvas.clientHeight;
      panelRefs.current.forEach((el, i) => {
        if (!el) return;
        if (narrow) {
          el.style.transform = '';
          return;
        }
        v.copy(anchors[i]).project(cam);
        el.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px) translate(-50%, -50%)`;
      });
    };

    const onResize = () => layout() && draw(0);
    layout();
    window.addEventListener('resize', onResize);

    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    let raf, last = performance.now();
    if (still) {
      // pas d'animation : bande de balayage au-dessus de la tête, bras figés dans leur pose
      t = 5.9;
      for (let k = 0; k < 60; k++) draw(0);
    } else {
      const tick = (now) => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (visible) draw(dt);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', onResize);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
    // la scène dépend seulement du nombre de panneaux
  }, [items.length]);

  return (
    <div className="hshow" ref={wrapRef}>
      <canvas ref={canvasRef} className="hshow-gl" aria-hidden="true" />
      <div className="hshow-panels">
        {items.map((p, i) => (
          <button
            key={p.slug}
            ref={(el) => (panelRefs.current[i] = el)}
            type="button"
            className={`hpanel ${hover === i ? 'on' : ''}`}
            onClick={() => onOpen(p)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(-1)}
            onFocus={() => setHovered(i)}
            onBlur={() => setHovered(-1)}
            aria-label={`Ouvrir le projet ${p.title}`}
          >
            <svg viewBox="0 0 24 24" className="hpanel-ic" aria-hidden="true">
              <path d={ICONS[iconFor(p, i)]} />
            </svg>
            <span className="hpanel-txt">
              <span className="hpanel-n">PRJ-{String(i + 1).padStart(2, '0')}{p.tag ? ` · ${p.tag}` : ''}</span>
              <b>{p.title}</b>
              {p.metric && <span className="hpanel-m">{p.metric}</span>}
              <span className="hpanel-go">ouvrir le projet →</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
