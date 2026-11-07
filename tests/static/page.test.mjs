// The homepage's markup: links, anchors, images, scripts, SEO tags and the launch switch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { LAUNCHED, SITE, ALLOWED_HOSTS, CHAPTERS, SHARE_CARD } from '../lib/facts.mjs';
import { PUBLIC, read, markup, tags, jpegSize } from '../lib/site.mjs';

const html = read('index.html');
const local = (url) => !/^(https?:|data:|mailto:|tel:|#)/i.test(url);

test('has a title, description, language and viewport', () => {
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>Nicole Foley[^<]*<\/title>/);
  assert.ok(tags(html, 'meta').some((m) => m.attrs.name === 'description' && m.attrs.content.length > 50));
  assert.ok(tags(html, 'meta').some((m) => m.attrs.name === 'viewport'));
});

test('every in-page link points at an element that exists', () => {
  const ids = new Set(tags(html, '[a-z]+').map((t) => t.attrs.id).filter(Boolean));
  for (const a of tags(html, 'a')) {
    const href = a.attrs.href;
    if (href?.startsWith('#') && href !== '#') assert.ok(ids.has(href.slice(1)), `${href} has no matching id`);
  }
});

test('the page is the 5 chapters, in order, each labeled', () => {
  const chapters = tags(html, 'section').filter((t) => /\bchapter\b/.test(t.attrs.class ?? '')).map((t) => ({ id: t.attrs.id, label: t.attrs['data-label']?.replace(/&amp;/g, '&') }));
  assert.deepEqual(chapters, CHAPTERS);
});

test('desktop names and the phone picker both list every chapter, in order', () => {
  const page = markup(html);
  for (const [name, re] of [['desktop names', /<nav class="names"[^>]*>([\s\S]*?)<\/nav>/], ['phone picker list', /<nav class="chapter-list"[^>]*>([\s\S]*?)<\/nav>/]]) {
    const hrefs = [...(page.match(re)?.[1] ?? '').matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(hrefs, CHAPTERS.map((c) => c.id), name);
  }
  assert.match(page, /<button class="picker" id="picker"[^>]*aria-controls="chapter-list"/);
});

test('the top bar shows just "Nicole." then the chapters, with no "1 / 5" count', () => {
  const header = markup(html).match(/<header class="bar">[\s\S]*?<\/header>/)?.[0] ?? '';
  assert.match(header, /<a class="logo" href="#intro">Nicole<b>\.<\/b><\/a>/);
  assert.doesNotMatch(header, /id="where"|\b\d+ \/ \d+\b/);
});

test('photos on the site carry no location or camera details', () => {
  for (const img of tags(html, 'img').filter((i) => /\.jpe?g$/.test(i.attrs.src))) {
    const bytes = readFileSync(join(PUBLIC, img.attrs.src)).toString('latin1');
    assert.doesNotMatch(bytes, /Exif\0\0|GPS|iPhone|Apple/, `${img.attrs.src} still has metadata: re-encode it`);
  }
});

test('the hero is one portrait, not the template site’s photo with three bouncing cards (Paul, 2026-11-06)', () => {
  assert.equal((markup(html).match(/<figure class="portrait">/g) ?? []).length, 1);
  assert.doesNotMatch(html, /class="[^"]*\b(collage|chip|float)\b|@keyframes float/);
});

test('every chapter but the last ends with a "Next" link to the following chapter', () => {
  const nexts = [...markup(html).matchAll(/<a class="next-down" href="#([^"]+)">Next: ([^<]+) ↓<\/a>/g)].map((m) => ({ id: m[1], label: m[2].replace(/&amp;/g, '&') }));
  assert.deepEqual(nexts, CHAPTERS.slice(1));
});

test('no empty or placeholder links', () => {
  for (const a of tags(html, 'a')) {
    assert.ok(a.attrs.href !== undefined && a.attrs.href !== '', `empty href: ${a.tag}`);
    assert.doesNotMatch(a.attrs.href, /example\.com|YOUR_|TODO|placeholder/i, a.tag);
  }
});

test('links that open a new tab use rel="noopener"', () => {
  for (const a of tags(html, 'a').filter((x) => x.attrs.target === '_blank')) {
    assert.match(a.attrs.rel ?? '', /noopener/, a.tag);
  }
});

