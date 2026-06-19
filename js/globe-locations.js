/* =========================================================================
   globe-locations.js  (ES module)
   export initGlobe()
   - Fetch content/locations.json, cache to window.WhatAToy.locations
   - Build a globe.gl globe in #globe-canvas:
       red point markers, slow autoRotate, gold atmosphere,
       blue-marble texture, transparent background, North-America POV
   - onPointClick => fly to point, then window.WhatAToy.openStoreDetail(id)
   - Render an accessible <button> per store into ul#store-list
   - Responsive: globe sizes to its container; resize handler
   globe.gl is a UMD global: window.Globe
   ========================================================================= */

// Shared namespace for cross-module calls.
window.WhatAToy = window.WhatAToy || {};

const LOCATIONS_URL = 'content/locations.json?v=4';

// North-America point of view for initial load.
const HOME_POV = { lat: 39, lng: -98, altitude: 1.8 };

export async function initGlobe() {
  const mount = document.getElementById('globe-canvas');
  const listLeft = document.getElementById('store-list-left');
  const listRight = document.getElementById('store-list-right');

  // If there is nothing to render into, bail quietly.
  if (!mount && !listLeft && !listRight) return;

  // ---- 1. Load + cache the locations data ----
  let locations = window.WhatAToy.locations;
  if (!Array.isArray(locations)) {
    try {
      const res = await fetch(LOCATIONS_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      locations = await res.json();
      window.WhatAToy.locations = locations;
    } catch (err) {
      console.warn('[globe-locations] could not load locations.json:', err);
      locations = [];
    }
  }

  // ---- 2. Accessible store list (always available, even if WebGL fails) ----
  renderStoreList(listLeft, listRight, locations);

  // ---- 3. The globe itself ----
  if (!mount) return;

  // Respect reduced-motion: keep the globe static (no autoRotate / no fly).
  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (typeof window.Globe !== 'function') {
    console.warn('[globe-locations] globe.gl (window.Globe) not available.');
    return;
  }

  // Size from the container (square-ish; CSS controls the box).
  const getSize = () => ({
    width: mount.clientWidth || 480,
    height: mount.clientHeight || mount.clientWidth || 480,
  });
  const { width, height } = getSize();

  let globe;
  try {
    globe = window.Globe()(mount)
      .width(width)
      .height(height)
      // Transparent so the cream stage behind it shows through.
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl(
        '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
      )
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      // Gold-ish atmosphere glow.
      .showAtmosphere(true)
      .atmosphereColor('#F2B82B')
      .atmosphereAltitude(0.18)
      // Flat center dot on the surface (no cylinder height).
      .pointsData(locations)
      .pointLat((d) => d.lat)
      .pointLng((d) => d.lng)
      .pointColor(() => '#D8392B')
      .pointAltitude(0)
      .pointRadius(0.5)
      .pointLabel((d) => `${d.name} — ${d.city}, ${d.state}`)
      .pointsTransitionDuration(0)
      // Pulsing "ping" rings around each store: expand out + fade (flat on
      // the surface). Disabled under reduced-motion.
      .ringsData(prefersReduced ? [] : locations)
      .ringLat((d) => d.lat)
      .ringLng((d) => d.lng)
      .ringColor(() => (t) => `rgba(216, 57, 43, ${1 - t})`)
      .ringMaxRadius(2.4)
      .ringPropagationSpeed(1.6)
      .ringRepeatPeriod(1400)
      .onPointClick((p) => handleStoreSelect(p, globe, prefersReduced));
  } catch (err) {
    console.warn('[globe-locations] failed to create globe:', err);
    return;
  }

  // Initial camera over North America.
  globe.pointOfView(HOME_POV, 0);

  // Slow auto-rotate (unless reduced-motion).
  const controls = globe.controls();
  if (controls) {
    controls.autoRotate = !prefersReduced;
    controls.autoRotateSpeed = 0.45;
    controls.enableZoom = true;
    controls.minDistance = 180;
  }

  // ---- 4. Resize-aware ----
  const resize = () => {
    const s = getSize();
    globe.width(s.width).height(s.height);
  };

  // ResizeObserver tracks container size; window resize as a fallback.
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
  }
  window.addEventListener('resize', resize, { passive: true });

  // Pause auto-rotate while the tab is hidden (save cycles).
  document.addEventListener('visibilitychange', () => {
    if (!controls) return;
    controls.autoRotate = !document.hidden && !prefersReduced;
  });

  // Expose for store-list buttons to fly the globe too.
  window.WhatAToy._globe = globe;
  window.WhatAToy._globeReducedMotion = prefersReduced;
}

