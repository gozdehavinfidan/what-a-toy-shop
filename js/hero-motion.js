/* =========================================================================
   What-A-Toy! — js/hero-motion.js  (ES module)
   Makes the hero feel alive (without becoming a noisy "carousel"):
     1. Subtle MOUSE PARALLAX — frames, badge and decoration shift by small,
        depth-varied amounts as the cursor moves (desktop fine-pointer only).
     2. PHOTO CROSS-FADE — each collage frame slowly cycles through real store
        photos via two stacked <img> layers (showcases the 80-photo library).
     3. ROTATING WORD — the headline's last word gently swaps
        (Toys -> Plush -> Play -> Fun -> Joy), keeping ONE clear message.
   Everything is restraint-first and fully disabled under prefers-reduced-motion.
   Exports: initHeroMotion()
   ========================================================================= */

const PHOTO_POOLS = {
  'hero__photo--main': [
    'assets/Premium Outlet Mall TULSA/PremiumOutlet (1).jpeg',
    'assets/Grapevine Mills Mall GRAPEVINE/Grapevine (1).jpeg',
    'assets/The Empire Mall South Dakota/Empire (1).jpeg',
    'assets/Woodland Hills Mall TULSA/Woodland (1).jpeg',
  ],
  'hero__photo--plush': [
    'assets/Towne East Square Mall WICHITA/peluslar/TowneEast (10).jpeg',
    'assets/Towne East Square Mall WICHITA/peluslar/peluslar.jpeg',
    'assets/Towne East Square Mall WICHITA/peluslar/TowneEast (12).jpeg',
    'assets/Towne East Square Mall WICHITA/peluslar/TowneEast (24).jpeg',
  ],
  'hero__photo--ride': [
    'assets/Towne East Square Mall WICHITA/akulu araba motor/akulu motor.jpeg',
    'assets/Towne East Square Mall WICHITA/akulu araba motor/TowneEast (20).jpeg',
    'assets/Towne East Square Mall WICHITA/akulu araba motor/TowneEast (22).jpeg',
    'assets/Towne East Square Mall WICHITA/akulu araba motor/TowneEast (17).jpeg',
  ],
};
const STAGGER = { 'hero__photo--main': 0, 'hero__photo--plush': 1500, 'hero__photo--ride': 3000 };
const CYCLE_MS = 4200;

const ROTATE_WORDS = ['Toys', 'Plush', 'Play', 'Fun', 'Joy'];
const ROTATE_MS = 2400;

export function initHeroMotion() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  const prefersReduced =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 1. Mouse parallax (desktop, fine pointer, motion allowed) ---- */
  const finePointer =
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !prefersReduced) {
    let rafId = 0;
    let tx = 0;
    let ty = 0;
    const apply = () => {
      rafId = 0;
      hero.style.setProperty('--px', tx.toFixed(3));
      hero.style.setProperty('--py', ty.toFixed(3));
    };
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2; // -1 .. 1
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!rafId) rafId = requestAnimationFrame(apply);
    });
    hero.addEventListener('mouseleave', () => {
      tx = 0;
      ty = 0;
      if (!rafId) rafId = requestAnimationFrame(apply);
    });
  }

  /* ---- 2. Photo cross-fade cycling ---- */
  if (!prefersReduced) {
    Object.keys(PHOTO_POOLS).forEach((cls) => {
      const figure = document.querySelector('.' + cls);
      if (!figure) return;
      const pool = PHOTO_POOLS[cls];
      if (!pool || pool.length < 2) return;

      const a = figure.querySelector('img');
      if (!a) return;
      a.classList.add('hero__photo-layer');

      // Second stacked layer, initially transparent.
      const b = a.cloneNode(false);
      b.classList.add('hero__photo-layer');
      b.style.opacity = '0';
      b.removeAttribute('loading');
      figure.appendChild(b);

      let idx = 0;
      let showingA = true;
      const stepOnce = () => {
        const next = (idx + 1) % pool.length;
        const src = encodeURI(pool[next]);
        const incoming = showingA ? b : a;
        const outgoing = showingA ? a : b;
        const pre = new Image();
        pre.onload = () => {
          incoming.src = src;
          incoming.style.opacity = '1';
          outgoing.style.opacity = '0';
          showingA = !showingA;
          idx = next;
        };
        pre.src = src; // preload; swap only once it's ready (no blank flash)
      };

      setTimeout(() => {
        stepOnce();
        setInterval(stepOnce, CYCLE_MS);
      }, STAGGER[cls] || 0);
    });
  }

  /* ---- 3. Rotating headline word ---- */
  const wordEl = document.querySelector('.hero__rotator-word');
  if (wordEl && !prefersReduced) {
    let wi = 0;
    setInterval(() => {
      wi = (wi + 1) % ROTATE_WORDS.length;
      wordEl.classList.add('is-swapping');
      setTimeout(() => {
        wordEl.textContent = ROTATE_WORDS[wi];
        wordEl.classList.remove('is-swapping');
      }, 300);
    }, ROTATE_MS);
  }
}
