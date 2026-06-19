/* =========================================================================
   What-A-Toy! — Navbar behavior
   ES module. Exports initNav() (called by main.js; does NOT auto-run).
   Responsibilities:
     · hamburger toggle (open/close mobile menu, aria-expanded sync)
     · close menu when a nav link is clicked
     · active-link highlight as sections scroll into view
     · scrolled-state shadow on the bar
   Reduced-motion safe (no animation dependencies here; CSS handles motion).
   ========================================================================= */

export function initNav() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  const links = Array.from(document.querySelectorAll('.navbar__link'));

  if (!navbar || !toggle || !menu) return;

  /* ---------------------------------------------------------------------
     1) Hamburger toggle
     --------------------------------------------------------------------- */
  const openMenu = () => {
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
  };

  const closeMenu = () => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  };

  const isOpen = () => menu.classList.contains('is-open');

  toggle.addEventListener('click', () => {
    isOpen() ? closeMenu() : openMenu();
  });

  /* Close on Escape and return focus to the toggle */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      closeMenu();
      toggle.focus();
    }
  });

  /* Close when clicking outside the open menu (mobile) */
  document.addEventListener('click', (e) => {
    if (!isOpen()) return;
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      closeMenu();
    }
  });

  /* ---------------------------------------------------------------------
     2) Close menu when any nav link / CTA is clicked
     --------------------------------------------------------------------- */
  menu.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) closeMenu();
  });

  /* ---------------------------------------------------------------------
     3) Scrolled-state shadow
     --------------------------------------------------------------------- */
  const updateScrolled = () => {
    navbar.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  updateScrolled();
  window.addEventListener('scroll', updateScrolled, { passive: true });

  /* ---------------------------------------------------------------------
     4) Active-link highlight as sections scroll into view
        Maps each nav link's href hash to its section, then uses an
        IntersectionObserver to flag the section nearest the top of the
        viewport as active. Falls back to a scroll handler if needed.
     --------------------------------------------------------------------- */
  const linkByHash = new Map();
  const sections = [];

  links.forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (!href.startsWith('#')) return;
    const section = document.getElementById(href.slice(1));
    if (!section) return;
    linkByHash.set(href.slice(1), link);
    sections.push(section);
  });

  const setActive = (id) => {
    links.forEach((link) => {
      const href = link.getAttribute('href') || '';
      link.classList.toggle('is-active', href === '#' + id);
    });
  };

  if (sections.length && 'IntersectionObserver' in window) {
    /* Track visibility ratios; the most-visible section wins. */
    const ratios = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let bestId = null;
        let bestRatio = 0;
        ratios.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });

        if (bestId) setActive(bestId);
      },
      {
        /* Offset the top by the nav height so a section is "active" once it
           clears the sticky bar. */
        rootMargin: `-${parseInt(getNavHeight(), 10) || 72}px 0px -55% 0px`,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* Helper: read --nav-h token (e.g. "72px") for the rootMargin offset. */
  function getNavHeight() {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue('--nav-h')
      .trim();
    return v || '72px';
  }
}