/* -------------------------------------------------------------------------
   Render the accessible store list: one <button> per store.
   ------------------------------------------------------------------------- */
function renderStoreList(leftEl, rightEl, locations) {
  if (leftEl) leftEl.innerHTML = '';
  if (rightEl) rightEl.innerHTML = '';
  // Split the stores: first half on the left of the globe, rest on the right.
  const half = Math.ceil(locations.length / 2);

  locations.forEach((loc, i) => {
    const target = i < half ? leftEl : rightEl;
    if (!target) return;

    const li = document.createElement('li');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'store-list__btn';
    btn.dataset.id = loc.id;
    btn.setAttribute(
      'aria-label',
      `View details for ${loc.name}, ${loc.city}, ${loc.state}`
    );

    const name = document.createElement('span');
    name.className = 'store-list__name';
    name.textContent = loc.name;

    const place = document.createElement('span');
    place.className = 'store-list__place';
    place.textContent = `${loc.city}, ${loc.state}`;

    const text = document.createElement('div');
    text.className = 'store-list__text';
    text.append(name, place);

    // Storefront cover thumbnail (first photo). Paths hold spaces/parens →
    // encodeURI before assigning to src (same convention as gallery.js).
    const cover = Array.isArray(loc.photos) && loc.photos.length ? loc.photos[0] : null;
    if (cover) {
      const img = document.createElement('img');
      img.className = 'store-list__cover';
      img.src = encodeURI(cover);
      img.alt = `${loc.name} storefront`;
      img.loading = 'lazy';
      img.decoding = 'async';
      // If a photo is ever missing, drop the thumbnail rather than show a
      // broken-image icon (keep the store's name/place text).
      img.addEventListener('error', () => img.remove());
      btn.append(img, text);
    } else {
      btn.append(text);
    }

    btn.addEventListener('click', () => {
      const globe = window.WhatAToy._globe;
      const reduced = window.WhatAToy._globeReducedMotion;
      // Fly the globe to the store (if ready) and open the panel.
      handleStoreSelect(loc, globe, reduced);
    });

    li.appendChild(btn);
    target.appendChild(li);
  });
}

/* -------------------------------------------------------------------------
   Shared selection handler: fly the camera, then open the detail panel.
   ------------------------------------------------------------------------- */
function handleStoreSelect(loc, globe, prefersReduced) {
  if (!loc) return;

  if (globe && typeof globe.pointOfView === 'function') {
    const flyMs = prefersReduced ? 0 : 900;
    globe.pointOfView({ lat: loc.lat, lng: loc.lng, altitude: 1.5 }, flyMs);
  }

  // Mark the matching list button active (covers globe-pin clicks), across
  // both the left and right lists.
  document
    .querySelectorAll('.store-list__btn.is-active')
    .forEach((b) => b.classList.remove('is-active'));
  const match = document.querySelector(
    `.store-list__btn[data-id="${loc.id}"]`
  );
  if (match) match.classList.add('is-active');

  if (
    window.WhatAToy &&
    typeof window.WhatAToy.openStoreDetail === 'function'
  ) {
    window.WhatAToy.openStoreDetail(loc.id);
  }
}
