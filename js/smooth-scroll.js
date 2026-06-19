/* =========================================================================
   What-A-Toy! — Smooth scrolling (Lenis + GSAP ScrollTrigger bridge)
   ES module. Exports initSmoothScroll(). Does NOT auto-run on import.
   ========================================================================= */

/**
 * Initialise Lenis smooth scrolling and bridge it to GSAP's ScrollTrigger
 * and ticker. Returns the Lenis instance, or null when the user prefers
 * reduced motion (in which case the page uses native scrolling).
 *
 * Also exposes the instance at window.WhatAToy.lenis so other modules
 * (e.g. transitions.js) can drive programmatic scrolling.
 *
 * @returns {import('lenis').default | null}
 */
export function initSmoothScroll() {
  window.WhatAToy = window.WhatAToy || {};

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Respect reduced-motion: no smooth-scroll hijacking.
  if (prefersReduced) {
    window.WhatAToy.lenis = null;
    return null;
  }

  // Lenis is loaded as a UMD global in index.html (normalised to window.Lenis).
  const Lenis = window.Lenis;
  if (typeof Lenis !== 'function') {
    console.warn('[smooth-scroll] Lenis global not found; native scrolling.');
    window.WhatAToy.lenis = null;
    return null;
  }

  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    // page-nav.js drives wheel gestures (full-page snap) and uses lenis.scrollTo
    // for the smooth animated transitions, so Lenis must not also smooth-wheel.
    smoothWheel: false,
    smoothTouch: false,
    touchMultiplier: 1.5,
  });

  // Bridge Lenis -> ScrollTrigger so scroll-scrubbed animations stay in sync.
  if (window.gsap && window.ScrollTrigger) {
    lenis.on('scroll', window.ScrollTrigger.update);

    window.gsap.ticker.add((time) => {
      // gsap ticker is in seconds; Lenis.raf wants milliseconds.
      lenis.raf(time * 1000);
    });

    // Lenis runs its own RAF loop; disable GSAP's lag smoothing so the two
    // don't fight over timing.
    window.gsap.ticker.lagSmoothing(0);
  } else {
    // No GSAP available: keep Lenis alive with its own RAF loop.
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  window.WhatAToy.lenis = lenis;
  return lenis;
}
