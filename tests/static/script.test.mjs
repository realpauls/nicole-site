// site.js: valid JavaScript, and every element it looks up exists in the page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { PUBLIC, read, markup } from '../lib/site.mjs';

const js = read('site.js');
const html = markup(read('index.html'));

test('site.js parses', () => {
  execFileSync(process.execPath, ['--check', join(PUBLIC, 'site.js')]);
});

test('every id site.js looks up exists in the page', () => {
  const ids = [...js.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]);
  assert.ok(ids.length > 0);
  for (const id of ids) assert.match(html, new RegExp(`id="${id}"`), `site.js expects #${id}`);
});

test('every class or attribute selector site.js uses matches the page', () => {
  const selectors = [...js.matchAll(/querySelector(?:All)?\('([^']+)'\)/g)].map((m) => m[1]);
  for (const sel of selectors) {
    const cls = sel.match(/^\.([\w-]+)$/)?.[1];
    if (cls) assert.match(html, new RegExp(`class="[^"]*\\b${cls}\\b`), `site.js expects .${cls}`);
  }
});

test('does not use eval-like features the CSP forbids', () => {
  assert.doesNotMatch(js, /\beval\(|new Function\(|setTimeout\(\s*['"]/);
});

test('form submissions send JSON-accepting requests to the form action', () => {
  assert.match(js, /fetch\(form\.action/);
  assert.match(js, /Accept:\s*'application\/json'/);
  assert.match(js, /YOUR_FORM_ID/, 'the not-yet-connected guard should stay as a safety net');
});
