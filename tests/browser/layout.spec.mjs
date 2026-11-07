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

test('the intro is option B: three fanned photos and a ticker; only the ticker moves (Nicole, 2026-11-07)', async ({ page }) => {
  // Kept different from the template site, whose photo has three bouncing stat cards.
  await expect(page.locator('.fan figure')).toHaveCount(3);
  await expect(page.locator('.chip, .collage, .float, .portrait')).toHaveCount(0);
  const moving = await page.locator('.chapter-intro *').evaluateAll((els) => els.filter((el) => getComputedStyle(el).animationName !== 'none').map((el) => el.parentElement.className));
  expect(moving).toEqual(['ticker']);
});

test('all three photos load, keep their shape, stay on screen, and her face is never covered', async ({ page }) => {
  const width = page.viewportSize().width;
  for (const img of await page.locator('.fan img').all()) {
    await expect.poll(() => img.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
    expect(await img.evaluate((el) => getComputedStyle(el).objectFit)).toBe('cover');
    const fig = await img.locator('xpath=..').boundingBox();
    expect(fig.x, 'left edge on screen').toBeGreaterThanOrEqual(-4); // a few px of a tilted print may cross the edge
    expect(fig.x + fig.width, 'right edge on screen').toBeLessThanOrEqual(width + 4);
  }
  const head = page.locator('.fan .f3 img');
  const box = await head.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(isPhoneLayout(page) ? 120 : 260);
  // her face (center, upper third of the photo) is the topmost thing on screen there
  const onTop = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.getAttribute('src'), [box.x + box.width / 2, box.y + box.height * 0.35]);
  expect(onTop).toBe('images/nicole-headshot.jpg');
});

test('the photos never cover her name, the brand line or the buttons', async ({ page }) => {
  const figs = await Promise.all((await page.locator('.fan figure').all()).map((f) => f.boundingBox()));
  for (const sel of ['h1', '.tagline', '.hero .actions']) {
    const box = await page.locator(sel).boundingBox();
    for (const f of figs) expect(overlaps(box, f), sel).toBe(false);
  }
});

test('the ticker rolls, and stands still for visitors who ask for reduced motion', async ({ page }) => {
  const ticker = page.locator('.ticker div');
  expect(await ticker.evaluate((el) => getComputedStyle(el).animationName)).toBe('roll');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await ticker.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});

test('on desktop the photos, the ticker and "Next" all fit on the Intro screen', async ({ page }) => {
  test.skip(!usesSlides(page), 'desktop only (above 960px)');
  for (const sel of ['.fan', '.ticker', '.chapter-intro .next-down']) {
    const box = await page.locator(sel).boundingBox();
    expect(box.y + box.height, sel).toBeLessThanOrEqual(page.viewportSize().height);
  }
});

test('on phones, the photos and her name both fit on the first screen', async ({ page }) => {
  test.skip(!isPhoneLayout(page), 'phone layout only');
  const h1 = await page.locator('h1').boundingBox();
  const fan = await page.locator('.fan').boundingBox();
  expect(fan.y).toBeLessThan(h1.y);
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
  await expect(page.locator('.bar .logo')).toHaveText('Nicole Foley');
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
