// Security headers in public/_headers, and that the page only uses what the CSP permits.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CSP } from '../lib/facts.mjs';
import { read, markup, siteHeaders, csp } from '../lib/site.mjs';

const headers = siteHeaders();
const policy = csp();

test('CSP directives match the agreed policy exactly', () => {
  assert.deepEqual(policy, CSP, 'CSP changed. If intended, update CSP in tests/lib/facts.mjs and CLAUDE.md together.');
});

test('scripts are never allowed inline or via eval', () => {
  assert.ok(!policy['script-src'].includes("'unsafe-inline'"));
  assert.ok(!policy['script-src'].includes("'unsafe-eval'"));
});

test('every outside origin the page loads from is permitted by the CSP', () => {
  const html = markup(read('index.html'));
  const styles = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map((m) => new URL(m[0].match(/href="([^"]+)"/)[1]).origin);
  for (const o of styles) assert.ok(policy['style-src'].includes(o), `stylesheet origin ${o} not in style-src`);
  const action = html.match(/<form[^>]+action="([^"]+)"/)[1];
  assert.ok(policy['form-action'].includes(new URL(action).origin), 'form action not in form-action');
  assert.ok(policy['connect-src'].includes(new URL(action).origin), 'form origin not in connect-src (site.js uses fetch)');
  if (/fonts\.googleapis\.com/.test(html)) assert.ok(policy['font-src'].includes('https://fonts.gstatic.com'));
});

test('HSTS is on for at least a year', () => {
  const hsts = headers['strict-transport-security'] ?? '';
  assert.ok(Number(hsts.match(/max-age=(\d+)/)?.[1]) >= 31536000, 'HSTS missing or too short');
});

test('other protective headers are set', () => {
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.equal(headers['x-frame-options'], 'DENY');
  assert.equal(headers['referrer-policy'], 'strict-origin-when-cross-origin');
  assert.match(headers['permissions-policy'] ?? '', /camera=\(\)/);
});

test('_headers keeps its "/*" rule at the top of public/', () => {
  assert.match(read('_headers'), /^\/\*$/m);
});
