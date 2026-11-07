// The contact form: posts to Formspree (once connected), with honeypot, the right required fields and subject,
// and collapsed until its button opens it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FORM, LAUNCHED } from '../lib/facts.mjs';
import { read, markup, tags } from '../lib/site.mjs';

const html = markup(read('index.html'));
const js = read('site.js');
const formHtml = html.match(/<form\b[^>]*id="contact-form"[\s\S]*?<\/form>/)?.[0] ?? '';
const fields = Object.fromEntries([...tags(formHtml, 'input'), ...tags(formHtml, 'textarea')].map((f) => [f.attrs.name, f.attrs]));

test('exactly one form, posting to the Formspree form', () => {
  assert.deepEqual(tags(html, 'form').map((f) => f.attrs.id), [FORM.id]);
  const attrs = tags(formHtml, 'form')[0].attrs;
  assert.equal(attrs.action, FORM.action);
  assert.equal(attrs.method.toUpperCase(), 'POST');
});

test(FORM.connected ? 'the form is connected to a real Formspree form' : 'not connected yet: site.js says so instead of sending', () => {
  if (FORM.connected) {
    assert.doesNotMatch(FORM.action, /YOUR_FORM_ID/);
    return;
  }
  assert.match(FORM.action, /YOUR_FORM_ID/);
  assert.ok(js.includes(`'${FORM.notConnected}'`), 'not-connected message');
  assert.ok(!LAUNCHED, 'never launch with the form unconnected');
});

test('required fields are required, optional ones are not, and nothing else is asked', () => {
  for (const name of FORM.required) assert.ok(name in fields && 'required' in fields[name], `${name} should be required`);
  for (const name of FORM.optional) assert.ok(name in fields && !('required' in fields[name]), `${name} should be optional`);
  const asked = Object.keys(fields).filter((n) => n !== FORM.honeypot && fields[n].type !== 'hidden');
  assert.deepEqual(asked.sort(), [...FORM.required, ...FORM.optional].sort());
  assert.equal(fields.email.type, 'email');
});

test('honeypot field is present and hidden from people', () => {
  const hp = fields[FORM.honeypot];
  assert.ok(hp, 'honeypot missing');
  assert.equal(hp.tabindex, '-1');
  assert.match(hp.class ?? '', /\bhp\b/);
  assert.match(read('index.html'), /\.form \.hp \{[^}]*left:-9999px/);
});

test('email subject line is set', () => {
  assert.equal(fields._subject?.type, 'hidden');
  assert.equal(fields._subject.value.replace(/&#39;|&apos;/g, "'"), FORM.subject);
});

test('starts collapsed, with a button that opens it', () => {
  assert.ok('hidden' in tags(formHtml, 'form')[0].attrs, 'form should start hidden');
  assert.match(html, new RegExp(`<button class="[^"]*${FORM.opener.slice(1)}[^"]*" type="button" aria-expanded="false" aria-controls="${FORM.id}"`));
});

test('site.js thanks the visitor with the agreed words', () => {
  assert.ok(js.includes(`'${FORM.id}': '${FORM.thanks}'`));
});
