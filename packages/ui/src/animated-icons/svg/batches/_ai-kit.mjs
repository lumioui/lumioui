/* Shared drawing kit for the ai-* family (software-01/02). Files starting
 * with "_" are not batches — gen.mjs skips them; the batches import this so
 * every sparkle, chip, bulb and brain is the same drawing. The conventions
 * live in STYLE.md → "Accents and badges". */

export const path = (d, a = {}) => ({ e: "path", a: { d, ...a } });
export const circle = (cx, cy, r, a = {}) => ({ e: "circle", a: { cx, cy, r, ...a } });
export const line = (x1, y1, x2, y2, a = {}) => ({ e: "line", a: { x1, y1, x2, y2, ...a } });
export const rect = (x, y, w, h, rx, a = {}) => ({ e: "rect", a: { x, y, width: w, height: h, rx, ...a } });
export const fill = (color = "currentColor") => ({ fill: color, stroke: "none" });
export const A = (part, anims) => ({ ...part, anims });
export const G = (id, children, a = {}) => ({ e: "g", g: id, a, children });
export const an = (attr, values, times) => ({ kind: "attr", attr, values, times });
export const tn = (type, values, times, extra = {}) => ({ kind: "transform", type, values, times, ...extra });

export const P = (n) => +(+n).toFixed(2);

/* ---------- the sparkle ---------- */

/** Hero star (the sparkle *is* the subject): quadratic arms pinched to
 *  `k` of the radius, drawn as a plain stroke. */
export function sparkD(cx, cy, r, k = 0.2) {
  const q = r * k;
  return `M${P(cx)} ${P(cy - r)}Q${P(cx + q)} ${P(cy - q)} ${P(cx + r)} ${P(cy)}` +
    `Q${P(cx + q)} ${P(cy + q)} ${P(cx)} ${P(cy + r)}` +
    `Q${P(cx - q)} ${P(cy + q)} ${P(cx - r)} ${P(cy)}` +
    `Q${P(cx - q)} ${P(cy - q)} ${P(cx)} ${P(cy - r)}Z`;
}

/** Outlined four-point star: cubic arms with a soft waist (w = 0.36 r),
 *  stroked like every other line — no fill, so it never blots at 16px. */
export function starD(cx, cy, r) {
  const w = r * 0.36;
  const p = (x, y) => `${P(cx + x)} ${P(cy + y)}`;
  return `M${p(0, -r)}C${p(w * 0.4, -w)} ${p(w, -w * 0.4)} ${p(r, 0)}` +
    `C${p(w, w * 0.4)} ${p(w * 0.4, w)} ${p(0, r)}` +
    `C${p(-w * 0.4, w)} ${p(-w, w * 0.4)} ${p(-r, 0)}` +
    `C${p(-w, -w * 0.4)} ${p(-w * 0.4, -w)} ${p(0, -r)}Z`;
}
export const star = (cx, cy, r, a = {}) => path(starD(cx, cy, r), a);

/** The sparkle flick: one quick rotate-glitter around the star's own
 *  centre, held quiet before and after. */
export const twinkle = (cx, cy, t0 = 0.3) => [
  tn("rotate", [`0 ${cx} ${cy}`, `20 ${cx} ${cy}`, `-14 ${cx} ${cy}`, `0 ${cx} ${cy}`], [0, t0, Math.min(0.72, t0 + 0.3), 1]),
];

/** The badge slot: top-right, one size for the whole family. CLR is the
 *  radius host strokes keep from its centre (tip 3.4 + stroke + ~1.5 air). */
export const BX = 17.6, BY = 6.4, BR = 3.4, CLR = 6.2;
export const badge = (t0 = 0.3) => A(star(BX, BY, BR), twinkle(BX, BY, t0));
/** A secondary sparkle — optional, at most one per glyph. */
export const mini = (cx, cy, t0 = 0.5) => A(star(cx, cy, 2.4), twinkle(cx, cy, t0));

/** Where a horizontal edge at `y` (or vertical edge at `x`) leaves the
 *  badge's clearance circle — the host stroke ends there with a round cap. */
export const gapX = (y) => P(BX - Math.sqrt(Math.max(0, CLR * CLR - (y - BY) ** 2)));
export const gapY = (x) => P(BY + Math.sqrt(Math.max(0, CLR * CLR - (x - BX) ** 2)));

/** Rounded rect opened at its top-right corner around the badge. */
export function openRect(x, y, w, h, r) {
  const R = x + w, B = y + h;
  return `M${gapX(y)} ${P(y)}H${P(x + r)}A${r} ${r} 0 0 0 ${P(x)} ${P(y + r)}V${P(B - r)}` +
    `A${r} ${r} 0 0 0 ${P(x + r)} ${P(B)}H${P(R - r)}A${r} ${r} 0 0 0 ${P(R)} ${P(B - r)}V${gapY(R)}`;
}