test('external URLs only use allow-listed hosts', () => {
  const urls = [...markup(html).matchAll(/(?:href|src|action|content)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
  for (const url of urls) assert.ok(ALLOWED_HOSTS.includes(new URL(url).hostname), `unexpected host: ${url}`);
});

test('every local file the page references exists', () => {
  const refs = [...markup(html).matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]).filter(local);
  const og = tags(html, 'meta').find((m) => m.attrs.property === 'og:image')?.attrs.content ?? '';
  if (local(og)) refs.push(og);
  for (const ref of refs) assert.ok(existsSync(join(PUBLIC, ref.split(/[?#]/)[0])), `missing file: ${ref}`);
});

test('every image\'s width and height match the real file', () => {
  // Catches a stale or swapped file. Never replace an image under the same name: Cloudflare and browsers cache
  // /images/* for 7 days, so give a changed picture a new file name (a lesson from the template site, 2026-10-25).
  for (const img of tags(html, 'img').filter((i) => /\.jpe?g$/.test(i.attrs.src))) {
    const real = jpegSize(img.attrs.src);
    assert.deepEqual({ width: Number(img.attrs.width), height: Number(img.attrs.height) }, real, img.attrs.src);
  }
});

test('images have alt text and dimensions', () => {
  const imgs = tags(html, 'img');
  assert.ok(imgs.some((i) => i.attrs.src === 'images/nicole-headshot.jpg'), 'expected her headshot in the hero');
  for (const img of imgs) {
    assert.ok(img.attrs.alt?.trim(), `missing alt: ${img.tag}`);
    assert.ok(img.attrs.width && img.attrs.height, `missing width/height: ${img.tag}`);
  }
});

test('no inline scripts or inline event handlers (the CSP would block them)', () => {
  for (const s of tags(html, 'script')) assert.ok(s.attrs.src, `inline <script> found: ${s.tag}`);
  assert.doesNotMatch(markup(html), /\son[a-z]+\s*=/i, 'inline event handler (onclick= etc.) found');
  assert.doesNotMatch(html, /application\/ld\+json/, 'JSON-LD is an inline script; use microdata');
});

test('loads site.js with a version that matches the file, so phones never run a stale cached copy', () => {
  // Browsers keep site.js for up to 4 hours; a new ?v= on every change forces the fresh one (stale copy broke the picker, 2026-10-25).
  // After editing site.js: v = first 10 hex of `shasum -a 256 public/site.js`.
  const version = createHash('sha256').update(read('site.js')).digest('hex').slice(0, 10);
  assert.ok(tags(html, 'script').some((s) => s.attrs.src === `site.js?v=${version}`), `script tag should be <script src="site.js?v=${version}">`);
});

test('share card is 1200x630 and declared that way', () => {
  assert.deepEqual(jpegSize(SHARE_CARD.file), { width: SHARE_CARD.width, height: SHARE_CARD.height });
  const meta = Object.fromEntries(tags(html, 'meta').filter((m) => m.attrs.property).map((m) => [m.attrs.property, m.attrs.content]));
  assert.ok(meta['og:image']?.endsWith(SHARE_CARD.file));
  assert.equal(meta['og:image:width'], String(SHARE_CARD.width));
  assert.equal(meta['og:image:height'], String(SHARE_CARD.height));
});

test(LAUNCHED ? 'launched: indexable, with canonical, og:url and absolute og:image' : 'pre-launch: hidden from search engines', () => {
  const robots = tags(html, 'meta').find((m) => m.attrs.name === 'robots');
  if (!LAUNCHED) {
    assert.match(robots?.attrs.content ?? '', /noindex/, 'noindex must stay on until Nicole approves the site');
    return;
  }
  assert.ok(!robots || !/noindex/.test(robots.attrs.content), 'noindex is still on, but LAUNCHED is true');
  assert.ok(tags(html, 'link').some((l) => l.attrs.rel === 'canonical' && l.attrs.href === `${SITE}/`), 'missing canonical');
  const meta = Object.fromEntries(tags(html, 'meta').filter((m) => m.attrs.property).map((m) => [m.attrs.property, m.attrs.content]));
  assert.equal(meta['og:url'], `${SITE}/`);
  assert.equal(meta['og:image'], `${SITE}/${SHARE_CARD.file}`);
});
