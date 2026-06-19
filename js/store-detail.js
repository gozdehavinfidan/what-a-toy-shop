/* =========================================================================
   store-detail.js  (ES module)
   export initStoreDetail()
   - Wire the #store-detail panel: close button, Esc, focus management
   - Assign window.WhatAToy.openStoreDetail(id):
       populate name, "City, ST", mini photo strip (encodeURI'd),
       "Get Directions" google maps search link, hours-vary note,
       then reveal the panel.
   Reads the locations cache set by globe-locations.js
   (window.WhatAToy.locations), or fetches it as a fallback.
   ========================================================================= */

window.WhatAToy = window.WhatAToy || {};

const LOCATIONS_URL = 'content/locations.json';
const HOURS_NOTE = "Hours vary by mall — please check the mall's website.";

// Element handles (resolved in initStoreDetail).
let panel,
  closeBtn,
  photosEl,
  hoursEl,
  directionsEl,
  moreBtn;

// Remembers what to return focus to when the panel closes.
let lastFocused = null;
// The currently shown location (for the "More photos" button).
let currentLoc = null;

export function initStoreDetail() {
  panel = document.getElementById('store-detail');
  if (!panel) return;

  closeBtn = document.getElementById('store-detail-close');
  photosEl = document.getElementById('store-detail-photos');
  hoursEl = document.getElementById('store-detail-hours');
  directionsEl = document.getElementById('store-detail-directions');
  moreBtn = document.getElementById('store-detail-more');

  // ---- Close interactions ----
  if (closeBtn) {
    closeBtn.addEventListener('click', closeStoreDetail);
  }

  // ---- "More photos" -> open the gallery filtered to this store ----
  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      if (!currentLoc) return;
      // Activate the matching gallery filter chip (group id === location id).
      const chip = document.querySelector(
        `.gallery__chip[data-filter="${currentLoc.id}"]`
      );
      if (chip) chip.click();
      // Jump to the gallery page.
      const gallery = document.getElementById('gallery');
      const lenis = window.WhatAToy && window.WhatAToy.lenis;
      closeStoreDetail();
      if (gallery) {
        const y = gallery.getBoundingClientRect().top + window.scrollY;
        if (lenis && typeof lenis.scrollTo === 'function') {
          lenis.scrollTo(y, { duration: 0.9 });
        } else {
          gallery.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  // Esc closes the panel when it is open.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hasAttribute('hidden')) {
      closeStoreDetail();
    }
  });

  // ---- Public API: open the panel for a given store id ----
  window.WhatAToy.openStoreDetail = openStoreDetail;
}

/* -------------------------------------------------------------------------
   Resolve a location object by id from the cache (or fetch as fallback).
   ------------------------------------------------------------------------- */
async function getLocationById(id) {
  let locations = window.WhatAToy.locations;
  if (!Array.isArray(locations)) {
    try {
      const res = await fetch(LOCATIONS_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      locations = await res.json();
      window.WhatAToy.locations = locations;
    } catch (err) {
      console.warn('[store-detail] could not load locations.json:', err);
      return null;
    }
  }
  return locations.find((l) => l.id === id) || null;
}

/* -------------------------------------------------------------------------
   openStoreDetail(id): populate + reveal the panel.
   ------------------------------------------------------------------------- */
async function openStoreDetail(id) {
  if (!panel) return;

  const loc = await getLocationById(id);
  if (!loc) {
    console.warn(`[store-detail] no location found for id "${id}"`);
    return;
  }

  // Remember the trigger so we can restore focus on close.
  lastFocused = document.activeElement;

  // Name + place already show on the card above — don't repeat them here;
  // just keep an accessible label for screen readers.
  panel.setAttribute('aria-label', `${loc.name}, ${loc.city}, ${loc.state} — details`);
  currentLoc = loc;

  // ---- Mini photo strip (each photo opens the lightbox) ----
  const items = (Array.isArray(loc.photos) ? loc.photos : []).map((p) => ({
    src: p,
    caption: `${loc.name} — ${loc.city}, ${loc.state}`,
  }));
  if (photosEl) {
    photosEl.innerHTML = '';
    items.forEach((item, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'store-detail__photo';
      btn.setAttribute('aria-label', `Open photo ${i + 1} of ${loc.name}`);
      const img = document.createElement('img');
      // Paths are RAW (spaces / parens / Turkish chars) — always encodeURI.
      img.src = encodeURI(item.src);
      img.alt = `${loc.name} — shop photo ${i + 1}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      // If the photo can't load (e.g. a removed file), hide this thumbnail and
      // mark it so the lightbox skips it — the user never sees a broken image.
      img.addEventListener('error', () => {
        item.broken = true;
        btn.remove();
      });
      btn.appendChild(img);
      btn.addEventListener('click', () => {
        if (window.WhatAToy && typeof window.WhatAToy.openLightbox === 'function') {
          // Only pass photos that actually loaded; re-aim the index accordingly.
          const good = items.filter((it) => !it.broken);
          const start = Math.max(0, good.indexOf(item));
          window.WhatAToy.openLightbox(good, start);
        }
      });
      photosEl.appendChild(btn);
    });
  }

  // ---- Hours note ----
  if (hoursEl) hoursEl.textContent = HOURS_NOTE;

  // ---- Get Directions link (Google Maps search) ----
  if (directionsEl) {
    const query = encodeURIComponent(loc.mapsQuery || loc.name);
    directionsEl.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  // ---- Place the panel directly under the chosen store card ----
  // (uses the side-column space and frees the center for a bigger globe).
  const card = document.querySelector(`.store-list__btn[data-id="${id}"]`);
  const li = card && card.closest('li');
  if (li) li.appendChild(panel);

  // ---- Reveal + focus management ----
  panel.removeAttribute('hidden');
  // Next frame so the transition (opacity/transform) actually plays.
  requestAnimationFrame(() => panel.classList.add('is-open'));

  // Move focus into the panel for keyboard/screen-reader users. preventScroll
  // so opening the panel never yanks the viewport (lets a smooth scroll that
  // navigated here — e.g. from a product card — finish cleanly).
  if (closeBtn) {
    closeBtn.focus({ preventScroll: true });
  } else {
    panel.setAttribute('tabindex', '-1');
    panel.focus({ preventScroll: true });
  }
}

/* -------------------------------------------------------------------------
   closeStoreDetail(): hide the panel + restore focus.
   ------------------------------------------------------------------------- */
function closeStoreDetail() {
  if (!panel || panel.hasAttribute('hidden')) return;

  panel.classList.remove('is-open');

  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const finish = () => {
    panel.setAttribute('hidden', '');
    // Return focus to whatever opened the panel (list button or pin).
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
    lastFocused = null;
  };

  if (prefersReduced) {
    finish();
  } else {
    // Hide after the closing transition completes (fallback timer too).
    let done = false;
    const onEnd = () => {
      if (done) return;
      done = true;
      panel.removeEventListener('transitionend', onEnd);
      finish();
    };
    panel.addEventListener('transitionend', onEnd);
    setTimeout(onEnd, 400);
  }
}
