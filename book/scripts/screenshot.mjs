// Visual review harness: drives a running preview server and captures every
// page in both themes (plus a mobile pass on key pages).
// Usage:  npm run build && npm run preview &   then:  npm run shoot
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { PAGES } from '../src/pages/registry.js';

const BASE = process.env.SHOOT_BASE || 'http://localhost:5199/';
const OUT = new URL('../shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const MOBILE_PAGES = [0, 1, 4, 6, 14, 17];

const browser = await chromium.launch();
for (const theme of ['dark', 'light']) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 940 } });
  await ctx.addInitScript((t) => localStorage.setItem('mh-theme', t), theme);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  for (const p of PAGES) {
    await page.goto(`${BASE}#p-${p.n}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const n = String(p.n).padStart(2, '0');
    await page.screenshot({ path: `${OUT}p-${n}-${theme}.png`, fullPage: true });
  }
  if (errors.length) {
    console.log(`console errors (${theme}):`);
    for (const e of errors) console.log('  ' + e);
  }
  await ctx.close();
}

const mob = await browser.newContext({ viewport: { width: 375, height: 812 } });
const mpage = await mob.newPage();
for (const n of MOBILE_PAGES) {
  await mpage.goto(`${BASE}#p-${n}`, { waitUntil: 'networkidle' });
  await mpage.waitForTimeout(600);
  await mpage.screenshot({
    path: `${OUT}p-${String(n).padStart(2, '0')}-mobile.png`,
    fullPage: false,
  });
}
await mob.close();
await browser.close();
console.log(`shots written to ${OUT}`);
