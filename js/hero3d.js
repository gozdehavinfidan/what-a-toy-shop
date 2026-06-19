/* =========================================================================
   What-A-Toy! — js/hero3d.js
   A transparent, viewport-fixed three.js canvas that shows the bears.glb model
   travelling with scroll:
     • Page 1 (hero):  bears sit on the RIGHT, vertically centered, facing us.
     • Page 1 -> 2:    bears glide to horizontal CENTER.
     • Page 2 -> 3:    bears fade + float away (gone by the products page).
   The page background colors are painted by #bg-layer (css), so this canvas is
   transparent and only carries the bears.
   Performance: DPR-capped, resize-aware, RAF paused when hidden / off-stage.
   Reduced motion: static, faces-forward, no scroll travel.
   Exports: initHero3D()
   ========================================================================= */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const RIGHT_X = 3.3;     // world-x of the bears on page 1 (right of the content)
const TARGET_SPAN = 2.0; // desired world max-dimension (kept clear of the text)
const FACE_ROT_Y = 0.4;  // angle so faces turn toward the content (left)
// The model's VISIBLE mass sits above its bounding-box center, so drop it a
// touch (world units) to land the visible center on the headline.
const VISUAL_CENTER_Y = -0.78;
const FADE_START = 1.2;  // bears hold centered through page 2, then fade
const FADE_END = 2.0;    // fully gone by the products page (p≈2)

