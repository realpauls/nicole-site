// Browser tests for Nicole's site: real Chromium and WebKit (Safari's engine) at phone, tablet and desktop sizes.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const phone = { isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

export default defineConfig({
  testDir: './browser',
  testMatch: '*.spec.mjs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  webServer: {
    command: `node browser/serve.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'phone-375', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 }, ...phone } },
    { name: 'phone-412', use: { ...devices['Desktop Chrome'], viewport: { width: 412, height: 915 }, ...phone } },
    { name: 'iphone-safari', use: { ...devices['iPhone 13'] } },
    { name: 'tablet-768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'desktop-1280', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'desktop-safari', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
    { name: 'wide-1920', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
  ],
});
