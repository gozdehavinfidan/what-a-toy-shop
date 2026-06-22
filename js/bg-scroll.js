/* =========================================================================
   What-A-Toy! — bg-scroll.js  (ES module)
   Drives the scroll background "journey": tweens the color of #bg-layer to
   match whichever [data-bg] section currently occupies the viewport center.
   Sections sharing a data-bg value share a color (related pages = same bg).

   Source of truth = LIVE layout, polled every animation frame (the same
   approach page-nav.js uses for its active dot). We deliberately do NOT use
   precomputed ScrollTrigger boundaries here: the globe, product marquee,
   gallery grid and store list all render asynchronously (after fetch) and
   resize their sections AFTER load, which left those boundaries stale and made
   the wrong section "own" the color — i.e. the page background sometimes
   settled on the wrong color. Measuring each frame can never drift out of sync.

   Uses window.gsap for a smooth color tween when available; otherwise sets the
   color instantly. No hard dependency on ScrollTrigger.

   Exports: initBgScroll()
   ========================================================================= */

export function initBgScroll() {
  const layer = document.getElementById('bg-layer');
  if (!layer) return;

  const sections = Array.from(document.querySelectorAll('[data-bg]'));
  if (!sections.length) return;

  // Resolve the palette from CSS custom properties so colors stay in one place.
  const root = getComputedStyle(document.documentElement);
  const colorFor = (key) => {
    const map = { sun: '--bg-sun', red: '--bg-red', navy: '--bg-navy' };
    return root.getPropertyValue(map[key] || '--bg-sun').trim() || '#F9CE51';
  };

  const gsap = window.gsap;

  // iOS Safari (15+) re-tints the status bar / bottom toolbar live when this
  // meta tag's `content` changes. We keep it in lockstep with #bg-layer so the
  // browser chrome always matches the section you're actually looking at.
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const setTheme = (color) => {
    if (themeMeta && color) themeMeta.setAttribute('content', color);
  };

  // Seed the initial color from the first section (hero).
  let current = sections[0].getAttribute('data-bg');
  layer.style.backgroundColor = colorFor(current);
  setTheme(colorFor(current));

  function applyColor(key) {
    if (!key || key === current) return;
    current = key;
    const color = colorFor(key);
    if (gsap) {
      gsap.to(layer, {
        backgroundColor: color,
        duration: 0.6,
        ease: 'power2.out',
        overwrite: true,
        // Mirror the *interpolated* color each frame so the toolbar fades in
        // sync with the page instead of snapping to the target early.
        onUpdate: () => setTheme(getComputedStyle(layer).backgroundColor),
        onComplete: () => setTheme(color),
      });
    } else {
      layer.style.backgroundColor = color;
      setTheme(color);
    }
  }

  // Which [data-bg] section's center is nearest the viewport center right now?
  // With full-height pages this is exactly the page you're looking at, and the
  // color flips at the midpoint between two pages — so every page holds one
  // stable color for its whole extent.
  function activeKey() {
    const mid = window.scrollY + window.innerHeight / 2;
    let best = sections[0];
    let bestDist = Infinity;
    for (const sec of sections) {
      const rect = sec.getBoundingClientRect();
      const center = rect.top + window.scrollY + rect.height / 2;
      const d = Math.abs(center - mid);
      if (d < bestDist) {
        bestDist = d;
        best = sec;
      }
    }
    return best.getAttribute('data-bg');
  }

  // Poll live positions every frame. The loop only triggers a tween when the
  // active section actually changes, and the browser pauses rAF while the tab
  // is hidden, so this is cheap.
  function tick() {
    applyColor(activeKey());
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
