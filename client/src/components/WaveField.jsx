import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { reducedMotion } from '../hooks/motion.js';

const vertexShader = /* glsl */ `
  uniform float uT;
  uniform vec2 uM;
  varying float vH;
  varying float vD;
  void main() {
    vec3 p = position;
    float d = distance(p.xz, uM * vec2(9.0, 5.0));
    p.y = sin(p.x * 0.6 + uT) * 0.35
        + cos(p.z * 0.8 + uT * 0.8) * 0.35
        + exp(-d * d * 0.35) * 1.4 * sin(uT * 3.0 - d * 2.0);   // onde autour de la souris
    vH = p.y;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vD = -mv.z;
    gl_PointSize = (2.4 + vH * 1.5) * (9.0 / vD);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  varying float vH;
  varying float vD;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    vec3 c = mix(vec3(0.43, 0.76, 1.0), vec3(1.0, 0.71, 0.28), smoothstep(0.5, 1.4, vH));
    gl_FragColor = vec4(c, (1.0 - r * 2.0) * smoothstep(16.0, 4.0, vD) * 0.9);
  }
`;

/** Champ de 8 400 particules animé par shader GLSL, réactif à la souris. */
export default function WaveField({ onFps }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      // Pas de WebGL (vieux appareil, pilote désactivé) : le hero reste lisible sans le fond animé
      canvas.classList.add('gl-off');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    cam.position.set(0, 3.2, 7);

    const SX = 120, SZ = 70;
    const pos = new Float32Array(SX * SZ * 3);
    let k = 0;
    for (let i = 0; i < SX; i++)
      for (let j = 0; j < SZ; j++) {
        pos[k++] = (i - SX / 2) * 0.16;
        pos[k++] = 0;
        pos[k++] = (j - SZ / 2) * 0.16;
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uM: { value: new THREE.Vector2() } },
      vertexShader,
      fragmentShader,
    });
    scene.add(new THREE.Points(geo, mat));

    const mouse = new THREE.Vector2();
    const target = new THREE.Vector2();
    const onMove = (e) => target.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', resize);

    // pause du rendu quand le hero n'est plus visible
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    const still = reducedMotion();
    let raf, last = performance.now(), frames = 0, acc = 0;
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const dt = (now - last) / 1000;
      last = now;
      frames++;
      acc += dt;
      if (acc > 1) {
        onFps?.(frames);
        frames = 0;
        acc = 0;
      }
      mouse.lerp(target, 0.06);
      mat.uniforms.uM.value.copy(mouse);
      if (!still) mat.uniforms.uT.value += dt;
      cam.position.x = mouse.x * 0.8;
      cam.position.y = 3.2 + mouse.y * 0.4;
      cam.lookAt(0, 0, 0);
      renderer.render(scene, cam);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', resize);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, [onFps]);

  return <canvas ref={canvasRef} className="gl" />;
}
