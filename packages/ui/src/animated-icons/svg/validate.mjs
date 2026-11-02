#!/usr/bin/env node
/* Lumio icon validator — geometry sanity + optical-mass checks on the
 * emitted static SVGs. Usage: node validate.mjs [dir] [--only a,b,c]
 * Exits 1 on any error; warnings don't fail the run. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve relative dirs against this file's location so the gate runs
// identically from the svg/ dir, repo root, or CI.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const dirArg = process.argv[2] ?? "static";
const dir = path.isAbsolute(dirArg) ? dirArg : path.join(HERE, dirArg);
const only = process.argv.includes("--only")
  ? new Set(process.argv[process.argv.indexOf("--only") + 1].split(","))
  : null;

const NUM = /-?\d*\.?\d+(?:e-?\d+)?/gi;
const TAG = /<(path|circle|line|rect|ellipse|polyline|polygon)\b[^>]*/g;
const ATTR = /([\w-]+)="([^"]*)"/g;

/** Walk a `d` string and return absolute [x,y] points of every
 *  on-curve endpoint + control point (approximate bounds, not exact
 *  Bézier hulls — fine for a lint gate). */
function pathPoints(d) {
  const pts = [];
  const tok = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  let i = 0, x = 0, y = 0, sx = 0, sy = 0, cmd = null;
  const num = () => +tok[i++];
  while (i < tok.length) {
    if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
    if (!cmd) break;
    const rel = cmd >= "a" && cmd <= "z";
    const C = cmd.toUpperCase();
    const P = (nx, ny) => {
      const px = rel ? x + nx : nx, py = rel ? y + ny : ny;
      pts.push([px, py]);
      return [px, py];
    };
    if (C === "M" || C === "L" || C === "T") { [x, y] = P(num(), num()); if (C === "M") { sx = x; sy = y; } }
    else if (C === "H") { x = rel ? x + num() : num(); pts.push([x, y]); }
    else if (C === "V") { y = rel ? y + num() : num(); pts.push([x, y]); }
    else if (C === "C") { P(num(), num()); P(num(), num()); [x, y] = P(num(), num()); }
    else if (C === "S") { P(num(), num()); [x, y] = P(num(), num()); }
    else if (C === "Q") { P(num(), num()); [x, y] = P(num(), num()); }
    else if (C === "A") { num(); num(); num(); num(); num(); [x, y] = P(num(), num()); }
    else if (C === "Z") { x = sx; y = sy; }
    else break;
  }
  return pts;
}

