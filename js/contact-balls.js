/* =========================================================================
   What-A-Toy! — contact-balls.js  (ES module)
   Plays the colorful "ball drop" on the contact section the first time it
   scrolls into view: adds `.is-dropping`, which the CSS animation keys off.
   Using IntersectionObserver (not load time) means the user actually sees the
   bounce instead of it finishing before they reach the bottom of the page.

   Exports: initContactBalls()
   ========================================================================= */

export function initContactBalls() {
  const section = document.getElementById('contact');
  if (!section) return;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reduced motion: the CSS already rests the balls on the floor; nothing to do.
  if (prefersReduced || !('IntersectionObserver' in window)) {
    section.classList.add('is-dropping');
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add('is-dropping');
          io.disconnect(); // play once
        }
      });
    },
    { threshold: 0.35 }
  );
  io.observe(section);
}
