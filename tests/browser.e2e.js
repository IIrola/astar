import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5173';
const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const launch = () =>
  chromium.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
    ],
  });

test(
  'cinematic rendering loads local planet maps and supports switching quality in the cockpit',
  { timeout: 90000 },
  async () => {
    const browser = await launch();
    try {
      const page = await browser.newPage({
        viewport: { width: 800, height: 900 },
        reducedMotion: 'reduce',
      });
      const errors = [],
        images = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('response', (response) => {
        if (response.url().includes('/textures/')) images.push(response.status());
      });
      await page.goto(`${baseURL}/?quality=cinematic`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.orion?.getSnapshot().phase === 'READY_WAIT');
      assert.equal(await page.evaluate(() => window.orion.getStatus().quality), 'cinematic');
      assert.deepEqual(images, [200, 200, 200]);
      await page.screenshot({ path: '/tmp/orion-cinematic.png', timeout: 60000 });
      await page.locator('#render-quality').selectOption('balanced');
      assert.equal(await page.evaluate(() => window.orion.getStatus().quality), 'balanced');
      await page.locator('#step-button').click();
      await page.waitForFunction(
        () => !window.orion.getStatus().busy && window.orion.getSnapshot().step === 1,
      );
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  },
);

test(
  'cockpit renders in WebGL, advances, restores fog and telemetry, captures, and resets',
  { timeout: 120000 },
  async () => {
    const browser = await launch();
    try {
      const page = await browser.newPage({
        viewport: { width: 1100, height: 850 },
        reducedMotion: 'reduce',
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.goto(`${baseURL}/?quality=balanced`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.orion?.getSnapshot().phase === 'READY_WAIT');
      assert.equal(await page.locator('.mfd').count(), 5);
      assert.equal(await page.evaluate(() => window.orion.getStatus().webgl), true);
      assert.equal(
        await page.evaluate(() => {
          const view = document.querySelector('#space-view canvas').getBoundingClientRect();
          const deck = document.querySelector('.instrument-deck').getBoundingClientRect();
          return (
            view.top === 0 &&
            view.height === innerHeight &&
            deck.bottom <= view.bottom &&
            deck.top > view.top &&
            document.documentElement.scrollHeight <= innerHeight
          );
        }),
        true,
        'The instruments must sit inside the full-height pilot view.',
      );
      assert.equal(
        await page.locator('.telemetry-footer').evaluate((element) => {
          const panel = element.closest('.mfd').getBoundingClientRect();
          return element.getBoundingClientRect().bottom <= panel.bottom;
        }),
        true,
      );
      await page.screenshot({ path: '/tmp/orion-desktop.png', fullPage: true });
      await page.locator('#render-quality').selectOption('balanced');
      const initial = await page.evaluate(() => window.orion.getSnapshot());
      await page.getByRole('button', { name: /Siguiente nodo/ }).click();
      await page.waitForFunction(
        () => window.orion.getSnapshot().step === 1 && !window.orion.getStatus().busy,
      );
      assert.equal(
        Number(await page.locator('#g-value').innerText()),
        await page.evaluate(() => window.orion.getSnapshot().g),
      );
      await page.getByRole('button', { name: /Regresar/ }).click();
      await page.waitForFunction(() => !window.orion.getStatus().busy);
      assert.deepEqual(await page.evaluate(() => window.orion.getSnapshot()), initial);
      await page.locator('#speed').selectOption('4');
      await page.getByRole('button', { name: /Piloto automático/ }).click();
      await page.waitForFunction(() => window.orion.getSnapshot().phase === 'CAPTURED_END', null, {
        timeout: 80000,
      });
      const captured = await page.evaluate(() => window.orion.getSnapshot());
      assert.ok(captured.reverseCount > 0);
      assert.ok(captured.report.optimalCost <= captured.g);
      assert.match(await page.locator('#open-content').innerText(), /ÓPTIMO GLOBAL/);
      assert.equal(await page.locator('#step-button').isDisabled(), true);
      await page.screenshot({ path: '/tmp/orion-captured.png', fullPage: true });
      await page.getByRole('button', { name: /Nueva persecución/ }).click();
      await page.waitForFunction(
        () =>
          window.orion.getSnapshot().step === 0 &&
          window.orion.getSnapshot().phase === 'READY_WAIT',
      );
      assert.equal(Number(await page.locator('#g-value').innerText()), 0);
      assert.notEqual(await page.evaluate(() => window.orion.getSnapshot().seed), initial.seed);
      await page.getByRole('button', { name: 'Abrir guía de vuelo' }).click();
      assert.equal(await page.locator('dialog').isVisible(), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('dialog').isVisible(), false);
      await page.locator('#audio-button').click();
      assert.equal(await page.locator('#audio-button').getAttribute('aria-pressed'), 'true');
      await page.locator('#audio-button').click();
      assert.equal(await page.locator('#audio-button').getAttribute('aria-pressed'), 'false');
      await page.locator('#blocked-mode').check();
      await page.locator('#new-button').click();
      await page.waitForFunction(
        () =>
          window.orion.getSnapshot().blocked && window.orion.getSnapshot().phase === 'READY_WAIT',
      );
      for (const width of [360, 741, 768, 1024, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
          `overflow at ${width}px`,
        );
      }
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  },
);

test(
  'blocked mission terminates in the browser and mobile has no horizontal overflow',
  { timeout: 120000 },
  async () => {
    const browser = await launch();
    try {
      const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
        reducedMotion: 'reduce',
        isMobile: true,
        deviceScaleFactor: 1,
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await page.goto(`${baseURL}/?seed=ORION-042&blocked=1&quality=balanced`, {
        waitUntil: 'networkidle',
      });
      await page.waitForFunction(() => window.orion?.getSnapshot().phase === 'READY_WAIT');
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      await page.screenshot({ path: '/tmp/orion-mobile.png', fullPage: true });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight),
        true,
      );
      await page.getByRole('tab', { name: 'VUELO', exact: true }).click();
      assert.equal(await page.locator('#mfd-telemetry').isVisible(), true);
      await page.getByRole('tab', { name: 'VUELO', exact: true }).press('ArrowRight');
      assert.equal(await page.locator('#mfd-scanner').isVisible(), true);
      assert.equal(
        await page.evaluate(() => window.orion.getSnapshot().step),
        0,
        'Switching displays must not advance the ship.',
      );
      await page.getByRole('tab', { name: 'A*', exact: true }).click();
      assert.equal(await page.locator('#mfd-open').isVisible(), true);
      await page.getByRole('tab', { name: 'BITÁCORA', exact: true }).click();
      await page.locator('#speed').selectOption('4');
      await page.getByRole('tab', { name: 'MAPA', exact: true }).click();
      await page.locator('#auto-button').click();
      await page.waitForFunction(() => window.orion.getSnapshot().phase === 'BLOCKED_END', null, {
        timeout: 80000,
      });
      assert.match(await page.locator('#flight-alert').innerText(), /INALCANZABLE/);
      assert.equal(await page.locator('#auto-button').isDisabled(), true);
      await page.locator('#back-button').click();
      await page.waitForFunction(() => !window.orion.getStatus().busy);
      assert.equal(await page.evaluate(() => window.orion.getSnapshot().phase), 'READY_WAIT');
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  },
);
