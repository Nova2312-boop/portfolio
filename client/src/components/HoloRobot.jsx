import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { reducedMotion } from '../hooks/motion.js';

/* Matériau « hologramme » : bords lumineux (fresnel), lignes de balayage,
   bande qui parcourt le corps, scintillement occasionnel. uFade = fondu vers le bas (buste). */
const holoVertex = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying float vY;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vY = wp.y;
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const holoFragment = /* glsl */ `
  uniform float uT;
  uniform vec3 uC;
  uniform float uFade;
  uniform float uSeed;
  varying vec3 vN;
  varying vec3 vV;
  varying float vY;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
    float scan = 0.55 + 0.45 * sin(vY * 70.0 - uT * 5.0);
    float sweep = exp(-pow((vY - (mod(uT * 0.6, 4.2) - 0.6)) * 5.0, 2.0)) * uFade;
    float flick = 1.0 - 0.35 * step(0.93, hash(floor(uT * 12.0) + uSeed));
    float fade = mix(1.0, smoothstep(-0.1, 0.7, vY), uFade);
    float a = ((fres * 0.85 + 0.06) * scan + sweep * 0.35) * flick * fade;
    vec3 c = mix(uC, vec3(1.0), fres * 0.35 + sweep * 0.4);
    gl_FragColor = vec4(c, a);
  }
`;
/* Faisceau lumineux de l'émetteur : uDir = 1 brillant en bas, 0 brillant en haut. */
const beamVertex = /* glsl */ `varying float vH; void main(){ vH = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const beamFragment = /* glsl */ `
  uniform vec3 uC; uniform float uT; uniform float uDir; uniform float uK; varying float vH;
  void main(){
    float h = mix(vH, 1.0 - vH, uDir);
    float a = h * uK * (0.85 + 0.15 * sin(uT * 3.0 + vH * 20.0));
    gl_FragColor = vec4(uC, a);
  }
