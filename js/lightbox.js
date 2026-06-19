/* =========================================================================
   What-A-Toy! — Lightbox
   Builds the #lightbox modal and exposes window.WhatAToy.openLightbox(items, i).
   Features: prev/next, counter, Esc to close, arrow keys, focus trap,
   backdrop click to close, body scroll lock while open.
   ES module: exports initLightbox(); does NOT auto-run on import.
   ========================================================================= */

export function initLightbox() {
  const root = document.getElementById('lightbox');
  if (!root) return;

  // ---- Shared namespace ----
  window.WhatAToy = window.WhatAToy || {};

  // ---- State ----
  let items = [];
  let index = 0;
  let lastFocused = null; // element to restore focus to on close

  // ---- Build the modal DOM once ----
  root.classList.add('lightbox');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Photo viewer');
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = [
    // Controls live OUTSIDE the figure (which is transformed), pinned to the
    // lightbox edges so they never sit on top of the image.
    '<button type="button" class="lightbox__btn lightbox__btn--close" aria-label="Close (Esc)">&times;</button>',
    '<button type="button" class="lightbox__btn lightbox__btn--prev" aria-label="Previous photo">&#8249;</button>',
    '<button type="button" class="lightbox__btn lightbox__btn--next" aria-label="Next photo">&#8250;</button>',
    '<figure class="lightbox__figure">',
    '  <img class="lightbox__img" alt="" />',
    '  <figcaption class="lightbox__caption"><span class="lightbox__caption-text"></span><span class="lightbox__counter"></span></figcaption>',
    '</figure>'
  ].join('');

  const figureEl = root.querySelector('.lightbox__figure');
  const imgEl = root.querySelector('.lightbox__img');
  const captionTextEl = root.querySelector('.lightbox__caption-text');
  const counterEl = root.querySelector('.lightbox__counter');
  const closeBtn = root.querySelector('.lightbox__btn--close');
  const prevBtn = root.querySelector('.lightbox__btn--prev');
  const nextBtn = root.querySelector('.lightbox__btn--next');

  // Buttons that participate in the focus trap, in tab order.
  const focusables = [closeBtn, prevBtn, nextBtn];

  /* ---- Render the current item ---- */
  function render() {
    if (!items.length) return;
    const item = items[index];
    // RAW path -> encodeURI (spaces / parentheses / Turkish folder).
    imgEl.src = encodeURI(item.src);
    imgEl.alt = item.caption || 'Store photo';
    captionTextEl.textContent = item.caption || '';
    counterEl.textContent = (index + 1) + ' / ' + items.length;

    const multiple = items.length > 1;
    prevBtn.hidden = !multiple;
    nextBtn.hidden = !multiple;
  }

  function show(i) {
    index = (i + items.length) % items.length; // wrap around
    render();
  }

  function next() { show(index + 1); }
  function prev() { show(index - 1); }

  /* ---- Open ---- */
  function open(list, startIndex) {
    if (!Array.isArray(list) || !list.length) return;
    items = list;
    index = Math.min(Math.max(startIndex | 0, 0), items.length - 1);
    lastFocused = document.activeElement;

    render();
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // scroll lock

    document.addEventListener('keydown', onKeydown);
    // Focus the close button so keyboard users land inside the dialog.
    closeBtn.focus();
  }

  /* ---- Close ---- */
  function close() {
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);
    // Release the image so a closed lightbox isn't holding a large bitmap.
    imgEl.removeAttribute('src');
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  /* ---- Keyboard: Esc, arrows, Tab focus trap ---- */
  function onKeydown(e) {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'ArrowRight':
        if (items.length > 1) { e.preventDefault(); next(); }
        break;
      case 'ArrowLeft':
        if (items.length > 1) { e.preventDefault(); prev(); }
        break;
      case 'Tab': {
        // Trap focus among the visible control buttons.
        const visible = focusables.filter((b) => !b.hidden);
        if (!visible.length) break;
        const first = visible[0];
        const last = visible[visible.length - 1];
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === first || !root.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !root.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
        break;
      }
      default:
        break;
    }
  }

  /* ---- Wire controls ---- */
  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  // Backdrop click (the scrim itself) closes; clicks on the figure or the
  // control buttons do not.
  root.addEventListener('click', (e) => {
    if (e.target === root) close();
  });

  // ---- Expose on shared namespace ----
  window.WhatAToy.openLightbox = open;
}