export function initHero3D() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || !THREE) return;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Hero morphing-blob background: fade out as we leave the hero so it
  //     never tints the red/navy pages. Set up first + on its own scroll
  //     listener so it works even if WebGL is unavailable below. ---
  const heroBg = document.getElementById('hero-bg');
  const scrollHint = document.querySelector('.hero__scroll-hint');
  function updateHeroBg() {
    const vh = window.innerHeight || 1;
    const p = window.scrollY / vh; // viewport heights scrolled
    // Hero blobs: full through hero+intro (golden), fade to 0 before products.
    if (heroBg) heroBg.style.opacity = String(Math.min(Math.max(1 - (p - 0.6), 0), 1));
    // Scroll hint: fade out as soon as scrolling starts (gone by ~20%).
    if (scrollHint) scrollHint.style.opacity = String(Math.max(0, 1 - p * 5));
  }
  updateHeroBg();
  window.addEventListener('scroll', updateHeroBg, { passive: true });

  // --- Renderer (transparent; DPR-capped) ---
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    console.warn('initHero3D: WebGL unavailable —', err);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0); // fully transparent — #bg-layer shows through
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // --- Scene + camera (looking straight at the origin -> vertical center) ---
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6.4);
  camera.lookAt(0, 0, 0);

  // Vertical world-offset so the bears' center lines up with the red
  // "What-A-Toy!" headline (computed from its live position; see computeAlignY).
  let bearAlignY = 0;

  // --- Lights (warm, soft, with contrast so the plush reads) ---
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const keyLight = new THREE.DirectionalLight(0xfff3d6, 1.5);
  keyLight.position.set(2.5, 4, 4);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xC98A2B, 0.45);
  fillLight.position.set(-3, 1, 2);
  scene.add(fillLight);

  // --- Bear model ---
  let bear = null;
  const bearMaterials = [];
  let curX = RIGHT_X; // smoothed x for buttery travel
  const bearGroup = new THREE.Group();
  scene.add(bearGroup);

  const loader = new GLTFLoader();
  loader.load(
    './bears.glb',
    (gltf) => {
      bear = gltf.scene;

      // The GLB ships an oversized flat backdrop mesh (~14x11) that would
      // inflate the bbox + offset the center. Hide it and frame using only the
      // real bear geometry.
      const keep = [];
      bear.traverse((o) => {
        if (!o.isMesh) return;
        const s = new THREE.Vector3();
        new THREE.Box3().setFromObject(o).getSize(s);
        if (Math.max(s.x, s.y, s.z) > 6) {
          o.visible = false; // backdrop/decal — never show it
        } else {
          keep.push(o);
        }
      });
      const boxOf = (list) => {
        const b = new THREE.Box3();
        list.forEach((o) => b.union(new THREE.Box3().setFromObject(o)));
        return b;
      };

      // Scale by the largest dimension (this is a WIDE two-bear model, so
      // sizing by max-dim keeps the horizontal footprint in check), then
      // recenter on the real bears so they sit vertically centered.
      const size = new THREE.Vector3();
      boxOf(keep).getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      bear.scale.setScalar(TARGET_SPAN / maxDim);
      bear.updateMatrixWorld(true);

      const center = new THREE.Vector3();
      boxOf(keep).getCenter(center);
      bear.position.sub(center); // center at origin -> vertically centered

      // Turn the bears so their faces are toward the viewer.
      bear.rotation.y = FACE_ROT_Y;

      // Make ONE of the two bears beige (clone its material so the other stays
      // brown). The bodies are the large meshes; eyes/nose stay dark.
      const beige = new THREE.Color('#E7D6B4');
      let recolored = false;
      keep.forEach((o) => {
        if (recolored) return;
        const s = new THREE.Vector3();
        new THREE.Box3().setFromObject(o).getSize(s);
        if (Math.max(s.x, s.y, s.z) > 1.2) {
          const recolor = (m) => { const c = m.clone(); c.color = beige.clone(); return c; };
          o.material = Array.isArray(o.material)
            ? o.material.map(recolor)
            : recolor(o.material);
          recolored = true;
        }
      });

      // Collect materials so we can fade them out as the bears leave.
      keep.forEach((o) => {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          if (m) {
            m.transparent = true;
            bearMaterials.push(m);
          }
        });
      });

      bearGroup.add(bear);
    },
    undefined,
    (err) => console.warn('initHero3D: failed to load bears.glb —', err)
  );

  function setBearOpacity(o) {
    for (let i = 0; i < bearMaterials.length; i++) bearMaterials[i].opacity = o;
  }

  // Align the bears' vertical center to the headline's center.
  function computeAlignY() {
    const title = document.getElementById('hero-title');
    const h = window.innerHeight || 1;
    if (!title) { bearAlignY = 0; return; }
    const r = title.getBoundingClientRect();
    // Title center as a viewport Y when the hero is at the top (doc position
    // == viewport position at scrollY 0; stable regardless of current scroll).
    const centerY = r.top + window.scrollY + r.height / 2;
    // Map that screen Y to a world Y on the z=0 plane the bears sit on.
    const halfWorld =
      Math.tan((camera.fov * Math.PI) / 180 / 2) * camera.position.z;
    bearAlignY = halfWorld * (1 - 2 * (centerY / h));
  }

  // --- Sizing: the canvas is viewport-fixed (full screen) ---
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    computeAlignY();
  }
  resize();
  // Recompute once fonts/layout settle (Fredoka changes the title height).
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(computeAlignY);
  window.addEventListener('load', computeAlignY);

  let resizeRAF = 0;
  window.addEventListener(
    'resize',
    () => {
      cancelAnimationFrame(resizeRAF);
      resizeRAF = requestAnimationFrame(resize);
    },
    { passive: true }
  );

  // --- Render loop ---
  const clock = new THREE.Clock();
  let rafId = 0;
  let running = false;

  function renderFrame() {
    const elapsed = clock.getElapsedTime();

    if (bear) {
      const vh = window.innerHeight || 1;
      // Scroll progress in viewport heights: 0 = hero top, 1 = page 2, 2 = page 3.
      const p = prefersReduced ? 0 : window.scrollY / vh;

      // Horizontal travel: RIGHT of the content on page 1 -> CENTER by page 2,
      // then HOLD (clamped) so it never slides off the window.
      const t = Math.min(Math.max(p, 0), 1);
      const targetX = RIGHT_X * (1 - t); // RIGHT_X (page 1) -> 0 (centered, page 2)
      curX += (targetX - curX) * 0.12;   // smooth follow for buttery motion
      bearGroup.position.x = curX;

      // Fade + float away after page 2.
      const fade = Math.min(Math.max((p - FADE_START) / (FADE_END - FADE_START), 0), 1);
      setBearOpacity(1 - fade);
      bearGroup.visible = fade < 1;

      // Gentle idle bob + a lift as it leaves.
      const bob = prefersReduced ? 0 : Math.sin(elapsed * 1.4) * 0.06;
      bearGroup.position.y = bearAlignY + VISUAL_CENTER_Y + bob + fade * 0.9;
      const s = 1 - fade * 0.25;
      bearGroup.scale.setScalar(s);
      if (!prefersReduced) bear.rotation.z = Math.sin(elapsed * 0.8) * 0.015;
    }

    renderer.render(scene, camera);
  }

  function loop() {
    renderFrame();
    rafId = requestAnimationFrame(loop);
  }
  function start() {
    if (running) return;
    running = true;
    clock.getDelta();
    loop();
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  if (prefersReduced) {
    renderFrame();
    setTimeout(renderFrame, 400);
    setTimeout(renderFrame, 1200);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', () => {
    if (prefersReduced) return;
    if (document.hidden) stop();
    else start();
  });
}
