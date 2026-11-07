// Layout at every screen size: nothing spills sideways, nothing covers Nicole's photo, the right menu shows.
import { test, expect, isPhoneLayout, usesSlides, overlaps } from './helpers.mjs';
import { CHAPTERS } from '../lib/facts.mjs';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
});

test('nothing runs off the side of the screen', async ({ page }) => {
  const { scroll, width } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
  expect(scroll).toBeLessThanOrEqual(width);
});

test('the hero is one still portrait: no stat cards and nothing bounces (Paul, 2026-11-06)', async ({ page }) => {
  // Kept different from the template site, whose photo has three bouncing stat cards.
  await expect(page.locator('.chapter-intro .portrait')).toHaveCount(1);
  await expect(page.locator('.chip, .collage, .float')).toHaveCount(0);
  const moving = await page.locator('.chapter-intro *').evaluateAll((els) => els.filter((el) => getComputedStyle(el).animationName !== 'none').length);
  expect(moving).toBe(0);
});

test('portrait is a sensible size, and its caption sits under it without covering it', async ({ page }) => {
  // A placeholder until Nicole's photo arrives; then also check the image loads.
  const frame = await page.locator('.portrait .frame').boundingBox();
  expect(frame.width).toBeGreaterThanOrEqual(isPhoneLayout(page) ? 180 : 280);
  expect(frame.height / frame.width).toBeCloseTo(1.25, 1);
  const caption = await page.locator('.portrait figcaption').boundingBox();
  expect(overlaps(frame, caption)).toBe(false);
  expect(caption.y).toBeGreaterThan(frame.y + frame.height);
});

test('on desktop the whole portrait and caption fit on the Intro screen', async ({ page }) => {
  test.skip(!usesSlides(page), 'desktop only (above 960px)');
  const caption = await page.locator('.portrait figcaption').boundingBox();
  expect(caption.y + caption.height).toBeLessThanOrEqual(page.viewportSize().height);
});

test('on phones, the photo and the headline both fit on the first screen', async ({ page }) => {
  test.skip(!isPhoneLayout(page), 'phone layout only');
  const h1 = await page.locator('h1').boundingBox();
  const photo = await page.locator('.portrait .frame').boundingBox();
  expect(photo.y).toBeLessThan(h1.y);
  expect(h1.y + h1.height).toBeLessThanOrEqual(page.viewportSize().height);
});

test('the right chapter navigation shows for the screen size', async ({ page }) => {
  // 960px and below: one "01 Intro ▾" picker; wider: every chapter name across the top bar.
  const picker = page.locator('#picker');
  const names = page.locator('.names');
  if (page.viewportSize().width <= 960) {
    await expect(picker).toBeVisible();
    await expect(names).toBeHidden();
  } else {
    await expect(picker).toBeHidden();
    for (const a of await names.locator('a').all()) await expect(a).toBeVisible();
    await expect(names.locator('a.cta')).toHaveText('Contact');
  }
  await expect(page.locator('.bar .logo')).toHaveText('Nicole.');
});

test('the top bar stays on screen while scrolling', async ({ page }) => {
  if (usesSlides(page)) {
    await page.locator('.names a[href="#experience"]').click();
    await page.evaluate(() => { document.getElementById('experience').scrollTop = 600; });
  } else {
    await page.evaluate(() => window.scrollTo(0, document.getElementById('experience').offsetTop));
  }
  await expect.poll(() => page.evaluate(() => Math.round(document.querySelector('.bar').getBoundingClientRect().top))).toBe(0);
});

test('buttons are big enough to tap on phones', async ({ page }) => {
  test.skip(!isPhoneLayout(page), 'phone layout only');
  for (const sel of ['#picker', '.hero .actions a', '.js-open-contact', '.next-down']) {
    for (const el of await page.locator(sel).all()) {
      const box = await el.boundingBox();
      expect(box.height, `${sel} height`).toBeGreaterThanOrEqual(40);
    }
  }
});

test('the page fonts load', async ({ page }) => {
  expect(await page.evaluate(() => document.fonts.check('16px "Instrument Serif"') && document.fonts.check('16px Inter'))).toBe(true);
});

test('Skills: every filled-in pill looks the same, none highlighted', async ({ page }) => {
  if (usesSlides(page)) await page.locator('.names a[href="#skills"]').click();
  const looks = await page.locator('.skill-pills span:not(.todo)').evaluateAll((els) => els.map((el) => { const s = getComputedStyle(el); return `${s.color} ${s.borderTopColor}`; }));
  expect(looks.length).toBeGreaterThanOrEqual(1);
  expect(new Set(looks).size).toBe(1);
});

test.describe('desktop slides', () => {
  test.beforeEach(({ page }) => test.skip(!usesSlides(page), 'desktop only (above 960px)'));

  test('the page never scrolls, and exactly one chapter shows at a time', async ({ page }) => {
    for (const c of CHAPTERS) {
      await page.locator(`.names a[href="#${c.id}"]`).click();
      const shown = await page.locator('.chapter').evaluateAll((els) => els.filter((el) => el.offsetHeight > 0).map((el) => el.id));
      expect(shown).toEqual([c.id]);
      expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight), 'page scroll').toBeLessThanOrEqual(0);
    }
  });

  test('Intro and Contact each fit one screen with no scrolling', async ({ page }) => {
    for (const id of ['intro', 'contact']) {
      await page.locator(`.names a[href="#${id}"]`).click();
      const { scroll, height } = await page.locator(`#${id}`).evaluate((el) => ({ scroll: el.scrollHeight, height: el.clientHeight }));
      expect(scroll, `${id} fits`).toBeLessThanOrEqual(height + 1);
    }
  });

  test('without JavaScript the desktop page is the normal scrolling page', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto('/');
    for (const c of CHAPTERS) await expect(page.locator(`#${c.id}`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(800 * 3);
    await context.close();
  });
});
