// The contact form in a real browser. Formspree is never actually called: requests are intercepted here.
// Until the form is connected (FORM.connected), sending shows a "not connected yet" note and sends nothing.
// When it is connected, bring back the success/failure tests from the template site (its tests/browser/contact.spec.mjs).
import { test, expect } from './helpers.mjs';
import { FORM } from '../lib/facts.mjs';

const form = (page) => page.locator('#contact-form');

// On desktop the chapters are slides, so go to the Contact slide first (End = last chapter).
async function toContact(page) {
  await page.goto('/');
  if (page.viewportSize().width > 960) await page.keyboard.press('End');
}

async function openForm(page) {
  await toContact(page);
  await page.locator('.js-open-contact').click();
  await expect(form(page)).toBeVisible();
}

async function fill(page) {
  await page.fill('#contact-form input[name="name"]', 'Test Visitor');
  await page.fill('#contact-form input[name="email"]', 'visitor@example.test');
  await page.fill('#contact-form textarea[name="message"]', 'Hello from the browser tests.');
}

test('form starts collapsed and "Send a message" opens it, ready to type', async ({ page }) => {
  await toContact(page);
  await expect(form(page)).toBeHidden();
  await page.locator('.js-open-contact').click();
  await expect(form(page)).toBeVisible();
  await expect(page.locator('#contact-form input[name="name"]')).toBeFocused();
  await expect(page.locator('.js-open-contact')).toBeHidden();
});

test('choosing Contact in the top bar opens the form', async ({ page }) => {
  await page.goto('/');
  if (page.viewportSize().width <= 960) {
    await page.locator('#picker').click();
    await page.locator('#chapter-list a[href="#contact"]').click();
  } else {
    await page.locator('.names a.cta').click();
  }
  await expect(form(page)).toBeVisible();
});

test('a shared /#contact link opens with the form showing', async ({ page }) => {
  await page.goto('/#contact');
  await expect(form(page)).toBeVisible();
});

test('empty required fields stop the send', async ({ page }) => {
  let sent = 0;
  await page.route('https://formspree.io/**', (route) => { sent++; route.abort(); });
  await openForm(page);
  await page.locator('#contact-form button[type="submit"]').click();
  expect(await page.locator('#contact-form input[name="name"]').evaluate((el) => el.validity.valueMissing)).toBe(true);
  expect(sent).toBe(0);
});

test('not connected yet: sending says so, keeps what was typed, and sends nothing', async ({ page }) => {
  test.skip(FORM.connected, 'only while the Formspree form is not set up');
  let sent = 0;
  await page.route('https://formspree.io/**', (route) => { sent++; route.abort(); });
  await openForm(page);
  await fill(page);
  await page.locator('#contact-form button[type="submit"]').click();
  await expect(page.locator('#contact-form .form-status')).toHaveText(FORM.notConnected);
  await expect(page.locator('#contact-form input[name="name"]')).toHaveValue('Test Visitor');
  expect(sent).toBe(0);
});

test('Contact still fits one screen on desktop with the form open', async ({ page }) => {
  test.skip(page.viewportSize().width <= 960, 'desktop slides only');
  await openForm(page);
  const { scroll, height } = await page.locator('#contact').evaluate((el) => ({ scroll: el.scrollHeight, height: el.clientHeight }));
  expect(scroll).toBeLessThanOrEqual(height + 1);
});

test('"Connect on LinkedIn" opens Nicole’s profile in a new tab', async ({ page }) => {
  await toContact(page);
  const link = page.locator('#contact-panel a', { hasText: 'Connect on LinkedIn' });
  await expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/nicole-foley-/');
  await expect(link).toHaveAttribute('target', '_blank');
});
