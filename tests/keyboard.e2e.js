import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

test('keyboard shortcuts work after clicking a button and preserve native select navigation', { timeout: 30000 }, async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:5173', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.orion?.getSnapshot().phase === 'READY_WAIT');
    const initial = await page.evaluate(() => window.orion.getSnapshot());
    await page.locator('#step-button').click();
    await page.waitForFunction(() => window.orion.getSnapshot().step === 1 && !window.orion.getStatus().busy);
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(() => window.orion.getSnapshot().step === 0 && !window.orion.getStatus().busy);
    assert.deepEqual(await page.evaluate(() => window.orion.getSnapshot()), initial);
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => window.orion.getSnapshot().step === 1 && !window.orion.getStatus().busy);
    await page.locator('#speed').focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.evaluate(() => window.orion.getSnapshot().step), 1);
    await page.locator('#step-button').focus();
    await page.keyboard.press('n');
    await page.waitForFunction(() => window.orion.getSnapshot().step === 0 && window.orion.getSnapshot().phase === 'READY_WAIT');
    assert.notEqual(await page.evaluate(() => window.orion.getSnapshot().seed), initial.seed);
  } finally { await browser.close(); }
});