`;

const cssColor = (name, fallback) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || fallback);
};
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const GREET_EVERY = 25; // secondes entre deux « bonjour » tant que l'accueil est visible

/**
 * Scène holographique de l'accueil : un robot qui salue, suit la souris et « prononce » le nom.
 * Tout est construit en code (Three.js), aucun modèle externe.
 */
/** Durée pendant laquelle le robot « prononce » le nom (ms) : le titre suit ce rythme. */
export const speakMsFor = (name) => Math.max(900, name.length * 70);

export default function HoloRobot({ name, started, onSpeak }) {
  const canvasRef = useRef(null);
  // valeurs lues par la boucle de rendu sans reconstruire la scène
  const startedRef = useRef(started);
  const speakRef = useRef(onSpeak);
  const msRef = useRef(speakMsFor(name));
  startedRef.current = started;
  speakRef.current = onSpeak;
  msRef.current = speakMsFor(name);

  useEffect(() => {
    const canvas = canvasRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      canvas.classList.add('gl-off');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const accent = cssColor('--holo-accent', '#6fc3ff');
    const signal = cssColor('--holo-signal', '#ffb547');
    const white = new THREE.Color('#ffffff');
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
    cam.position.set(0, 1.5, 10);
    cam.lookAt(0, 1.25, 0);

    const disposables = [];
    const keep = (x) => (disposables.push(x), x);
    const T = { value: 0 };
    const holo = (fade, seed) =>
      keep(
        new THREE.ShaderMaterial({
          uniforms: { uT: T, uC: { value: accent }, uFade: { value: fade }, uSeed: { value: seed } },
          vertexShader: holoVertex,
          fragmentShader: holoFragment,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        })
      );
    const robotMat = holo(1, 0);
    const glow = (color, opacity = 0.9) => keep(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    const lineMat = keep(new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    const eyeMat = glow(accent.clone().lerp(white, 0.5), 0.95);
    const coreMat = glow(signal, 0.85);
    const ringMat = glow(accent, 0.6);
    const beam = (dir, k) =>
      keep(
        new THREE.ShaderMaterial({
          uniforms: { uC: { value: accent }, uT: T, uDir: { value: dir }, uK: { value: k } },
          vertexShader: beamVertex,
          fragmentShader: beamFragment,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        })
      );

    /** Pièce hologramme : surface + arêtes filaires. */
    const part = (geo, parent, mat, [x, y, z] = [0, 0, 0], rot) => {
      keep(geo);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      if (rot) mesh.rotation.set(...rot);
      mesh.add(new THREE.LineSegments(keep(new THREE.EdgesGeometry(geo, 28)), lineMat));
      parent.add(mesh);
      return mesh;
    };
    const solid = (geo, parent, mat, [x, y, z] = [0, 0, 0]) => {
      const m = new THREE.Mesh(keep(geo), mat);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };

    // ================= Robot principal =================
    const stage = new THREE.Group();
    scene.add(stage);
    const robot = new THREE.Group();
    stage.add(robot);
    const body = new THREE.Group();
    robot.add(body);

    part(new RoundedBoxGeometry(1.6, 1.25, 0.85, 4, 0.18), body, robotMat, [0, 0.85, 0]);
    part(new THREE.CylinderGeometry(0.62, 0.78, 0.35, 24, 1, true), body, robotMat, [0, 0.1, 0]);
    part(new THREE.CylinderGeometry(0.16, 0.2, 0.3, 16), body, robotMat, [0, 1.6, 0]);
    const core = solid(new THREE.TorusGeometry(0.17, 0.035, 10, 32), body, coreMat, [0, 0.95, 0.44]);
    solid(new THREE.CircleGeometry(0.07, 20), body, coreMat, [0, 0.95, 0.445]);

    // bras montés sur un pivot à l'épaule pour pouvoir saluer
    const arms = {};
    for (const s of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(s * 1.0, 1.25, 0);
      body.add(pivot);
      part(new THREE.SphereGeometry(0.3, 20, 14), pivot, robotMat);
      part(new THREE.CapsuleGeometry(0.17, 0.7, 6, 14), pivot, robotMat, [s * 0.14, -0.63, 0.02], [0, 0, s * 0.12]);
      part(new THREE.SphereGeometry(0.16, 16, 12), pivot, robotMat, [s * 0.2, -1.1, 0.05]);
      arms[s] = pivot;
    }

    const head = new THREE.Group();
    head.position.set(0, 2.25, 0);
    body.add(head);
    part(new RoundedBoxGeometry(1.15, 0.92, 0.9, 4, 0.22), head, robotMat);
    part(new RoundedBoxGeometry(0.88, 0.3, 0.06, 2, 0.03), head, robotMat, [0, 0.08, 0.46]);
    for (const s of [-1, 1]) {
      const eye = solid(new THREE.CapsuleGeometry(0.055, 0.1, 4, 10), head, eyeMat, [s * 0.22, 0.08, 0.5]);
      eye.rotation.z = Math.PI / 2;
      part(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 20), head, robotMat, [s * 0.63, 0, 0], [0, 0, Math.PI / 2]);
    }
    // « bouche » : égaliseur qui s'anime quand le robot parle
    const mouth = [];
    for (let i = 0; i < 7; i++) {
      const bar = solid(new THREE.PlaneGeometry(0.045, 0.16), head, eyeMat, [(i - 3) * 0.075, -0.22, 0.47]);
      bar.scale.y = 0.15;
      mouth.push(bar);
    }
    part(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), head, robotMat, [0.3, 0.65, 0]);
    const tip = solid(new THREE.SphereGeometry(0.06, 12, 10), head, glow(signal, 0.85), [0.3, 0.88, 0]);

    // émetteur au sol et faisceau
    const base = new THREE.Group();
    base.position.y = -0.55;
    stage.add(base);
    for (const [r, w] of [[1.25, 0.03], [0.95, 0.015], [1.55, 0.01]]) {
      const ring = solid(new THREE.RingGeometry(r - w, r + w, 64), base, ringMat);
      ring.rotation.x = -Math.PI / 2;
    }
    const ticks = new THREE.Group();
    base.add(ticks);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const t = solid(new THREE.PlaneGeometry(0.03, 0.14), ticks, ringMat, [Math.cos(a) * 1.4, 0, Math.sin(a) * 1.4]);
      t.rotation.set(-Math.PI / 2, 0, -a);
    }
    solid(new THREE.CylinderGeometry(1.7, 1.25, 3.4, 48, 1, true), base, beam(1, 0.16), [0, 1.7, 0]);

    const N = 160;
    const pPos = new Float32Array(N * 3);
    const pSpeed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 1.4;
      pPos.set([Math.cos(a) * r, Math.random() * 3.4, Math.sin(a) * r], i * 3);
      pSpeed[i] = 0.2 + Math.random() * 0.5;
    }
    const pGeo = keep(new THREE.BufferGeometry());
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    base.add(new THREE.Points(pGeo, keep(new THREE.PointsMaterial({ color: accent, size: 0.035, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }))));

    // ================= Mise en page selon la taille de l'écran =================
    let hw = 4.6, wide = true;
    const layout = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return false;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      const viewH = 2 * cam.position.z * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
      hw = (viewH * cam.aspect) / 2;
      wide = cam.aspect > 1.15;
      // bien à droite pour laisser le grand nom lisible
      // grand écran : robot à droite du texte ; téléphone : robot réduit en bas à droite
      stage.position.set(wide ? hw * 0.64 : hw * 0.5, wide ? 0 : -1.4, 0);
      stage.scale.setScalar(wide ? 0.88 : 0.48);
      return true;
    };

    const mouse = new THREE.Vector2();
    const target = new THREE.Vector2();
    const onMove = (e) => target.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
    const still = reducedMotion();

    // --- Salut : bras levé, coucou, égaliseur ; le grand nom s'écrit pendant qu'il parle ---
    let greetAt = -1, lastGreet = -100;
    const greet = () => {
      greetAt = t;
      lastGreet = t;
      speakRef.current?.(msRef.current);
    };

    let t = 0;
    const draw = (dt) => {
      t += dt;
      T.value = t;
      mouse.lerp(target, 0.05);

      robot.position.y = Math.sin(t * 1.1) * 0.06;
      body.rotation.y = Math.sin(t * 0.35) * 0.22 + mouse.x * 0.25;
      head.rotation.y = mouse.x * 0.45;
      head.rotation.x = -mouse.y * 0.18;
      ticks.rotation.y = t * 0.25;
      core.scale.setScalar(1 + Math.sin(t * 4) * 0.08);
      tip.material.opacity = 0.5 + 0.4 * Math.sin(t * 5);

      // salut : le bras côté texte se lève et fait coucou, puis redescend
      const g = greetAt < 0 ? -1 : t - greetAt;
      const up = g < 0 ? 0 : ease(g / 0.6) * (1 - ease((g - 3.6) / 0.6));
      const wave = g > 0.6 && g < 3.6 ? Math.sin((g - 0.6) * 9) * 0.35 : 0;
      // il salue avec le bras côté texte (à gauche)
      arms[-1].rotation.z = -2.25 * up + wave * up;
      arms[1].rotation.z = 0.05 * Math.sin(t * 1.3);
      if (up > 0) head.rotation.z = Math.sin(g * 2.2) * 0.06 * up;
      const talking = g > 0 && g < msRef.current / 1000 + 0.15;
      mouth.forEach((bar, i) => {
        const target_ = talking ? 0.3 + Math.abs(Math.sin(t * 17 + i * 1.7) * Math.cos(t * 7 + i)) * 0.9 : 0.15;
        bar.scale.y += (target_ - bar.scale.y) * 0.35;
      });
      eyeMat.opacity = talking ? 0.75 + Math.sin(t * 22) * 0.2 : 0.95;
      if (!still && startedRef.current && g < 0 && t > 1.2) greet();
      else if (!still && g > GREET_EVERY) greet();

      const p = pGeo.attributes.position;
      for (let i = 0; i < N; i++) {
        let y = p.getY(i) + pSpeed[i] * dt;
        if (y > 3.4) y = 0;
        p.setY(i, y);
      }
      p.needsUpdate = true;

      renderer.render(scene, cam);
    };

    const onResize = () => {
      if (layout() && still) draw(0);
    };
    layout();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', onResize);

    // à chaque retour sur l'accueil, le robot salue de nouveau
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !visible && !still && startedRef.current && t - lastGreet > 4) greet();
      visible = e.isIntersecting;
    }, { threshold: 0.4 });
    io.observe(canvas);

    let raf, last = performance.now();
    if (still) {
      draw(1.2); // une seule image fixe : pas de salut animé
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
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div className="holo-wrap" aria-hidden="true">
      <canvas ref={canvasRef} className="holo" />
    </div>
  );
}
