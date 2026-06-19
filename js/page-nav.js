/* =========================================================================
   What-A-Toy! — page-nav.js  (ES module)
   Full-page ("one section per gesture") snap navigation + a side page-dot
   rail. A small wheel / arrow-key / swipe gesture smoothly advances to the
   next 100vh page. The snap is SHORT (~600ms) and INTERRUPTIBLE — reversing
   direction or clicking a dot re-aims immediately instead of being ignored.
   Free internal scrolling is still allowed inside [data-scroll="y"] elements
   until they reach their edge, and sections taller than the viewport scroll
   naturally until their top/bottom edge.

   Desktop/pointer only — on touch/narrow screens the page falls back to
   natural stacked scrolling (sections are auto-height there).

   The Space key is NOT hijacked (it scrolls natively, important for a11y);
   only Arrow/Page keys snap.

   Exports: initPageNav(lenis)
   ========================================================================= */

const PAGE_SELECTOR = '#hero, #products, #gallery, #locations, #contact, #footer';
const ANIM_MS = 600;
// Short, friendly labels for the dot rail (skips #footer).
const DOT_LABELS = {
  hero: 'Home',
  products: 'Toys',
  gallery: 'Gallery',
  locations: 'Our Shops',
  contact: 'Our Story',
};

export function initPageNav(lenis) {
  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Only enable the snap on wide, fine-pointer screens.
  const enabled =
    window.matchMedia('(min-width: 901px)').matches &&
    !window.matchMedia('(hover: none)').matches;
  if (!enabled) return;

  const pages = Array.from(document.querySelectorAll(PAGE_SELECTOR));
  if (pages.length < 2) return;

  // Time-based lock (no "stuck forever" risk): a new same-direction gesture is
  // ignored until the lock expires, but reversing direction / clicking a dot
  // re-aims immediately.
  let lockUntil = 0;
  let lastDir = 0;
  const now = () =>
    window.performance && performance.now ? performance.now() : Date.now();

  function docTop(el) {
    return el.getBoundingClientRect().top + window.scrollY;
  }

  // Which page currently occupies the viewport center?
  function currentIndex() {
    const mid = window.scrollY + window.innerHeight / 2;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < pages.length; i++) {
      const top = docTop(pages[i]);
      const center = top + pages[i].offsetHeight / 2;
      const d = Math.abs(center - mid);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  }

  // Scroll to a specific page index (used by gestures AND dot clicks).
  function goTo(next) {
    next = Math.min(Math.max(next, 0), pages.length - 1);
    if (next === currentIndex()) return;
    lockUntil = now() + ANIM_MS;
    const y = docTop(pages[next]);
    if (lenis && typeof lenis.scrollTo === 'function' && !prefersReduced) {
      lenis.scrollTo(y, {
        duration: ANIM_MS / 1000,
        easing: (t) => 1 - Math.pow(1 - t, 3), // easeOutCubic
        lock: true,
      });
    } else {
      window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
    }
  }

  function go(dir) {
    // Locked only against repeated SAME-direction gestures; a reversal
    // interrupts and re-aims right away.
    if (now() < lockUntil && dir === lastDir) return;
    lastDir = dir;
    goTo(currentIndex() + dir);
  }

  // Find a scrollable ancestor that can still scroll in `dir`.
  function innerScrollCanTake(target, dir) {
    let el = target;
    while (el && el !== document.body && el !== document.documentElement) {
      if (el.dataset && el.dataset.scroll === 'y') {
        const canDown = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
        const canUp = el.scrollTop > 0;
        return dir > 0 ? canDown : canUp;
      }
      el = el.parentElement;
    }
    return false;
  }

  // ---- Wheel ----
  window.addEventListener(
    'wheel',
    (e) => {
      // Over the globe: let globe.gl zoom; never page-snap (don't preventDefault).
      if (e.target && e.target.closest && e.target.closest('#globe-canvas')) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      if (innerScrollCanTake(e.target, dir)) return; // let the inner area scroll

      // If the current section is TALLER than the viewport, scroll through it
      // naturally and only snap at its top/bottom.
      const cur = pages[currentIndex()];
      if (cur && cur.offsetHeight > window.innerHeight + 4) {
        const top = docTop(cur);
        const bottom = top + cur.offsetHeight;
        const atTop = window.scrollY <= top + 6;
        const atBottom = window.scrollY + window.innerHeight >= bottom - 6;
        if ((dir > 0 && !atBottom) || (dir < 0 && !atTop)) return;
      }

      e.preventDefault();
      if (Math.abs(e.deltaY) < 4) return;
      go(dir);
    },
    { passive: false }
  );

  // ---- Keyboard (Arrow/Page only — Space is left to scroll natively) ----
  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      go(-1);
    }
  });

  // ---- Touch (best-effort swipe) ----
  let touchY = null;
  window.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (touchY == null) return;
    const dy = touchY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 40) {
      const dir = dy > 0 ? 1 : -1;
      if (!innerScrollCanTake(e.target, dir)) go(dir);
    }
    touchY = null;
  }, { passive: true });

  // ---- Page-dot rail (one dot per section, minus the footer) ----
  const dotPages = pages.filter((p) => p.id !== 'footer');
  const rail = document.createElement('nav');
  rail.className = 'page-dots';
  rail.setAttribute('aria-label', 'Jump to section');
  const dots = dotPages.map((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'page-dots__dot';
    b.setAttribute('aria-label', DOT_LABELS[p.id] || p.id);
    b.addEventListener('click', () => goTo(pages.indexOf(p)));
    rail.appendChild(b);
    return b;
  });
  document.body.appendChild(rail);

  // Keep the active dot in sync via a cheap rAF poll. This is Lenis-agnostic:
  // Lenis updates window.scrollY but doesn't reliably emit a native 'scroll'
  // event, so polling the live position is the robust source of truth. The
  // loop only touches the DOM when the active section actually changes, and
  // the browser pauses rAF while the tab is hidden.
  let lastActiveIdx = -1;
  function syncActiveDot() {
    const i = currentIndex();
    if (i !== lastActiveIdx) {
      lastActiveIdx = i;
      const activePage = pages[i];
      dots.forEach((d, idx) => {
        const on = dotPages[idx] === activePage;
        d.classList.toggle('is-active', on);
        if (on) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
    }
    requestAnimationFrame(syncActiveDot);
  }
  requestAnimationFrame(syncActiveDot);
}
