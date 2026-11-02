/* Writes fit.json: optical-centering nudges for lopsided glyphs.
 *   node gen.mjs --nofit 1 --out <tmp> && node measure-fit.cjs <tmp>/static
 * Needs playwright-core (+ a chromium): set PLAYWRIGHT_CORE and CHROME env
 * vars, or edit the defaults. Renders each glyph at 8x, takes the true ink
 * bbox, and nudges an axis only when the bbox centre is >0.5px off 12,12.
 * It also grows each glyph (never shrinks) toward the set's ~20px live
 * area, measured as ink: square-ish bodies (ink in 3+ bbox corners, aspect
 * within 0.8-1.25) to SQUARE on the long side, everything else to ROUND;
 * capped at KMAX and so the ink stays inside [EDGE, 24-EDGE]. Entry: [dx, dy] or
 * [dx, dy, k, cx, cy] with (cx, cy) the ink centre the scale is about. */
const fs = require("fs"), path = require("path");
const pw = require(process.env.PLAYWRIGHT_CORE || "playwright-core");
const dir = path.resolve(process.argv[2]);
const THRESH = 0.5, MAXSHIFT = 8, SNAP = 0.25;
const KMAX = 1.25, EDGE = 1.1, ROUND = 21.6, SQUARE = 20.4;
(async () => {
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME });
  const p = await b.newPage();
  const names = fs.readdirSync(dir).filter((f) => f.endsWith(".svg")).map((f) => f.slice(0, -4));
  const svgs = {};
  for (const n of names) svgs[n] = fs.readFileSync(path.join(dir, n + ".svg"), "utf8").replace(/currentColor/g, "#000");
  const ink = await p.evaluate(async (svgs) => {
    const out = {}, S = 8, W = 192;
    const c = document.createElement("canvas"); c.width = W; c.height = W;
    const x = c.getContext("2d", { willReadFrequently: true });
    for (const [n, s] of Object.entries(svgs)) {
      const img = new Image();
      img.src = "data:image/svg+xml;utf8," + encodeURIComponent(s.replace('width="24" height="24"', `width="${W}" height="${W}"`));
      await img.decode(); x.clearRect(0, 0, W, W); x.drawImage(img, 0, 0, W, W);
      const d = x.getImageData(0, 0, W, W).data;
      let x0 = W, y0 = W, x1 = 0, y1 = 0;
      const on = (i, j) => d[(j * W + i) * 4 + 3] > 40;
      for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) if (on(i, j)) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
      // corners with ink: a 20% box in each bbox corner
      const cw = Math.max(2, Math.round((x1 - x0) * 0.2)), chh = Math.max(2, Math.round((y1 - y0) * 0.2));
      let corners = 0;
      for (const [ci, cj] of [[x0, y0], [x1 - cw, y0], [x0, y1 - chh], [x1 - cw, y1 - chh]]) {
        let hit = 0;
        for (let j = cj; j <= cj + chh; j++) for (let i = ci; i <= ci + cw; i++) if (on(i, j)) hit++;
        if (hit > cw * chh * 0.08) corners++;
      }
      out[n] = [x0 / S, y0 / S, (x1 + 1) / S, (y1 + 1) / S, corners];
    }
    return out;
  }, svgs);
  await b.close();
  const snap = (v) => Math.round(v / SNAP) * SNAP;
  const fit = {};
  for (const n of names.sort()) {
    const [x0, y0, x1, y1, corners] = ink[n];
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, w = x1 - x0, h = y1 - y0;
    let dx = 12 - cx, dy = 12 - cy;
    dx = Math.abs(dx) > THRESH ? snap(Math.max(-MAXSHIFT, Math.min(MAXSHIFT, dx))) : 0;
    dy = Math.abs(dy) > THRESH ? snap(Math.max(-MAXSHIFT, Math.min(MAXSHIFT, dy))) : 0;
    const aspect = w / h;
    const square = corners >= 3 && aspect > 0.8 && aspect < 1.25;
    let k = square ? SQUARE / Math.max(w, h) : Math.min(ROUND / w, ROUND / h);
    const ncx = cx + dx, ncy = cy + dy;
    k = Math.min(k, KMAX, (ncx - EDGE) / (w / 2), (24 - EDGE - ncx) / (w / 2), (ncy - EDGE) / (h / 2), (24 - EDGE - ncy) / (h / 2));
    k = Math.floor(k * 100) / 100;
    if (k > 1.005) fit[n] = [dx, dy, k, +cx.toFixed(2), +cy.toFixed(2)];
    else if (dx || dy) fit[n] = [dx, dy];
  }
  fs.writeFileSync(path.join(__dirname, "fit.json"), JSON.stringify(fit, null, 1) + "\n");
  console.log("fit entries:", Object.keys(fit).length);
})();
