// Chapter navigation (layout D): desktop names, the phone "01 Intro ▾" picker, Next links, arrow keys, and the 404 page.
import { test, expect, isPhoneLayout, usesSlides } from './helpers.mjs';
import { CHAPTERS } from '../lib/facts.mjs';

// The site shows the picker instead of the row of names at 960px and below.
const usesPicker = (page) => page.viewportSize().width <= 960;

// A chapter counts as "landed on" when its top sits just under the sticky top bar.
async function expectScrolledTo(page, id) {
  await expect.poll(() => page.evaluate((i) => Math.round(document.getElementById(i).getBoundingClientRect().top - document.querySelector('.bar').offsetHeight), id)).toBeLessThan(40);
  await expect.poll(() => page.evaluate((i) => Math.round(document.getElementById(i).getBoundingClientRect().top - document.querySelector('.bar').offsetHeight), id)).toBeGreaterThan(-40);
}
const pickerText = (page) => page.locator('#picker').innerText().then((t) => t.replace(/\s+/g, ' ').replace('▼', '').trim());

test('the top bar names the current chapter as you go', async ({ page }) => {
  await page.goto('/');
  if (usesPicker(page)) await expect.poll(() => pickerText(page)).toBe('01 Intro');
  else await expect(page.locator('.names a[aria-current="true"]')).toHaveText('Intro');
  if (usesSlides(page)) for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  else await page.evaluate(() => window.scrollTo(0, document.getElementById('skills').offsetTop - document.querySelector('.bar').offsetHeight + 1));
  if (usesPicker(page)) await expect.poll(() => pickerText(page)).toBe('04 Skills');
  else await expect(page.locator('.names a[aria-current="true"]')).toHaveText('Skills');
});

test('phone picker opens every chapter, and each one lands where it should', async ({ page }) => {
  test.skip(!usesPicker(page), 'picker layout only');
  await page.goto('/');
  const picker = page.locator('#picker');
  const list = page.locator('#chapter-list');
  await expect(page.locator('.names')).toBeHidden();
  for (const [i, c] of CHAPTERS.entries()) {
    await picker.click();
    await expect(list).toBeVisible();
    await expect(picker).toHaveAttribute('aria-expanded', 'true');
    await expect(list.locator('a')).toHaveCount(CHAPTERS.length);
    await list.locator(`a[href="#${c.id}"]`).click();
    await expect(list).toBeHidden();
    await expectScrolledTo(page, c.id);
    await expect.poll(() => pickerText(page)).toBe(`${String(i + 1).padStart(2, '0')} ${c.label}`);
  }
});

test('phone picker opens with a finger tap, not just a mouse click', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'touch phones only');
  await page.goto('/');
  await page.locator('#picker').tap();
  await expect(page.locator('#chapter-list')).toBeVisible();
  await page.locator('#chapter-list a[href="#experience"]').tap();
  await expectScrolledTo(page, 'experience');
});

test('phone picker closes with Escape, the button, or a tap outside', async ({ page }) => {
  test.skip(!usesPicker(page), 'picker layout only');
  await page.goto('/');
  const picker = page.locator('#picker');
  const list = page.locator('#chapter-list');
  await picker.click(); await page.keyboard.press('Escape'); await expect(list).toBeHidden();
  await picker.click(); await picker.click(); await expect(list).toBeHidden();
  await picker.click(); await page.locator('#scrim').click({ position: { x: 10, y: page.viewportSize().height - 10 } }); await expect(list).toBeHidden();
});

test('desktop chapter names all show and each lands on its chapter', async ({ page }) => {
  test.skip(usesPicker(page), 'desktop names only');
  await page.goto('/');
  await expect(page.locator('#picker')).toBeHidden();
  for (const c of CHAPTERS) {
    await page.locator(`.names a[href="#${c.id}"]`).click();
    await expectScrolledTo(page, c.id);
  }
});

test('"Next ↓" at the end of a chapter goes to the next one', async ({ page }) => {
  await page.goto('/');
  for (const c of CHAPTERS.slice(1)) {
    await page.locator(`a.next-down[href="#${c.id}"]`).click();
    await expectScrolledTo(page, c.id);
  }
});

test('arrow keys jump chapter to chapter on a computer', async ({ page }) => {
  test.skip(isPhoneLayout(page), 'keyboard is for computers');
  await page.goto('/');
  await page.keyboard.press('ArrowRight');
  await expectScrolledTo(page, CHAPTERS[1].id);
  await page.keyboard.press('ArrowRight');
  await expectScrolledTo(page, CHAPTERS[2].id);
  await page.keyboard.press('ArrowLeft');
  await expectScrolledTo(page, CHAPTERS[1].id);
});

test('desktop slides: scrolling never changes chapter on its own; Home/End do', async ({ page }) => {
  // Lesson from the template site (2026-10-25): only names, Next, links and keys change chapter.
  test.skip(!usesSlides(page), 'desktop only (above 960px)');
  await page.goto('/');
  const shown = () => page.evaluate(() => ({ on: document.querySelector('.chapter.on')?.id, tab: document.querySelector('.names a[aria-current="true"]')?.getAttribute('href') }));
  await page.mouse.move(400, 400);
  for (let k = 0; k < 3; k++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(150); }
  await page.keyboard.press('PageDown');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(300);
  expect(await shown()).toEqual({ on: 'intro', tab: '#intro' });
  await page.locator('.names a[href="#about"]').click();
  await page.mouse.move(400, 400); // back over the chapter, off the top bar
  for (let k = 0; k < 6; k++) { await page.mouse.wheel(0, 1000); await page.waitForTimeout(100); }
  await page.keyboard.press('PageDown');
  await page.waitForTimeout(300);
  expect(await shown()).toEqual({ on: 'about', tab: '#about' });
  await page.keyboard.press('End');
  await expect.poll(shown).toEqual({ on: 'contact', tab: '#contact' });
  await expect(page.locator('#contact-form')).toBeHidden(); // End shows Contact without opening the form
  await page.keyboard.press('Home');
  await expect.poll(shown).toEqual({ on: 'intro', tab: '#intro' });
});

test('desktop slides: a shared link opens straight on its chapter', async ({ page }) => {
  test.skip(!usesSlides(page), 'desktop only (above 960px)');
  await page.goto('/#experience');
  await expectScrolledTo(page, 'experience');
  await expect(page.locator('.names a[aria-current="true"]')).toHaveText('Experience');
});

test('"See her experience" goes to the experience chapter', async ({ page }) => {
  await page.goto('/');
  await page.locator('.hero a[href="#experience"]').click();
  await expectScrolledTo(page, 'experience');
});

test('missing pages show the branded 404 with a working link home', async ({ page }) => {
  const res = await page.goto('/no-such-page');
  expect(res.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('detour');
  await page.locator('a', { hasText: 'Back to Nicole' }).click();
  await expect(page.locator('h1')).toContainText('Nicole Foley');
});
