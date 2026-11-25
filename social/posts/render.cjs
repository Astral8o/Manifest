// Renders every slides.html into numbered PNGs (1080x1350). Run with NODE_PATH=$(npm root -g) node render.cjs
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const dir of fs.readdirSync(__dirname).filter((d) => /^\d\d-/.test(d)).sort()) {
    await p.goto('file://' + path.join(__dirname, dir, 'slides.html')); await p.waitForTimeout(1500);
    const slides = await p.$$('.s');
    for (let i = 0; i < slides.length; i++) await slides[i].screenshot({ path: path.join(__dirname, dir, `${dir}-${String(i + 1).padStart(2, '0')}.png`) });
    console.log(dir, slides.length);
  }
  await b.close();
})();
