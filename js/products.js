/* =========================================================================
   products.js — What-A-Toy!
   Fetches content/products.json and renders 3 product cards into
   #products-grid. Cards show a photo, title, blurb, and a soft
   "Find it in-store" tag (informational — this is NOT e-commerce).
   ES module: exports initProducts(); does not auto-run on import.
   ========================================================================= */

const PRODUCTS_URL = 'content/products.json';

/**
 * Build a single product card element.
 * @param {{id:string,title:string,blurb:string,photo:string}} product
 * @returns {HTMLElement} an <article> card with .reveal for scroll reveal
 */
function buildCard(product) {
  const card = document.createElement('article');
  card.className = 'card product-card reveal';
  card.dataset.productId = product.id;

  // Clickable: open this category's photos in the lightbox.
  const photos = Array.isArray(product.photos) && product.photos.length
    ? product.photos
    : [product.photo];
  const items = photos.map((p) => ({ src: p, caption: product.title }));
  const open = () => {
    if (window.WhatAToy && typeof window.WhatAToy.openLightbox === 'function') {
      window.WhatAToy.openLightbox(items, 0);
    }
  };
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `View ${product.title} photos (${items.length})`);
  card.addEventListener('click', open);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      open();
    }
  });

  // ---- Media: photo path is a RAW relative path; encodeURI() before use ----
  const media = document.createElement('div');
  media.className = 'card__media';

  const img = document.createElement('img');
  img.src = encodeURI(product.photo);
  img.alt = product.title;          // alt text derived from the title
  img.loading = 'lazy';
  img.decoding = 'async';
  media.appendChild(img);

  // ---- Body: title, blurb, in-store tag ----
  const body = document.createElement('div');
  body.className = 'card__body';

  const title = document.createElement('h3');
  title.className = 'card__title';
  title.textContent = product.title;

  const blurb = document.createElement('p');
  blurb.className = 'card__text';
  blurb.textContent = product.blurb;

  // Soft tag — drives foot traffic, not a purchase
  const tag = document.createElement('span');
  tag.className = 'product-card__tag';
  tag.textContent = 'Find it in-store';

  body.append(title, blurb, tag);
  card.append(media, body);
  return card;
}

/**
 * Fetch products and render them into #products-grid.
 * @returns {Promise<void>}
 */
export async function initProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  let products;
  try {
    const res = await fetch(PRODUCTS_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    products = await res.json();
  } catch (err) {
    console.warn('[products] could not load products.json:', err);
    return;
  }

  if (!Array.isArray(products) || products.length === 0) return;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Cards live in a horizontal track that auto-slides (marquee). For a seamless
  // loop we render the set TWICE and translate the track by -50%; the duplicate
  // set is hidden from assistive tech. Under reduced-motion we render one set
  // and let it scroll manually instead of animating.
  const track = document.createElement('div');
  track.className = 'products__track';

  const addSet = (isClone) => {
    for (const product of products) {
      const card = buildCard(product);
      if (isClone) {
        card.setAttribute('aria-hidden', 'true');
        card.tabIndex = -1;
        card.classList.add('is-clone');
      }
      track.appendChild(card);
    }
  };

  addSet(false);
  if (!prefersReduced) {
    track.classList.add('products__track--marquee');
    // Slower with more cards so the pace stays gentle (~5s per card).
    track.style.setProperty('--marquee-duration', products.length * 5 + 's');
    addSet(true);
  }

  grid.innerHTML = '';
  grid.appendChild(track);
}