/** Circle (cx, cy, r) as an arc that opens around the badge clearance. */
export function ringOpen(cx, cy, r, clr = CLR, bx = BX, by = BY) {
  const dx = bx - cx, dy = by - cy, d = Math.hypot(dx, dy);
  if (d >= r + clr || d <= Math.abs(r - clr)) return `M${P(cx - r)} ${P(cy)}a${r} ${r} 0 1 0 ${P(2 * r)} 0a${r} ${r} 0 1 0 ${P(-2 * r)} 0`;
  const a = (r * r - clr * clr + d * d) / (2 * d), h = Math.sqrt(r * r - a * a);
  const mx = cx + (a * dx) / d, my = cy + (a * dy) / d;
  const p1 = [mx + (h * dy) / d, my - (h * dx) / d], p2 = [mx - (h * dy) / d, my + (h * dx) / d];
  const t1 = Math.atan2(p1[1] - cy, p1[0] - cx), t2 = Math.atan2(p2[1] - cy, p2[0] - cx);
  const delta = (((t2 - t1) * 180) / Math.PI + 720) % 360;
  return `M${P(p1[0])} ${P(p1[1])}A${r} ${r} 0 1 ${delta > 180 ? 1 : 0} ${P(p2[0])} ${P(p2[1])}`;
}

/* ---------- shared bodies ---------- */

/** Small chip: rounded die with one pin per side (two pins blob under 6px). */
export function chip(cx, cy, s = 5, pin = 1.7) {
  const h = s / 2;
  return [
    rect(P(cx - h), P(cy - h), s, s, P(s * 0.26)),
    path(`M${P(cx)} ${P(cy - h - pin)}V${P(cy - h)}M${P(cx)} ${P(cy + h)}V${P(cy + h + pin)}M${P(cx - h - pin)} ${P(cy)}H${P(cx - h)}M${P(cx + h)} ${P(cy)}H${P(cx + h + pin)}`),
  ];
}

/** Brain outline: four round lobes a side meeting at the top and bottom
 *  centre notches. Lobes are arcs so every bump is the same soft curve. */
const LOBES = [
  [12, 6],
  [6.6, 6.2, 3],
  [4, 12, 3.4],
  [6.8, 18.4, 3.6],
  [12, 18.6, 2.8],
];
export function brainHalf(side = -1, cx = 12) {
  const X = (x) => P(cx + (x - 12) * -side);
  let d = `M${X(LOBES[0][0])} ${LOBES[0][1]}`;
  for (let i = 1; i < LOBES.length; i++) {
    const [x, y, r] = LOBES[i];
    d += `A${r} ${r} 0 0 ${side < 0 ? 0 : 1} ${X(x)} ${y}`;
  }
  return d;
}
export const BRAIN = (() => {
  // left half top→bottom, then right half bottom→top
  let d = brainHalf(-1);
  for (let i = LOBES.length - 2; i >= 0; i--) {
    const r = LOBES[i + 1][2];
    const [x, y] = LOBES[i];
    d += `A${r} ${r} 0 0 0 ${P(24 - x)} ${y}`;
  }
  return d + "Z";
})();

/** The two points where circle (cx, cy, r) crosses the badge clearance,
 *  ordered clockwise (y-down): [start of the gap, end of the gap]. */
export function cutPoints(cx, cy, r, clr = CLR) {
  const dx = BX - cx, dy = BY - cy, d = Math.hypot(dx, dy);
  const a = (r * r - clr * clr + d * d) / (2 * d), h = Math.sqrt(r * r - a * a);
  const mx = cx + (a * dx) / d, my = cy + (a * dy) / d;
  const p1 = [P(mx + (h * dy) / d), P(my - (h * dx) / d)], p2 = [P(mx - (h * dy) / d), P(my + (h * dx) / d)];
  return [p1, p2];
}

/** Light bulb: glass circle (12, 9.4) r 6.2 necking into a closed collar
 *  at y 17, cap line at 20.5. `open` breaks the glass around the badge. */
export function bulb(open = false, clr = CLR) {
  const neckL = "M9.3 17v-.5c0-1-.6-1.8-1.3-2.4";
  const neckR = "c-.7.6-1.3 1.4-1.3 2.4v.5";
  if (!open) return [path(`${neckL}A6.2 6.2 0 1 1 16 14.1${neckR}H9.3z`), line(10.2, 20.5, 13.8, 20.5)];
  const [g0, g1] = cutPoints(12, 9.36, 6.2, clr);
  return [
    path(`M14.7 17H9.3v-.5c0-1-.6-1.8-1.3-2.4A6.2 6.2 0 0 1 ${g0[0]} ${g0[1]}`),
    path(`M${g1[0]} ${g1[1]}A6.2 6.2 0 0 1 16 14.1${neckR}`),
    line(10.2, 20.5, 13.8, 20.5),
  ];
}
