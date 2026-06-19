/* =========================================================================
   What-A-Toy! — Page transition wipe + in-page nav orchestration
   ES module. Exports initTransitions(lenis). Does NOT auto-run on import.

   Behaviour:
   - One-time intro reveal of #transition-overlay on first load (panels sweep
     up and off, revealing the page).
   - On click of any in-page anchor ([data-nav] or href^="#"): prevent the
     default jump, sweep the three panels (red/gold/navy) up to cover the
     viewport, scroll to the target (Lenis if provided, else native), then
     retract the panels upward.
   - prefers-reduced-motion: skip the wipe entirely, just scroll to target.
   ========================================================================= */

/**
 * @param {import('lenis').default | null} [lenis] Lenis instance (or null).
 */
export function initTransitions(lenis) {
  const overlay = document.getElementById('transition-overlay');
  const panels = overlay
    ? Array.from(overlay.querySelectorAll('.transition__panel'))
    : [];

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const gsap = window.gsap;
  const hasWipe = !!(overlay && panels.length && gsap && !prefersReduced);

  const NAV_H = 80; // matches --nav-h; offset so sticky nav doesn't cover target

  /* ---- Scroll helper: prefer Lenis, fall back to native ---------------- */
  function scrollToTarget(target) {
    if (!target) return;
    const liveLenis = lenis || (window.WhatAToy && window.WhatAToy.lenis);
    if (liveLenis && typeof liveLenis.scrollTo === 'function') {
      liveLenis.scrollTo(target, { offset: -NAV_H });
    } else if (target.scrollIntoView) {
      target.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }

  /* ---- Resolve an anchor's target element ------------------------------ */
  function resolveTarget(anchor) {
    const href = anchor.getAttribute('href') || '';
    const hash = href.startsWith('#') ? href : (href.indexOf('#') >= 0 ? href.slice(href.indexOf('#')) : '');
    if (!hash || hash === '#') return null;
    const id = decodeURIComponent(hash.slice(1));
    return document.getElementById(id);
  }

  /* ---- The wipe-and-scroll sequence ------------------------------------ */
  let animating = false;

  function wipeTo(target) {
    if (!hasWipe) {
      scrollToTarget(target);
      return;
    }
    if (animating) {
      // Mid-animation click: just scroll, don't stack timelines.
      scrollToTarget(target);
      return;
    }
    animating = true;

    overlay.setAttribute('aria-hidden', 'false');

    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: () => {
        animating = false;
        overlay.setAttribute('aria-hidden', 'true');
        // Park panels below the viewport again for the next run.
        gsap.set(panels, { yPercent: 100 });
      },
    });

    // 1) Sweep panels up from below to cover the screen (staggered layers).
    tl.set(panels, { yPercent: 100 });
    tl.to(panels, {
      yPercent: 0,
      duration: 0.5,
      stagger: 0.08,
    });

    // 2) At full cover, jump to the target instantly (hidden behind panels).
    tl.add(() => scrollToTarget(target));

    // 3) Retract panels upward off the top of the viewport.
    tl.to(
      panels,
      {
        yPercent: -100,
        duration: 0.55,
        stagger: 0.08,
      },
      '+=0.08'
    );
  }

  /* ---- Delegate clicks on in-page anchors ------------------------------ */
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[data-nav], a[href^="#"]');
    if (!anchor) return;

    // Ignore modified clicks / new-tab intents.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }

    const target = resolveTarget(anchor);
    if (!target) return; // not an in-page hash we can resolve

    e.preventDefault();
    wipeTo(target);
  });

  /* ---- Park the overlay off-screen (no intro reveal on load) ------------
     The page now communicates section changes through the scrolling
     background-color journey, so we skip the on-load panel sweep that used to
     play on every refresh. Panels are only used for the nav-click wipe above. */
  if (overlay) {
    overlay.setAttribute('aria-hidden', 'true');
    if (gsap) gsap.set(panels, { yPercent: 100 });
  }
}
