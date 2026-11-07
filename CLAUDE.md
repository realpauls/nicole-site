# Nicole Foley's site

One-page bio site for Nicole Foley, Senior Account Executive at Lime Media (experiential marketing), Greater Philadelphia. Plain HTML/CSS/JS, no build step. Built from a copy of an earlier site of Paul's (the "template site": its location is in `PLAN.md`, kept local), with its own colors, content and hero (Paul, 2026-11-06). Planning notes and Nicole's questions are local only (`PLAN.md`, `NICOLE-QUESTIONS.md`).

## Who it's for

Nicole is **not** job hunting: she just started at Lime Media (Paul, 2026-11-06). The site is her professional presence. Lime Media can be named; she can link the site from LinkedIn once she approves it. Nothing may *suggest* she's looking ("open to work", "next role"): `FORBIDDEN` in facts. Her phone number, personal email and résumé file never go on the site.

## Working rules (same as the template site)

- **Ask Paul before every push.** `main` deploys straight to the review copy (and later to production).
- **Every change adds or updates tests.** Update `tests/lib/facts.mjs` when a fact, URL or setting changes. Run both suites before asking to push: `node --test tests/static/*.test.mjs` and `cd tests && npx playwright test`. Prove a new test by breaking the feature.
- Preview at desktop and phone widths (375 and 412 px) before asking to push.
- One change per commit, with a real message. US spelling. Curly apostrophes in visible text.
- Record decisions here with the date and who decided.

## Layout

- `public/` is the whole website and the only folder published. Never put notes, drafts or originals in it.
  - `index.html` page and styles, `site.js` behavior (chapters, picker, slides, contact form), `404.html`, `_headers` (security headers; Cloudflare reads it, GitHub Pages ignores it), `robots.txt`, `sitemap.xml`, `images/share-card.jpg` (1200×630)
  - **After editing `site.js`, bump its version** in `index.html` (`site.js?v=` + first 10 hex of `shasum -a 256 public/site.js`). A static test fails if it doesn't match.
- `tests/`: `tests/lib/facts.mjs` is the single source of truth; `tests/static/` (Node built-ins, the deploy gate) and `tests/browser/` (Playwright 1.64.0, 7 screen setups, real CSP). No `package.json` at the repo root.
- Local only, gitignored: `mockups/` (share-card source `og-card.html` + `render-share-card.mjs`; original photos go in `mockups/photos/`), `.claude/` (preview server on port 8082), `PLAN.md`, `NICOLE-QUESTIONS.md`.

## Page

Five chapters: Intro · About · Experience · Skills · Contact (`CHAPTERS` in facts). Desktop above 960px shows one chapter at a time (slides); 960px and below, a "01 Intro ▾" picker and a normal scrolling page.

- **Hero (Paul, 2026-11-06):** one still portrait in an arched frame with an offset outline and a caption under it. **Not** the template site's photo with three bouncing stat cards: a static and a browser test keep cards and bouncing out.
- **Photos:** originals live in `mockups/photos/` (local only; via Paul, 2026-11-06/07). The hero is her headshot (`images/nicole-headshot.jpg`, 774×774, square, trimmed by the arch). Web copies are re-encoded through a canvas so no location or camera details survive; a static test checks every photo for them. Never change a picture but keep its file name (caches hold `/images/*` for a week): give it a new name.
- **Colors are placeholders** (teal) until Nicole picks her scheme. Every color is a token in the `:root` block at the top of the stylesheet (a test enforces it). A new scheme also means updating the favicon, `404.html` and the share card (re-render `mockups/og-card.html`).
- **Draft placeholders** are `<span class="todo">…</span>`: dashed boxes saying what's still needed. While `LAUNCHED` is false there must be some; at launch there must be none.
- **Contact form** is not connected: it posts to `YOUR_FORM_ID`, and `site.js` shows "isn't connected yet" instead of sending. Once Paul creates the Formspree form, put its id in `FORMSPREE_ID` and the form action, set `FORM.connected`, and copy back the template site's send/success/failure browser tests.

## Content facts (source, date)

From her LinkedIn (screenshot via Paul, 2026-11-06); her résumé will win where they differ: Senior Account Executive at Lime Media; Greater Philadelphia; University of Delaware; https://www.linkedin.com/in/nicole-foley-/. The headline "Nicole brings brands to life, in person." is a draft until her résumé and answers arrive.

**Agency partners stay unnamed (Paul, 2026-11-07).** When the site covers her Wicked work, credit the media agency and its people generically ("agency partners"). Serino Coyne may be named. The reasons and the names are in `PLAN.md` (local only); the hashed leftover test in `content.test.mjs` blocks them on the page.

## Hosting

- **Now:** review copy on GitHub Pages at https://realpauls.github.io/nicole-site/ from the public repo `realpauls/nicole-site` (Paul, 2026-11-06: public is fine for the review stage; GitHub Pages needs a public repo on this plan). `.github/workflows/pages.yml` runs the static tests, then publishes `public/`. `noindex` is on.
- **Later:** Cloudflare Pages + Nicole's own domain, the same way as the template site (see `PLAN.md`): private repo, build command `node --test tests/static/*.test.mjs`, output `public`, Email Routing, Formspree. Then remove the Pages workflow, turn GitHub Pages off, make the repo private, and change `SITE`, robots and sitemap to the domain.
