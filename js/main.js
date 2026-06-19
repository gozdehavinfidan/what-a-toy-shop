/* =========================================================================
   What-A-Toy! — Application entry point
   ES module (no exports). Imports every init function and wires them up on
   DOMContentLoaded. Each call is wrapped in try/catch so a single failing
   module cannot blank the whole page.
   ========================================================================= */

import { initSmoothScroll } from './smooth-scroll.js?v=2';
import { initNav } from './nav.js?v=1';
import { initHeadline } from './text-effect.js?v=2';
import { initHeroMotion } from './hero-motion.js?v=2';
import { initProducts } from './products.js?v=3';
import { initStoreDetail } from './store-detail.js?v=5';
import { initGlobe } from './globe-locations.js?v=8';
import { initLightbox } from './lightbox.js?v=3';
import { initGallery } from './gallery.js?v=6';
import { initReveals } from './reveals.js?v=1';
import { initContactBalls } from './contact-balls.js?v=1';
import { initBgScroll } from './bg-scroll.js?v=1';
import { initTransitions } from './transitions.js?v=2';
import { initPageNav } from './page-nav.js?v=7';

// Shared cross-module namespace.
window.WhatAToy = window.WhatAToy || {};

/**
 * Run an init function defensively: any throw is logged and swallowed so the
 * rest of the page still boots.
 * @param {string} label
 * @param {Function} fn
 * @returns {*} the function's return value, or undefined on failure
 */
function safe(label, fn) {
  try {
    return fn();
  } catch (err) {
    console.warn(`[main] ${label} failed:`, err);
    return undefined;
  }
}

/** Like safe(), but awaits async inits and swallows rejections too. */
async function safeAwait(label, fn) {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[main] ${label} failed:`, err);
    return undefined;
  }
}

async function boot() {
  // Smooth scroll first so its instance (lenis) can be handed to transitions.
  const lenis = safe('initSmoothScroll', initSmoothScroll);

  safe('initNav', initNav);
  safe('initHeadline', initHeadline);
  safe('initHeroMotion', initHeroMotion);
  safe('initStoreDetail', initStoreDetail);
  safe('initLightbox', initLightbox);

  // Data-driven sections render their DOM asynchronously (fetch). Await them so
  // their .reveal elements exist BEFORE initReveals snapshots the document —
  // otherwise async-rendered cards stay stuck in the hidden reveal state.
  await Promise.all([
    safeAwait('initProducts', initProducts),
    safeAwait('initGlobe', initGlobe),
    safeAwait('initGallery', initGallery),
  ]);

  safe('initReveals', initReveals);
  safe('initContactBalls', initContactBalls);
  safe('initBgScroll', initBgScroll);
  safe('initTransitions', () => initTransitions(lenis));
  safe('initPageNav', () => initPageNav(lenis));

  // Footer year (harmless, keeps the copyright current without a separate module).
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
