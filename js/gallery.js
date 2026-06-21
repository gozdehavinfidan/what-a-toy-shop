/* =========================================================================
   What-A-Toy! — Gallery
   Fetches content/gallery.json, renders filter chips + a responsive photo
   grid, and opens the lightbox (window.WhatAToy.openLightbox) on click.
   ES module: exports initGallery(); does NOT auto-run on import.
   ========================================================================= */

const GALLERY_URL = 'content/gallery.json?v=5';

// How many preview photos to show in the gallery section (one big row of 3).
const PREVIEW_COUNT = 3;

/**
 * Build a lightbox-friendly item from a raw photo path + group label.
 * Paths are RAW (may contain spaces / parentheses / Turkish chars), so the
 * consumer (here and the lightbox) must encodeURI() before assigning to src.
 */
function toItem(rawPath, label) {
  return { src: rawPath, caption: label };
}

export function initGallery() {
  const filtersEl = document.getElementById('gallery-filters');
  const gridEl = document.getElementById('gallery-grid');
  if (!filtersEl || !gridEl) return;

  let groups = [];
  // The flat list of items currently shown in the grid (drives lightbox index).
  let currentItems = [];
  let activeId = 'all';
  let moreWrap = null;       // wrapper holding the "View all photos" button

  fetch(GALLERY_URL)
    .then((res) => {
      if (!res.ok) throw new Error('gallery.json ' + res.status);
      return res.json();
    })
    .then((data) => {
      groups = Array.isArray(data?.groups) ? data.groups : [];
      if (!groups.length) {
        gridEl.innerHTML = '<p class="gallery__empty">No photos to show yet.</p>';
        return;
      }
      renderChips();
      renderGrid('all');
    })
    .catch((err) => {
      console.warn('[gallery] failed to load:', err);
      gridEl.innerHTML = '<p class="gallery__empty">Photos are taking a little break. Please check back soon.</p>';
    });

  /* ---- Filter chips: "All" + one per group ---- */
  function renderChips() {
    filtersEl.innerHTML = '';
    const defs = [{ id: 'all', label: 'All' }].concat(
      groups.map((g) => ({ id: g.id, label: g.label }))
    );

    defs.forEach((def) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'gallery__chip';
      chip.textContent = def.label;
      chip.dataset.filter = def.id;
      chip.setAttribute('aria-pressed', def.id === activeId ? 'true' : 'false');
      chip.addEventListener('click', () => {
        if (activeId === def.id) return;
        activeId = def.id;
        // Update pressed state across all chips.
        filtersEl.querySelectorAll('.gallery__chip').forEach((c) => {
          c.setAttribute('aria-pressed', c.dataset.filter === activeId ? 'true' : 'false');
        });
        renderGrid(activeId);
      });
      filtersEl.appendChild(chip);
    });
  }

  /* ---- Grid: render photos for the active filter ---- */
  function renderGrid(filterId) {
    const shown = filterId === 'all'
      ? groups
      : groups.filter((g) => g.id === filterId);

    // Flatten into the ordered item list that backs the lightbox.
    currentItems = [];
    shown.forEach((g) => {
      (g.photos || []).forEach((p) => currentItems.push(toItem(p, g.label)));
    });

    gridEl.innerHTML = '';
    if (!currentItems.length) {
      gridEl.innerHTML = '<p class="gallery__empty">No photos in this shop yet.</p>';
      return;
    }

    // Show only a small preview; "View all photos" opens the rest in the lightbox.
    const visible = currentItems.slice(0, PREVIEW_COUNT);

    const frag = document.createDocumentFragment();
    visible.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gallery__item';
      btn.setAttribute('aria-label', 'View photo: ' + item.caption);

      const img = document.createElement('img');
      img.className = 'gallery__img';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = item.caption;
      // RAW path -> encodeURI for spaces / parentheses / Turkish folder name.
      img.src = encodeURI(item.src);
      // Hide the thumbnail entirely if its photo can't load (no broken icon).
      img.addEventListener('error', () => btn.remove());

      btn.appendChild(img);
      btn.addEventListener('click', () => {
        // Lightbox always navigates the FULL list, not just the preview.
        if (window.WhatAToy && typeof window.WhatAToy.openLightbox === 'function') {
          window.WhatAToy.openLightbox(currentItems, index);
        }
      });
      frag.appendChild(btn);
    });
    gridEl.appendChild(frag);

    renderMoreButton();
  }

  /* ---- "View all photos" button -> opens the full set in the lightbox ---- */
  function renderMoreButton() {
    if (!moreWrap) {
      moreWrap = document.createElement('div');
      moreWrap.className = 'gallery__more';
      gridEl.insertAdjacentElement('afterend', moreWrap);
    }
    moreWrap.innerHTML = '';

    if (currentItems.length <= PREVIEW_COUNT) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--primary gallery__more-btn';
    btn.textContent = 'See all photos';
    btn.addEventListener('click', () => {
      if (window.WhatAToy && typeof window.WhatAToy.openLightbox === 'function') {
        window.WhatAToy.openLightbox(currentItems, 0);
      }
    });
    moreWrap.appendChild(btn);
  }
}
