// Visual review harness: builds nothing, drives a running preview server, and
// captures every chapter in both themes (plus a mobile pass on key chapters).
// Usage:  npm run build && npm run preview &   then:  npm run shoot
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { CHAPTERS } from '../src/chapters/registry.js';

const BASE = process.env.SHOOT_BASE || 'http://127.0.0.1:5199/';
const OUT = new URL('../shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const MOBILE_CHAPTERS = [0, 1, 5, 9, 18, 22];

const browser = await chromium.launch();
for (const theme of ['dark', 'light']) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 940 } });
  await ctx.addInitScript((t) => localStorage.setItem('mh-theme', t), theme);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[ch?] ${msg.text()}`);
  });
  for (const ch of CHAPTERS) {
    await page.goto(`${BASE}#ch-${ch.n}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    const n = String(ch.n).padStart(2, '0');
    await page.screenshot({ path: `${OUT}ch-${n}-${theme}.png`, fullPage: false });
  }
  if (errors.length) {
    console.log(`console errors (${theme}):`);
    for (const e of errors) console.log('  ' + e);
  }
  await ctx.close();
}

const mob = await browser.newContext({ viewport: { width: 375, height: 812 } });
const mpage = await mob.newPage();
for (const n of MOBILE_CHAPTERS) {
  await mpage.goto(`${BASE}#ch-${n}`, { waitUntil: 'networkidle' });
  await mpage.waitForTimeout(700);
  await mpage.screenshot({
    path: `${OUT}ch-${String(n).padStart(2, '0')}-mobile.png`,
    fullPage: false,
  });
}
await mob.close();
await browser.close();
console.log(`shots written to ${OUT}`);
