# What-A-Toy! — Unified Redesign Plan

> One actionable spec synthesizing the competitor, copy, visual, UX/IA, and asset reports.
> Goal: a delightful + professional **showcase** (no e-commerce) that drives foot traffic to 5 physical stores.
> Canonical reference: the redesigned hero (copy column + tilted real-photo collage, warm-playful-but-premium). Everything harmonizes to it. **Do not re-add the 3D bear.**

---

## 1. Direction

What-A-Toy! is a family-owned, 5-store toy shop in the heartland (OK, KS, SD, TX). The site has exactly one job: get a parent to drive to a store. Every section funnels toward **Locations → pick a store → Get Directions**. The voice is a friendly shopkeeper — warm, second-person, quietly confident, never salesy and never "Shop/Buy/Cart."

The visual system is photo-forward: real, candid in-store photography carries the color and energy; the UI palette stays disciplined (cream/bg-yellow canvas, navy text, red/gold reserved for CTAs + accents). The per-section scroll-color journey (sun → red → navy) is the signature differentiator and is kept — but type, pills, photo frames, and motion are unified across all journey colors so it reads intentional, not patchwork.

**Three conflict resolutions baked in:**
1. **Cut `#intro` as a standalone 100vh section** (UX). It duplicated `#about`. Its one strong line folds into the products lead. The asset report's "experience band" idea survives as a *thin* full-bleed photo strip, not another full page of prose.
2. **Reorder to a funnel** (UX over competitor's "order is fine"): hero → products → **gallery (moved up)** → locations → about → contact. This puts proof right after the toys and gives Locations momentum.
3. **Repoint the persistent nav CTA to Locations** (UX over copy's "Visit Us → contact"): label **"Find a Store"**, `href="#locations"`. The single most prominent button must serve the foot-traffic goal, not an email box.

---

## 2. Design-system rules (apply site-wide)

### Source-of-truth / structure
- **One owner per concern.** `section.css` is the sole owner of `.section`, `.section__head/eyebrow/title/lead`, `.container`, `.container--narrow`. Delete the duplicate `.section*` blocks from `base.css` (L57–84) and the typography overrides from `bg-theme.css` (L129–155). `bg-theme.css` keeps **only** `#bg-layer`, `body{transparent}`, `data-bg` recolor maps, and the `min-height:100vh` page-fill behavior.
- `.section__title` font-size must be set **once** (in `section.css`). Same for `.section__head` margin and `.section` padding-block.
- De-dupe the `.reveal` block (it lives in both `base.css` and `animations.css L41–50`); keep it in `animations.css`.

### Section header (one canonical pattern)
- Eyebrow → title → lead, **centered by default**, left-aligned only via `.section__head--start`.
- Eyebrow: Fredoka, uppercase, letter-spacing `0.14em`, `--red` on light/sun, `--gold` on red/navy, with the gold underline accent.
- **Move the gold-underline accent from `.section__head .section__eyebrow::after` to `.section__eyebrow::after`** so hero + contact eyebrows get it too.
- Title: `--fs-2xl` clamp, sentence case, no trailing period, ≤6 words. Add a faint shared display `text-shadow` token so hero and section titles read as one type treatment.
- Lead: `--fs-md`, `--muted`, max `56ch`, ≤22 words.

### One pill primitive
- Introduce `.pill` base: `inline-flex; gap; --radius-pill; Fredoka 500; --fs-sm; border:1.5px solid var(--border); --shadow-sm`.
- Modifiers: `.pill--gold-edge` (hero eyebrow), `.pill--interactive` (hover lift + red border), `.pill--active` (red fill + `--shadow-red`).
- Refactor `.hero__chip`, `.gallery__chip`, `.product-card__tag`, `.hero__eyebrow` to compose it. **One border weight everywhere: 1.5px.**

### One imagery frame (highest visual-impact change)
- All real photos (gallery, store-detail, hero collage) share `.photo-frame`: `--radius-lg`, `border: 5px solid var(--surface-card)`, `--shadow-md` resting / `--shadow-lg` hover, `object-fit:cover`.
- Add the 5px cream "sticker" border to `.gallery__img` / `.gallery__item` so gallery photos harmonize with the hero collage instead of reading as a flat thumbnail strip.
- Landscape contexts use `4/3`; `3/4` portrait only where deliberate, and then consistently within that section.

### Motion scale (composed, not copied)
- Add lift tokens `--lift-sm:-2px` (chips, buttons, rows), `--lift-md:-4px` (gallery tiles), `--lift-lg:-6px` (cards). Reference the existing `.anim-hover-float`; remove per-component inline `translateY(-Npx)`.
- One "wow" per section max, everything ≤400ms, all `prefers-reduced-motion`-safe.

### Focus ring (deterministic, journey-driven)
- `--red` ring on light/sun; `--gold` ring on red/navy — driven by `[data-bg]`, e.g. `[data-bg="navy"] :focus-visible, [data-bg="red"] :focus-visible { outline-color: var(--gold) }`. Stop hand-setting gold on individual components; `.gallery__chip` inherits its ring from the section.

### Elevation
- Promote `.card` resting shadow `sm → md`, hover `md → lg`. Match `.gallery__item` (`sm→md` rest, `md→lg` hover). Replace navbar's one-off `0 4px 20px rgba(...)` with `--shadow-md` (scrolled: `--shadow-lg`).

### Token discipline
- Replace every literal `#FFFDF6` with `var(--surface-card)`.
- Add channel tokens `--navy-rgb:42,59,110; --cream-rgb:244,232,211; --gold-rgb:242,184,43`; semantic `--scrim: rgba(34,48,92,0.86)`, `--glass-cream: rgba(var(--cream-rgb),0.42)`. Use these for navbar/store-list/contact alpha layers.
- Promote decorative one-offs to tokens: `--toy-teal:#36C6B4; --toy-blue:#5AA9E6; --toy-purple:#B07CE0` (used by hero chip dots, confetti, contact balls).
- `.navbar__cta:hover` color `#fff` → `var(--on-red)`.
- Spacing: add `--space-9:7rem` so big section rhythm has a real step instead of re-clamping ad hoc.

### bg-journey (keep — it's the strongest part of the system)
- **Remove `background:var(--bg-yellow)` from `.locations`** (`globe.css L11`) — it fights the navy journey layer.
- Document the section→color map once as a comment table in `bg-theme.css`; HTML `data-bg` is the implementation.
- Section colors after reorder: hero `sun` → products `red` → gallery `sun` → locations `navy` → about `red` → contact `navy`.

### Voice / copy rules
- Titles: sentence case, no trailing period, ≤6 words. Leads: ≤22 words, 1–2 short sentences. Blurbs ≤12 words. Buttons 2–3 words.
- **Standardize "store"** over "shop" (except inside warm narrative prose). **"wonder"** appears only in the hero tagline + footer tagline (a deliberate bookend). Exclamation points live only in the brand name "What-A-Toy!" and the "Come play!" badge.
- Never "Shop / Buy / Add to cart." Recurring primary action = **Find a Store** → Locations → Get Directions.

---

## 3. Per-section plan (final recommended order)

### 0. Navbar — KEEP, repoint CTA
- Links unchanged: Toys / Stores / Gallery / Our Story.
- **CTA: "Visit Us" → "Find a Store", `href="#contact"` → `href="#locations"`.** This is the single most important funnel fix.
- Sticky bar adopts the section's journey color. Add a mobile sticky "Find a Store / Call" affordance.
- Replace navbar one-off shadow with `--shadow-md`.

### 1. Hero — KEEP (canonical reference)
- Copy column + tilted real-photo collage stay. Trim the bloated tagline (29 → 21 words). Apply the gold-underline eyebrow accent (now global). Add 4th collage photo (`Woodland (1)`) for geographic variety/credibility.
- Scroll hint `href="#intro"` → `href="#products"` (intro is cut).
- Assets: `PremiumOutlet (1)`, `peluslar/TowneEast (10)`, `akulu motor` (in use) + add `Woodland (1)`.

### 2. (cut) Intro → thin photo band
- **CUT** the standalone `#intro` section. Fold its strongest sentence ("A toy is never just a toy…") into the products lead or a short kicker.
- Optionally replace with a **thin full-bleed photo strip** (not 100vh) using `peluslar/peluslar.jpeg` (vivid plush wall) under a navy scrim — pure atmosphere, no prose. Cuts one redundant prose page and removes the intro/about duplication.

### 3. Products — KEEP, tighten
- 3 equal-weight category cards. Title "Toys for every kind of fun" → "Something for every kid." Reframe card CTA toward Locations ("See it in store"), never a product list.
- Tighten lead; tweak keychain blurb to echo hero's "pocket-sized treasures." Compose `.product-card__tag` from `.pill` (1px → 1.5px).
- Ensure `role="button"` cards are `tabindex="0"` and Enter/Space-activatable.
- Assets (covers in use): Plush `peluslar/peluslar.jpeg` (14 photos, strong); Ride-On `akulu motor.jpeg` (7); Keychains `anahtarlıklar/TowneEast (8).jpeg` (**only 1 photo — keep single-image, do not build a carousel**).

### 4. Gallery — MOVE UP (now the "step inside" proof), reframe photos
- Moved to right after products so proof has context. Title "A peek around our shops" → "Take a look inside."
- Apply the `.photo-frame` 5px cream sticker border + `md→lg` elevation so it matches the hero collage (highest visual-impact change). Filter chips compose `.pill`/`.pill--active`. Trim chip labels.
- Lazy-load images; tap any photo for lightbox.
- Assets: all 80 photos already consumed here — no orphans. Bias the *first* visible frames toward candid in-store moments.

### 5. Locations — the conversion climax (rich store cards)
- Title "Find Your Nearest Wonder" → "Find your nearest store." Globe is the delight layer; the **5 store cards do the work** and must fully answer "where + when can I go?" without clicking the globe.
- Each card: mall name, city + state, **hours (visible, not behind a click)**, tap-to-call phone, **Get Directions** (maps deep-link), storefront cover photo. Promote the strongest frame of each store as card cover.
- A11y: store cards must be real focusable buttons/links (the WebGL globe is not keyboard-operable — cards are the keyboard path). Change `.locations__stage` from `<nav>` to `role="region"` aria-labelled. Remove `.locations` `bg-yellow` so navy journey shows.
- Add a light proof beat near here: a one-line testimonial ("My kids beg to go every weekend — Sarah, Wichita") or "Family-owned since ____."
- Assets/covers: woodland `Woodland (1)`, tulsa-premium `PremiumOutlet (1)`, empire `Empire (1)` (**only 5 total — no "more" affordance**), towne-east `TowneEast (2)` (+ surface unused-on-card `TowneEast (9)`/`(30)`), grapevine `Grapevine (1)` (+ pull 2–3 of card-unused `Grapevine (7–17)`).

### 6. About / Our Story — the single story beat (emotional close)
- Now the ONLY brand-prose beat (intro merged in). Keep the charming CSS wind-up cat + train. Title → "Family-run since day one." Surface real founding specifics + the states served (OK, KS, SD, TX) for trust.
- Trim both leads to ≤22 words. Optional warm interior backdrop: `Woodland (11)` (gallery-only, free to feature) under a soft treatment.

### 7. Contact — store directory first, email secondary
- Lead with directory/hours/map intent; email is the "or just say hi." Title eyebrow "Come say hello" + title "Let's play." Keep the bouncing-balls delight.
- **Email button label "Email hello@whatatoy.example" → "Email Us"** (real address in `href` once known — the placeholder must be replaced before launch). Secondary "Visit a Store" → `#locations`.
- Assets accent (low-stakes): the lone `anahtarlıklar/TowneEast (8)` thumbnail or a tidy `Grapevine (9)`.

### 8. Footer
- Tagline "Wonder in Every Corner." → "Wonder in every corner" (drop period). "shop" → "store" in copyright.
- **Make the "Our Stores" list real links** (to each store's `#locations` detail or a maps URL) — currently dead plain text, a wasted directions funnel.

### Cross-cutting: snap-scroll (page-nav.js)
- Keep, but: shorten lock `ANIM_MS 900ms → ~600ms`, allow a fresh gesture to interrupt/queue, **remove the Space-key hijack** (keep Arrow/PageUp/PageDown), add a fixed **page-dot rail** (one labeled dot per section, reusing nav.js's IntersectionObserver active state), and **disable one-page-per-gesture capture under `prefers-reduced-motion`** (let them scroll naturally instead of teleporting). Keep the tall-section (gallery) natural-scroll branch. Mobile snap stays disabled.

### Cross-cutting: a11y
- Skip link → labeled `<main id="main" tabindex="-1">` (not `#hero`).
- Verify cream-on-red leads and the `0.78` hint color hit ≥4.5:1; darken/weight if borderline.
- Product `role="button"` cards focusable + key-activatable; store cards focusable.

---

## 4. Full copy rewrite table

### Meta / document
| Selector | Current | Proposed |
|---|---|---|
| `<title>` | What-A-Toy! — More Than a Store | What-A-Toy! — More Than a Toy Store |
| `meta[description]` | …family-owned toy shop with five mall stores across the heartland. Come play, discover, and find wonder in every corner. | A family-owned toy store with five mall locations across the heartland. Come play, browse, and find wonder in every corner. |

### Nav (`#nav-menu`)
| Selector | Current | Proposed |
|---|---|---|
| `a[href="#products"]` | Toys | Toys |
| `a[href="#locations"]` | Stores | Stores |
| `a[href="#gallery"]` | Gallery | Gallery |
| `a[href="#about"]` | Our Story | Our Story |
| `.navbar__cta` (label + href) | Visit Us → `#contact` | **Find a Store → `#locations`** |

### Hero (`#hero`)
| Selector | Current | Proposed |
|---|---|---|
| `.hero__eyebrow` | Welcome to What-A-Toy! | Welcome to What-A-Toy! |
| `.hero__title` | A Wonderland of Toys | A Wonderland of Toys |
| `.hero__tagline` | Five family-run toy shops bursting with plush pals, ride-on racers, collectibles, games, and pocket-sized treasures. Come play — wonder waits in every corner. | Five family-run toy stores across the heartland, packed with plush, ride-ons, and pocket-sized treasures. Wonder waits in every aisle. |
| `.btn--primary` | See Our Toys | See the Toys |
| `.btn--ghost` | Find a Store | Find a Store |
| `.hero__chip` 1–5 | Plush Friends / Ride-On Cars / Collectibles / Games & Puzzles / Pocket Treasures | (unchanged) |
| `.hero__badge-text` | Come play! | Come play! |
| `.hero__scroll-hint span` | Scroll to explore | Scroll to explore |

### Products (`#products`)
| Selector | Current | Proposed |
|---|---|---|
| `.section__eyebrow` | What you'll discover | On our shelves |
| `.section__title` | Toys for every kind of fun | Something for every kid |
| `.section__lead` | A handpicked taste of what fills our shelves. Come in and see the rest in person — there is always more than the camera can capture. | A small taste of what's in store. There's always more waiting in person. |

#### Product cards (`content/products.json`)
| Field | Current | Proposed |
|---|---|---|
| `plush.title` | Plush Friends | Plush Friends |
| `plush.blurb` | Soft, huggable companions for every age. | Soft, huggable companions for every age. |
| `rideon.title` | Ride-On Cars & Motors | Ride-On Cars & Motors |
| `rideon.blurb` | Battery-powered adventures for little drivers. | Battery-powered adventures for little drivers. |
| `keychain.title` | Keychains & Collectibles | Keychains & Collectibles |
| `keychain.blurb` | Tiny treasures and pocket-sized fun. | Pocket-sized treasures and tiny finds. |

### Gallery (`#gallery`)
| Selector | Current | Proposed |
|---|---|---|
| `.section__eyebrow` | Step inside | Step inside |
| `.section__title` | A peek around our shops | Take a look inside |
| `.section__lead` | Real photos from our stores across Oklahoma, South Dakota, Kansas, and Texas. Filter by location and tap any photo for a closer look. | Real photos from our stores across four states. Filter by location, or tap any photo to zoom in. |

#### Gallery filter labels (`content/gallery.json`) — optional trims
| id | Current | Proposed |
|---|---|---|
| woodland | Woodland Hills, Tulsa | Woodland Hills, Tulsa |
| tulsa-premium | Tulsa Premium Outlets, Jenks | Premium Outlets, Jenks |
| empire | The Empire Mall, Sioux Falls | Empire Mall, Sioux Falls |
| towne-east | Towne East Square, Wichita | Towne East, Wichita |
| grapevine | Grapevine Mills, Grapevine | Grapevine Mills, TX |

### Locations (`#locations`)
| Selector | Current | Proposed |
|---|---|---|
| `.section__eyebrow` | Five stores, one big welcome | Five stores, one welcome |
| `.section__title` | Find Your Nearest Wonder | Find your nearest store |
| `#store-detail .store-detail__title` | Details | Store Details |
| `#store-detail-directions` | Get Directions | Get Directions |
| `#store-detail-more` | More photos | More Photos |
| globe `aria-label` | Interactive globe showing What-A-Toy! store locations | Interactive globe of What-A-Toy! store locations |

Store names in `content/locations.json` — **keep verbatim** (real places, SEO/maps).

### About (`#about`)
| Selector | Current | Proposed |
|---|---|---|
| `.section__eyebrow` | Our story | Our story |
| `.section__title` | Built by a family who never stopped playing. | Family-run since day one |
| `.about__lead` (1) | What-A-Toy! began with a simple belief: that a great toy store should feel like a celebration. From a single counter to five welcoming shops inside some of the region's favorite malls, we've grown one happy customer at a time. | We started with one belief: a toy store should feel like a celebration. One counter grew into five stores, a customer at a time. |
| `.about__lead` (2) | We choose our toys the way we'd choose them for our own kids — for the smiles they spark, the stories they start, and the years of play they promise. When you visit, you're not just a shopper. You're part of the family. And there's always something new waiting to be discovered. | We pick every toy the way we would for our own kids. Visit us and you're not a shopper — you're family. |

### Contact (`#contact`)
| Selector | Current | Proposed |
|---|---|---|
| `.section__eyebrow` | Come say hello | Come say hello |
| `.section__title` | Let's play together | Let's play |
| `.contact__lead` | Questions about a toy, a birthday gift, or what's new on our shelves? Drop us a line — a real person will write back. | Questions about a toy, a gift, or what's new? Drop us a line — a real person writes back. |
| `.contact__actions .btn--primary` | Email hello@whatatoy.example | Email Us |
| `.contact__actions .btn--ghost` | Visit one of our 5 stores | Visit a Store |

### Footer (`#footer`)
| Selector | Current | Proposed |
|---|---|---|
| `.footer__tagline` | Wonder in Every Corner. | Wonder in every corner |
| col 1 heading + links | Explore / Toys / Stores / Gallery / Our Story / Contact | (unchanged; make store list below into links) |
| col 2 heading | Our Stores | Our Stores |
| store list | plain text (5 stores) | keep names verbatim, **make each a link** |
| `.footer__bottom` | © 2026 What-A-Toy! — A family-owned toy shop. Hours vary by mall. | © 2026 What-A-Toy! — A family-owned toy store. Hours vary by mall. |

---

## 5. Asset placement map

All `src` must `%20`-encode spaces. Turkish folders: `akulu araba motor` (battery car), `peluslar` (plush), `anahtarlıklar` (keychains — non-ASCII dotless ı; verify it serves, consider renaming `anahtarliklar`).

| Slot | Asset(s) | Notes |
|---|---|---|
| Hero collage | `Premium Outlet Mall TULSA/PremiumOutlet (1)`, `…/peluslar/TowneEast (10)`, `…/akulu araba motor/akulu motor` (in use) + **add `Woodland Hills Mall TULSA/Woodland (1)`** | Geographic variety / "real store" credibility |
| Thin photo band (replaces intro) | `…/peluslar/peluslar.jpeg` (vivid plush wall) | Navy scrim, white copy or no copy |
| Products — Plush | `…/peluslar/peluslar.jpeg` | 14 photos, strong |
| Products — Ride-On | `…/akulu araba motor/akulu motor.jpeg` | 7 photos |
| Products — Keychains | `…/anahtarlıklar/TowneEast (8).jpeg` | **Only 1 photo — single-image, no carousel** |
| Gallery | all 80 (already wired) | Apply `.photo-frame`; bias first frames to candid moments |
| Locations covers | woodland `Woodland (1)`; tulsa-premium `PremiumOutlet (1)`; empire `Empire (1)`; towne-east `TowneEast (2)` (+ `(9)`,`(30)`); grapevine `Grapevine (1)` (+ pull `Grapevine (7–17)`) | **Empire = 5 photos max, no "more" affordance** |
| About backdrop (optional) | `Woodland Hills Mall TULSA/Woodland (11).jpeg` | Gallery-only frame, free to feature |
| Contact accent (optional) | `…/anahtarlıklar/TowneEast (8).jpeg` or `Grapevine (9)` | Low-stakes spot |

---

## 6. Prioritized implementation checklist

**P0 — Funnel + structural (do first)**
1. Repoint nav CTA → "Find a Store" / `#locations`.
2. Reorder sections: hero → products → gallery → locations → about → contact. Update `data-bg` (sun→red→sun→navy→red→navy) and hero scroll-hint to `#products`.
3. Cut standalone `#intro`; fold its line into products lead (optionally add thin photo band).
4. Locations: surface hours + tap-to-call + Get Directions on every card without needing the globe; promote cover photos; remove `.locations` `bg-yellow`; `role="region"`.
5. Contact: lead with store/directions intent; email → secondary "Email Us"; replace placeholder address before launch.
6. Make footer "Our Stores" list real links.

**P1 — CSS single-owner + pattern unification**
7. Make `section.css` sole owner of `.section*`/`.container`; delete duplicates in `base.css` + `bg-theme.css`; de-dupe `.reveal`.
8. Introduce `.pill` primitive; refactor hero/gallery/product/eyebrow pills to it (1.5px).
9. Introduce `.photo-frame`; add 5px cream sticker border to gallery (highest visual win); unify aspect ratios.
10. Apply all copy rewrites from §4 (HTML + 3 JSON files).

**P2 — Tokens + motion + a11y polish**
11. Add channel/decorative/lift/`--space-9` tokens; replace `#FFFDF6` and raw rgba leaks; navbar shadow → `--shadow-md`.
12. Move gold-underline accent to all eyebrows; add shared display title text-shadow; bump card/gallery elevation.
13. Deterministic journey-driven focus rings via `[data-bg]`.
14. Skip link → `<main id="main">`; verify product/store cards focusable + key-activatable; contrast check cream-on-red.

**P3 — Snap-scroll + delight**
15. Shorten snap lock to ~600ms, allow gesture interrupt, remove Space hijack, add page-dot rail, disable capture under reduced-motion.
16. Add a one-line local testimonial proof beat near Locations.
17. Flag/rename Turkish asset folders for maintainability (esp. non-ASCII `anahtarlıklar`).

---

_The bones are strong (thoughtful tokens, genuinely good bg-journey, reduced-motion handled). The site reads patchwork mainly because three files own `.section` and four reinvent the pill — consolidating those two plus the photo-frame treatment, while repointing the funnel at Locations, moves it from "cheerful but slightly patchwork" to "coherent, premium, and conversion-focused."_
