import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [,, html, out, n, only] = process.argv;
const N = +n;
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
p.on('pageerror', e => console.error('ERR', e.message)); p.on('console', m => console.log(m.text()));
await p.goto('file://' + html);
const c = p.locator('#c');
const frames = only ? only.split(',').map(Number) : [...Array(N).keys()];
for (const i of frames) {
  const t0 = Date.now();
  await p.evaluate((t) => window.draw(t), i / N);
  await c.screenshot({ path: `${out}/f${String(i).padStart(4,'0')}.png` });
  if (i % 20 === 0) console.log(i, Date.now() - t0, 'ms');
}
await b.close();