let errors = 0, warnings = 0, checked = 0;
const fail = (f, m) => { errors++; console.log(`ERR  ${f}: ${m}`); };
const warn = (f, m) => { warnings++; console.log(`warn ${f}: ${m}`); };

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
  const name = file.slice(0, -4);
  if (only && !only.has(name)) continue;
  checked++;
  const src = fs.readFileSync(path.join(dir, file), "utf8");
  const tags = src.match(TAG) ?? [];
  if (!tags.length) fail(name, "no shape elements");
  let minX = 99, minY = 99, maxX = -99, maxY = -99, hasFill = false;
  for (const t of tags) {
    const at = Object.fromEntries([...t.matchAll(ATTR)].map(([, k, v]) => [k, v]));
    if (at.stroke === "none") hasFill = true;
    // gather absolute points: real path-walk for d, pairs for points,
    // center±radius for circle/ellipse, corner box for rect/line.
    let pts = [];
    if (at.d) pts = pathPoints(at.d);
    else if (at.points) {
      const n = at.points.match(NUM).map(Number);
      for (let j = 0; j + 1 < n.length; j += 2) pts.push([n[j], n[j + 1]]);
    } else {
      if (at.cx !== undefined) {
        const rx = +(at.r ?? at.rx ?? 0), ry = +(at.r ?? at.ry ?? 0);
        pts.push([+at.cx - rx, +at.cy - ry], [+at.cx + rx, +at.cy + ry]);
      } else if (at.x !== undefined) {
        pts.push([+at.x, +at.y], [+at.x + +(at.width ?? 0), +at.y + +(at.height ?? 0)]);
      } else if (at.x1 !== undefined) {
        pts.push([+at.x1, +at.y1], [+at.x2, +at.y2]);
      }
    }
    if (pts.some(([a, b]) => Number.isNaN(a) || Number.isNaN(b))) fail(name, `NaN coordinate in <${t.slice(0, 40)}…>`);
    for (const [px, py] of pts) {
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    }
    if (at.d && !/^M/.test(at.d.trim())) fail(name, "path doesn't start with M");
  }
  // gen.mjs may wrap everything in one optical-fit
  // <g transform="translate(tx ty)[ scale(k)]"> — check the placed geometry.
  const fit = src.match(/^<svg[^>]*><g transform="translate\((-?[\d.]+) (-?[\d.]+)\)(?: scale\(([\d.]+)\))?">/);
  // (Skipped when an inner transform exists: those parts are authored
  // in another frame, so raw points can't be placed by the root alone.)
  const nested = (src.match(/transform="/g) ?? []).length > (fit ? 1 : 0);
  if (fit && !nested) {
    const tx = +fit[1], ty = +fit[2], k = fit[3] ? +fit[3] : 1;
    minX = tx + k * minX; maxX = tx + k * maxX; minY = ty + k * minY; maxY = ty + k * maxY;
  }
  const w = maxX - minX, h = maxY - minY;
  if (minX < 0.5 || minY < 0.5 || maxX > 23.5 || maxY > 23.5)
    fail(name, `overflows viewBox: ${minX.toFixed(1)},${minY.toFixed(1)} → ${maxX.toFixed(1)},${maxY.toFixed(1)}`);
  if (w < 7 || h < 7) warn(name, `tiny optical size ${w.toFixed(1)}×${h.toFixed(1)}`);
  if (w > 22 || h > 22) warn(name, `oversized ${w.toFixed(1)}×${h.toFixed(1)}`);
  if (tags.length > 9) warn(name, `${tags.length} elements — too busy at 24px`);
}
// Cross-set completeness — a glyph registered in gen lands in static/animated
// on the next `node gen.mjs`, but thin/bold files and all three sprites only
// refresh on a `gen --sw` re-run. Drift showed up as icon-lab 404s; check the
// sibling sets + sprites whenever the canonical set is validated in full.
if (path.basename(dir) === "static" && path.dirname(dir) === HERE && !only) {
  const canon = new Set(fs.readdirSync(dir).filter((f) => f.endsWith(".svg")).map((f) => f.slice(0, -4)));
  const spriteNames = (p) => {
    try { return new Set([...fs.readFileSync(p, "utf8").matchAll(/symbol id="i-([a-z0-9-]+)"/g)].map((m) => m[1])); }
    catch { return new Set(); }
  };
  const sets = [
    ["animated", path.join(HERE, "animated")],
    ["thin/static", path.join(HERE, "thin", "static")],
    ["thin/animated", path.join(HERE, "thin", "animated")],
    ["bold/static", path.join(HERE, "bold", "static")],
    ["bold/animated", path.join(HERE, "bold", "animated")],
  ];
  for (const [label, d] of sets) {
    const have = new Set(fs.readdirSync(d).filter((f) => f.endsWith(".svg")).map((f) => f.slice(0, -4)));
    const missing = [...canon].filter((n) => !have.has(n));
    if (missing.length) fail(`[${label}]`, `missing ${missing.length} glyph(s): ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? "…" : ""} — run \`node gen.mjs --sw <w> --out <weight>\``);
  }
  for (const [label, p] of [["sprite.svg", path.join(HERE, "sprite.svg")], ["thin/sprite.svg", path.join(HERE, "thin", "sprite.svg")], ["bold/sprite.svg", path.join(HERE, "bold", "sprite.svg")]]) {
    const have = spriteNames(p);
    const missing = [...canon].filter((n) => !have.has(n));
    if (missing.length) fail(`[${label}]`, `missing ${missing.length} symbol(s): ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? "…" : ""} — regenerate with \`node gen.mjs --sw <w> --out <weight>\``);
  }
}
console.log(`\n${checked} checked · ${errors} errors · ${warnings} warnings`);
process.exit(errors ? 1 : 0);
