// Shared setup: fail on console errors and security-policy violations, and know whether we're at phone size.
import { test as base, expect } from '@playwright/test';

// The site switches to its phone layout at 860px and below.
export const isPhoneLayout = (page) => page.viewportSize().width <= 860;

// Above 960px the chapters are slides: one at a time, and the page itself doesn't scroll.
export const usesSlides = (page) => page.viewportSize().width > 960;

export const test = base.extend({
  // Console errors a test causes on purpose (e.g. a simulated server failure). Set with test.use().
  allowedConsole: [[], { option: true }],
  page: async ({ page, allowedConsole }, use) => {
    const problems = [];
    // Playwright's WebKit build lacks the icons for its own video controls (real Safari has them).
    const allowed = [/404 \(Not Found\)/, /Button failed to load, iconName = [a-z-]+-placard/, ...allowedConsole];
    page.on('pageerror', (err) => problems.push(`page error: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !allowed.some((re) => re.test(msg.text()))) problems.push(`console: ${msg.text()}`);
    });
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) => console.error(`CSP blocked ${e.blockedURI} (${e.violatedDirective})`));
    });
    await use(page);
    expect(problems, 'no console errors or blocked resources').toEqual([]);
  },
});

export { expect };

// Rectangles overlap (with a small tolerance for shadows and rounding).
export const overlaps = (a, b, slack = 1) =>
  a.x < b.x + b.width - slack && a.x + a.width - slack > b.x && a.y < b.y + b.height - slack && a.y + a.height - slack > b.y;
