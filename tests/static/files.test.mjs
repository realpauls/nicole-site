// What gets published: only known files, within size budgets, with working robots/sitemap/404.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_FILES, BUDGET, SITE } from '../lib/facts.mjs';
import { publicFiles, read, size, tags } from '../lib/site.mjs';

test('public/ contains exactly the allow-listed files (nothing private ships)', () => {
  assert.deepEqual(publicFiles(), [...PUBLIC_FILES].sort(),
    'A file was added to or removed from public/. If intended, update PUBLIC_FILES in tests/lib/facts.mjs.');
});

test('no notes, drafts, dotfiles or source files in public/', () => {
  const bad = publicFiles().filter((f) => /(^|\/)\.|\.(md|mjs|json|yml|yaml|py|sh|txt~|bak|psd|zip)$/i.test(f));
  assert.deepEqual(bad, []);
});

test('no downloadable résumé: no documents in public/ and no résumé links (as on the template site)', () => {
  assert.deepEqual(publicFiles().filter((f) => /\.(pdf|docx?|rtf|pages|odt)$/i.test(f) || /r[eé]sum[eé]|\bcv\b/i.test(f)), []);
  for (const page of ['index.html', '404.html']) {
    const source = read(page); // raw source, so commented-out links count too
    assert.doesNotMatch(source, /href="[^"]*\.(pdf|docx?|rtf)(\?|#|")/i, `${page} links to a document`);
    assert.doesNotMatch(source, /download\s+r[eé]sum[eé]/i, `${page} offers a résumé download`);
  }
});

test('files stay within size budgets', () => {
  for (const f of publicFiles()) {
    const limit = f.endsWith('.html') ? BUDGET.html : f.endsWith('.js') ? BUDGET.js : /\.(jpe?g|png|webp)$/.test(f) ? BUDGET.image : null;
    if (limit) assert.ok(size(f) <= limit, `${f} is ${size(f)} bytes, over the ${limit}-byte budget`);
  }
});

test('robots.txt allows crawling and points at the sitemap', () => {
  const robots = read('robots.txt');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, new RegExp(`^Sitemap: ${SITE}/sitemap\\.xml$`, 'm'));
});

test('sitemap lists the canonical homepage', () => {
  assert.match(read('sitemap.xml'), new RegExp(`<loc>${SITE}/</loc>`));
});

test('404 page is branded, not indexed, and links home with a relative link', () => {
  const page = read('404.html');
  assert.match(page, /<title>[^<]*Nicole Foley/);
  assert.ok(tags(page, 'meta').some((m) => m.attrs.name === 'robots' && /noindex/.test(m.attrs.content)));
  assert.ok(tags(page, 'a').some((a) => a.attrs.href === './'));
  assert.equal(tags(page, 'script').length, 0, '404 page should not need scripts');
});
