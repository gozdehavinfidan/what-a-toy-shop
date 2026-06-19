/* =========================================================================
   What-A-Toy! — reveals.js  (ES module)
   Fade/slide-up reveal for .reveal elements with a gentle stagger.

   Uses IntersectionObserver (not ScrollTrigger position-caching) so reveals
   stay reliable even as lazy gallery images and the 3D globe change the page
   height after load, and regardless of Lenis's smoothed scrolling. GSAP, when
   present, performs the tween; otherwise a CSS transition is used as fallback.
   Honors prefers-reduced-motion by showing everything immediately.

   Exports: initReveals()
   ========================================================================= */

export function initReveals() {
  const els = Array.from(document.querySelectorAll('.reveal'));
  if (!els.length) return;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const gsap = window.gsap;

  // --- Fallback / reduced-motion: just show everything now ----------------
  function showAllInstantly() {
    els.forEach((el) => {
      el.classList.add('is-visible');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  if (prefersReduced || !('IntersectionObserver' in window)) {
    showAllInstantly();
    return;
  }

  // Hidden start state (GSAP owns the inline styles when available).
  if (gsap) {
    gsap.set(els, { opacity: 0, y: 24 });
  } else {
    els.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
    });
  }

  function reveal(el) {
    if (gsap) {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        overwrite: true,
        onComplete: () => el.classList.add('is-visible'),
      });
    } else {
      el.style.transition = 'opacity .7s ease, transform .7s ease';
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.classList.add('is-visible');
    }
  }

  // Stagger elements that enter together so they cascade rather than pop.
  const queue = [];
  let timer = null;
  function flush() {
    if (timer) return;
    timer = setInterval(() => {
      const el = queue.shift();
      if (el) reveal(el);
      if (!queue.length) {
        clearInterval(timer);
        timer = null;
      }
    }, 110);
  }

  const io = new IntersectionObserver(
    (entries) => {
      // Reveal in document order for a tidy cascade.
      entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
        .forEach((e) => {
          io.unobserve(e.target);
          queue.push(e.target);
        });
      flush();
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
  );

  els.forEach((el) => io.observe(el));
}
