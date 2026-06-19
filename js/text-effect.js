/* =========================================================================
   What-A-Toy! — js/text-effect.js
   Per-letter elastic bounce-in for the hero headline (#hero-title).
   Uses GSAP + SplitText (loaded as UMD globals in index.html).
   Reduced-motion: just make the headline visible, no animation.
   Exports: initHeadline()
   ========================================================================= */

export function initHeadline() {
  const title = document.getElementById('hero-title');
  if (!title) return;

  // Split only the fixed part of the headline; the rotating word
  // (.hero__rotator) animates separately in hero-motion.js.
  const target = title.querySelector('.hero__title-fixed') || title;

  const gsap = window.gsap;
  const SplitText = window.SplitText;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Fallbacks: no GSAP, no SplitText, or reduced motion -> show as-is ---
  if (!gsap || !SplitText || prefersReduced) {
    title.style.opacity = '1';
    return;
  }

  // Split the headline into characters (and words, so spaces don't collapse).
  let split;
  try {
    split = new SplitText(target, {
      type: 'chars,words',
      charsClass: 'char',
      wordsClass: 'word',
    });
  } catch (err) {
    // If SplitText fails for any reason, degrade gracefully.
    title.style.opacity = '1';
    console.warn('initHeadline: SplitText failed —', err);
    return;
  }

  // Make sure the container is visible now that chars are wrapped.
  gsap.set(title, { opacity: 1 });

  // Elastic bounce-in: each letter drops + scales up with a springy stagger.
  gsap.from(split.chars, {
    opacity: 0,
    yPercent: 120,
    scale: 0.4,
    rotation: () => gsap.utils.random(-12, 12), // playful, toy-store wobble
    transformOrigin: '50% 100%',
    ease: 'elastic.out(1, 0.4)',
    duration: 1.1,
    delay: 0.2,
    stagger: { each: 0.05, from: 'start' },
  });
}
