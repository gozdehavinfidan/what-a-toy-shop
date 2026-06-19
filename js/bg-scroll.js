/* =========================================================================
   What-A-Toy! — bg-scroll.js  (ES module)
   Drives the scroll background "journey": tweens the color of #bg-layer to
   match whichever [data-bg] section currently occupies the viewport center.
   Sections sharing a data-bg value share a color (related pages = same bg).

   Depends on globals: window.gsap, window.ScrollTrigger (registered in
   index.html). Falls back gracefully (static color) without them.

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
  const ScrollTrigger = window.ScrollTrigger;

  // Seed the initial color from the first section (hero).
  const firstKey = sections[0].getAttribute('data-bg');
  layer.style.backgroundColor = colorFor(firstKey);

  // No GSAP/ScrollTrigger: leave the seeded color; nothing animated.
  if (!gsap || !ScrollTrigger) return;

  let current = firstKey;
  function applyColor(key) {
    if (key === current) return;
    current = key;
    gsap.to(layer, {
      backgroundColor: colorFor(key),
      duration: 0.6,
      ease: 'power2.out',
      overwrite: true,
    });
  }

  // One trigger per section: it "owns" the page color while its body spans the
  // viewport middle. As you scroll, exactly one section is active at a time.
  sections.forEach((sec) => {
    const key = sec.getAttribute('data-bg');
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => {
        if (self.isActive) applyColor(key);
      },
    });
  });

  // Positions depend on final layout (images, globe, fonts) — recompute once
  // everything settles so the color hand-offs line up with the real sections.
  if (document.readyState === 'complete') {
    ScrollTrigger.refresh();
  } else {
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  }
}
