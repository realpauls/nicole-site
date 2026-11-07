// Content facts stay on the page, nothing suggests Nicole is job hunting, and nothing is left over from the template site.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { CONTENT, FORBIDDEN, LEFTOVERS, LEFTOVER_WORD_HASHES, LAUNCHED, LINKEDIN } from '../lib/facts.mjs';
import { read, markup, text, tags, publicFiles } from '../lib/site.mjs';

const html = read('index.html');
const visible = text(html);

test('key facts are on the page', () => {
  for (const fact of CONTENT) assert.ok(visible.toLowerCase().includes(fact.toLowerCase()), `missing: ${fact}`);
});

test('nothing hints at a job search or exposes private contact details', () => {
  for (const page of ['index.html', '404.html']) {
    const source = read(page); // raw source, so comments and meta tags count too
    for (const re of FORBIDDEN) assert.doesNotMatch(source, re, `${page}: ${re}`);
  }
});

test('nothing from the template site is left in what gets published', () => {
  const hash = (w) => createHash('sha256').update(w).digest('hex').slice(0, 16);
  for (const file of publicFiles().filter((f) => /\.(html|js|txt|xml)$|_headers$/.test(f))) {
    const source = read(file);
    for (const re of LEFTOVERS) assert.doesNotMatch(source, re, `${file}: ${re}`);
    const words = new Set(source.toLowerCase().match(/[a-z0-9]+/g));
    const found = [...words].filter((w) => LEFTOVER_WORD_HASHES.includes(hash(w)));
    assert.deepEqual(found, [], `${file}: a word from the template site`);
  }
});

test('LinkedIn link goes to Nicole’s profile and opens in a new tab', () => {
  const links = tags(html, 'a').filter((a) => a.attrs.href?.includes('linkedin.com'));
  assert.ok(links.length > 0);
  for (const a of links) {
    assert.equal(a.attrs.href, LINKEDIN);
    assert.equal(a.attrs.target, '_blank');
  }
});

test(LAUNCHED ? 'launched: no draft placeholders are left' : 'draft placeholders are marked, so they are easy to find and fill', () => {
  const todos = (markup(html).match(/class="[^"]*\btodo\b/g) ?? []).length;
  if (LAUNCHED) assert.equal(todos, 0, 'fill every .todo placeholder before launch');
  else assert.ok(todos > 0);
  assert.doesNotMatch(visible, /lorem|ipsum|TBD|TODO/i, 'placeholders use the .todo style, not filler words');
});

test('visible text and image descriptions use curly apostrophes', () => {
  for (const file of ['index.html', '404.html']) {
    const page = read(file);
    const body = page.slice(page.indexOf('<body'));
    const shown = [...body.matchAll(/>([^<]*)</g)].map((m) => m[1])
      .concat([...body.matchAll(/\b(?:alt|title|aria-label)="([^"]*)"/g)].map((m) => m[1]));
    const straight = shown.filter((t) => /\w'(\w|\s)|s'\s/.test(t)).map((t) => t.trim().slice(0, 60));
    assert.deepEqual(straight, [], `${file}: straight apostrophes`);
  }
});

test('US spelling in visible text (Paul, 2026-11-05)', () => {
  assert.doesNotMatch(visible, /\b(colour|favourite|centre|organis|behaviour|recognis)/i);
});

test('every color comes from the tokens at the top of the stylesheet, so a new scheme is one edit', () => {
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  const tokens = css.match(/:root \{[^}]*--black[\s\S]*?\}/)[0];
  const rest = css.replace(tokens, '');
  // Outside the tokens only white, black and neutral greys/shadows (rgb with equal channels), plus the form's ok/error colors.
  const hexes = [...rest.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((m) => m[0].toLowerCase()).filter((h) => !['#fff', '#000', '#15803d', '#b91c1c'].includes(h));
  assert.deepEqual(hexes, [], 'hard-coded colors outside :root');
  const rgbs = [...rest.matchAll(/rgb\((\d+) (\d+) (\d+)/g)].filter((m) => !(m[1] === m[2] && m[2] === m[3]) && !(m[1] === '11' && m[2] === '17' && m[3] === '18'));
  assert.deepEqual(rgbs.map((m) => m[0]), [], 'colored rgb() outside :root');
});
