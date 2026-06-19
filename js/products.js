/* =========================================================================
   products.js — What-A-Toy!
   Fetches content/products.json and renders 3 product cards into
   #products-grid. Cards show a photo, title, blurb, and a soft
   "Find it in-store" tag (informational — this is NOT e-commerce).
   ES module: exports initProducts(); does not auto-run on import.
   ========================================================================= */

const PRODUCTS_URL = 'content/products.json';

// Short mall names for the tag + a11y label, keyed by the shop id used in
// content/locations.json (so a product can point at one shop).
const SHOP_NAMES = {
  'woodland': 'Woodland Hills',
  'tulsa-premium': 'Tulsa Premium Outlets',
  'empire': 'The Empire Mall',
  'towne-east': 'Towne East',
  'grapevine': 'Grapevine Mills',
  'battlefield': 'Battlefield Mall',
};

/**
 * Build a single product card element.
 * @param {{id:string,title:string,blurb:string,photo:string}} product
 * @returns {HTMLElement} an <article> card with .reveal for scroll reveal
 */
function buildCard(product) {
  const card = document.createElement('article');
  card.className = 'card product-card reveal';
  card.dataset.productId = product.id;

  // Clicking the card takes the visitor to the Shop section and opens that
  // shop's detail panel (name + map location + Get Directions) — so the card
  // leads somewhere useful instead of just showing photos.
  const shopName = SHOP_NAMES[product.shop];
  const goToShop = () => {
    const wt = window.WhatAToy || {};
    // Scroll to the Shop section via the canonical in-page nav path (the Shop
    // nav link → transitions.js wipe + lenis scroll) so it behaves exactly like
    // every other nav jump. Fallbacks cover the no-link / no-lenis cases.
    const navLink = document.querySelector('a[data-nav][href="#locations"]');
    if (navLink) {
      navLink.click();
    } else if (wt.lenis) {
      wt.lenis.scrollTo('#locations', { offset: -80 });
    } else {
      const target = document.getElementById('locations');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
    // After the wipe + scroll settle, open + highlight the shop (flies the globe,
    // opens its detail with Get Directions). preventScroll in store-detail keeps
    // this from yanking the viewport.
    if (!product.shop) return;
    window.setTimeout(() => {
      const btn = document.querySelector(`.store-list__btn[data-id="${product.shop}"]`);
      if (btn) btn.click();
      else if (typeof wt.openStoreDetail === 'function') wt.openStoreDetail(product.shop);
    }, 1400);
  };
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label',
    `Find ${product.title} at ${shopName || 'our shops'} — see the shop location and directions`);
  card.addEventListener('click', goToShop);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToShop();
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

  // Soft tag — names the shop this toy is found in (drives foot traffic).
  const tag = document.createElement('span');
  tag.className = 'product-card__tag';
  tag.textContent = shopName ? `Find it at ${shopName}` : 'Find it in our shops';

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
