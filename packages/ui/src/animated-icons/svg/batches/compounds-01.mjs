const path = (d, a = {}) => ({ e: "path", a: { d, ...a } });
const circle = (cx, cy, r, a = {}) => ({ e: "circle", a: { cx, cy, r, ...a } });
const line = (x1, y1, x2, y2, a = {}) => ({ e: "line", a: { x1, x2, y1, y2, ...a } });
const rect = (x, y, w, h, rx, a = {}) => ({ e: "rect", a: { x, y, width: w, height: h, rx, ...a } });
const ellipse = (cx, cy, rx, ry, a = {}) => ({ e: "ellipse", a: { cx, cy, rx, ry, ...a } });
const fill = (color = "currentColor") => ({ fill: color, stroke: "none" });
const A = (part, anims) => ({ ...part, anims });
const G = (id, children, a = {}) => ({ e: "g", g: id, a, children });
const an = (attr, values, times) => ({ kind: "attr", attr, values, times });
const tn = (type, values, times, extra = {}) => ({ kind: "transform", type, values, times, ...extra });

/* ---- bespoke gesture idioms -------------------------------------------
   HOLD phrasing: rest ~30%, act mid-cycle, settle back. Seamless loops. */
const HOLD = [0, 0.3, 0.55, 0.8, 1];
/* scale-pop around a mark's own center (sAnims entry). */
const POP = (cx, cy, s = 1.24) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], HOLD),
});
/* wiggle — rotate −a then +a around a pivot, with rest holds. */
const WIG = (cx, cy, a = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `0 ${cx} ${cy}`, `-${a} ${cx} ${cy}`, `${a - 2} ${cx} ${cy}`, `0 ${cx} ${cy}`], HOLD);
/* dip — translate out along an axis and spring back (for gAnims). */
const DIP = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD);
/* nudge one part along an axis, then spring back (for A()). */
const SHIFT = (p, dx, dy, t = HOLD) =>
  A(p, [tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], t)]);
/* trace — the stroke writes itself on; pathLength=1 normalizes. */
const DRAW = (p, t0 = 0.15, t1 = 0.62) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } },
    [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1])]);

/* ---- compounds-01 idioms ----------------------------------------------
   DSH: draw-on, then slide out and settle back — the "snap into place"
   gesture for align bars, arrows and chevrons. */
const DSH = (p, dx, dy) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } }, [
    an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.06, 0.38, 1]),
    tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], [0, 0.5, 0.65, 0.8, 1]),
  ]);
/* FLOAT: draw-on, then drift −a/+a on one axis — a lone element floating
   in its space (space-around variants). */
const FLOAT = (p, dx, dy) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } }, [
    an("stroke-dashoffset", ["1", "1", "0", "0"], [0, 0.06, 0.38, 1]),
    tn("translate", ["0 0", "0 0", `${-dx} ${-dy}`, `${dx} ${dy}`, "0 0"], [0, 0.45, 0.62, 0.78, 1]),
  ]);
/* GROW: bar grows upward from a shared baseline (draw-on that reads as a
   column chart animating in). */
const GROW = (x, top, s = 0.1, bot = 21) =>
  A(line(x, top, x, bot), [an("y1", [bot, bot, top, top], [0, s, s + 0.35, 1])]);
/* GROWR: bar stretches rightward from a shared rail (gantt rows). */
const GROWR = (x1, x2, y, s = 0.1) =>
  A(line(x1, y, x2, y), [an("x2", [x1, x1, x2, x2], [0, s, s + 0.35, 1])]);
/* DASHED: dashed-frame attr preset — the dash lives in the element attrs so
   the static file keeps it; always pair with DDRAW (or another explicit
   anim) so the auto draw-on doesn't overwrite the pattern. */
const DASHED = { "stroke-dasharray": "3 2.5" };
/* DDRAW: write-on for dashed frames — the dasharray itself grows from a
   0-length dash (invisible) into the pattern, the dashed equivalent of the
   standard draw-on. Ping-pong dissolves it back. */
const DDRAW = (p) =>
  A(p, [an("stroke-dasharray", ["0 40", "3 2.5", "3 2.5"], [0, 0.45, 1])]);

/* compounds-01 — 69 glyphs: coverage gaps. Align/distribute
 * families, BASE+BADGE compounds, dashed variants, arrow-out escapes,
 * receipt currencies, tally counts. Soft silhouettes, stroke 2,
 * live area [2.5, 21.5]. */

/* shared silhouettes */
const FOLDER =
  "M3.6 18.6L3.6 6.2C3.6 5 4.6 4 5.8 4L9.6 4C10.2 4 10.7 4.2 11.1 4.7L12.1 5.9C12.5 6.4 13 6.6 13.6 6.6L18.2 6.6C19.4 6.6 20.4 7.6 20.4 8.9L20.4 18.6C20.4 19.8 19.4 20.8 18.2 20.8L5.8 20.8C4.6 20.8 3.6 19.8 3.6 18.6Z";
const RECEIPT =
  "M6 3.4L18 3.4C18.6 3.4 19 3.8 19 4.4L19 20.4L17.2 19.2L15.4 20.4L13.6 19.2L11.8 20.4L10 19.2L8.2 20.4L6.4 19.2L4.6 20.4L4.6 4.4C4.6 3.8 5 3.4 5.6 3.4Z";
const PIN =
  "M12 21.5S19.3 15.4 19.3 10.2A7.3 7.3 0 1 0 4.7 10.2C4.7 15.4 12 21.5 12 21.5Z";
/* grid frame open at bottom-right for a badge (grid2x2-* convention) */
const GRID_BADGE =
  "M12 21C7.8 21 5.7 21 4.3 19.75C3 18.4 3 16.2 3 12C3 7.8 3 5.7 4.3 4.25C5.7 3 7.8 3 12 3C16.2 3 18.3 3 19.7 4.25C21 5.6 21 7.8 21 12";
const TICKET =
  "M4.5 7.6L19.5 7.6C20 7.6 20.4 8 20.4 8.5L20.4 10.2C19 10.8 18 12.1 18 13.6S19 16.4 20.4 17L20.4 18.7C20.4 19.2 20 19.6 19.5 19.6L4.5 19.6C4 19.6 3.6 19.2 3.6 18.7L3.6 17C5 16.4 6 15.1 6 13.6S5 10.8 3.6 10.2L3.6 8.5C3.6 8 4 7.6 4.5 7.6Z";
const BUBBLE_C = "M8.6 19.6A8.6 8.6 0 1 0 4.5 16.1L3.3 21.2Z";
const BUBBLE_S =
  "M5.4 4.8L18.6 4.8C20 4.8 21.1 5.9 21.1 7.3L21.1 15.3C21.1 16.7 20 17.8 18.6 17.8L13.6 17.8Q8.6 17.8 6.4 19.4L4.2 21C3.7 21.4 3 21.1 3 20.4L3 7.3C3 5.9 4.1 4.8 5.4 4.8Z";
const CURSOR =
  "M4.4 4.2L12.3 7.9C12.5 8 12.5 8.4 12.3 8.5L10.6 9Q8.9 9.5 8.55 11.15L8.2 12.8C8 13.1 7.7 13 7.5 12.8L4.1 4.6C4 4.3 4.2 4.2 4.4 4.2Z";
/* align bars — vertical family uses them standing up, horizontal lying down */
const HB_TALL = rect(4.2, 5.2, 6, 13.6, 2.2);
const HB_SHORT = rect(13.8, 7, 6, 10, 2.2);
const VB_TALL = rect(5.2, 4.4, 13.6, 6, 2.2);
const VB_SHORT = rect(7, 13.8, 10, 6, 2.2);

export const icons = {
  /* ============ A + arrow ============ */
  "a-arrow-down": {
    dur: 1.6,
    parts: [
      path("M3.2 16.4L7.6 6.6C7.9 6 8.6 6 8.9 6.6L13.3 16.4"),
      line(4.9, 13, 11.6, 13),
      G("arr", [line(17.9, 7.6, 17.9, 16.6), path("M14.7 12.8L17.9 16.6L21.1 12.8")]),
    ],
    gAnims: { arr: DIP(0, 0.9) },
  },
  "a-arrow-up": {
    dur: 1.6,
    parts: [
      path("M3.2 16.4L7.6 6.6C7.9 6 8.6 6 8.9 6.6L13.3 16.4"),
      line(4.9, 13, 11.6, 13),
      G("arr", [line(17.9, 16.6, 17.9, 7.6), path("M14.7 11.4L17.9 7.6L21.1 11.4")]),
    ],
    gAnims: { arr: DIP(0, -0.9) },
  },

  /* ============ align-horizontal-* (bars stand, guides vertical) ============ */
  "align-horizontal-distribute-center": {
    dur: 1.7,
    parts: [
      DSH(HB_TALL, -0.7, 0),
      DSH(HB_SHORT, 0.7, 0),
      line(7.2, 3.2, 7.2, 5.2),
      line(7.2, 18.8, 7.2, 20.8),
      line(16.8, 3.2, 16.8, 7),
      line(16.8, 17, 16.8, 20.8),
    ],
  },
  "align-horizontal-distribute-end": {
    dur: 1.7,
    parts: [
      line(10.4, 3.2, 10.4, 20.8),
      line(20.2, 3.2, 20.2, 20.8),
      DSH(rect(4.4, 5.2, 6, 13.6, 2.2), 0.7, 0),
      DSH(rect(14.2, 7, 6, 10, 2.2), 0.7, 0),
    ],
  },
  "align-horizontal-distribute-start": {
    dur: 1.7,
    parts: [
      line(4.6, 3.2, 4.6, 20.8),
      line(14.2, 3.2, 14.2, 20.8),
      DSH(rect(4.6, 5.2, 6, 13.6, 2.2), -0.7, 0),
      DSH(rect(14.2, 7, 6, 10, 2.2), -0.7, 0),
    ],
  },
  "align-horizontal-justify-center": {
    dur: 1.7,
    parts: [
      line(12, 3.2, 12, 20.8),
      DSH(rect(2.6, 5.2, 6, 13.6, 2.2), 0.7, 0),
      DSH(rect(15.4, 7, 6, 10, 2.2), -0.7, 0),
    ],
  },
  "align-horizontal-justify-end": {
    dur: 1.7,
    parts: [
      line(20.6, 3.2, 20.6, 20.8),
      DSH(rect(2.6, 5.2, 6, 13.6, 2.2), 0.7, 0),
      DSH(rect(12.2, 7, 6, 10, 2.2), 0.7, 0),
    ],
  },
  "align-horizontal-justify-start": {
    dur: 1.7,
    parts: [
      line(3.4, 3.2, 3.4, 20.8),
      DSH(rect(5.6, 5.2, 6, 13.6, 2.2), -0.7, 0),
      DSH(rect(15.2, 7, 6, 10, 2.2), -0.7, 0),
    ],
  },
  "align-horizontal-space-around": {
    dur: 1.7,
    parts: [
      line(4.4, 3.2, 4.4, 20.8),
      line(19.6, 3.2, 19.6, 20.8),
      FLOAT(rect(9, 7, 6, 10, 2.2), 0.8, 0),
    ],
  },
  "align-horizontal-space-between": {
    dur: 1.7,
    parts: [
      line(3.4, 3.2, 3.4, 20.8),
      line(20.6, 3.2, 20.6, 20.8),
      DSH(rect(3.4, 5.2, 6, 13.6, 2.2), -0.7, 0),
      DSH(rect(14.6, 7, 6, 10, 2.2), 0.7, 0),
    ],
  },

  /* ============ align-vertical-* (bars lie, guides horizontal) ============ */
  "align-vertical-distribute-center": {
    dur: 1.7,
    parts: [
      DSH(VB_TALL, 0, -0.7),
      DSH(VB_SHORT, 0, 0.7),
      line(3.4, 7.2, 5.2, 7.2),
      line(18.8, 7.2, 20.6, 7.2),
      line(3.4, 16.8, 7, 16.8),
      line(17, 16.8, 20.6, 16.8),
    ],
  },
  "align-vertical-distribute-end": {
    dur: 1.7,
    parts: [
      line(3.4, 10.4, 20.6, 10.4),
      line(3.4, 20.2, 20.6, 20.2),
      DSH(rect(5.2, 4.4, 13.6, 6, 2.2), 0, 0.7),
      DSH(rect(7, 14.2, 10, 6, 2.2), 0, 0.7),
    ],
  },
  "align-vertical-distribute-start": {
    dur: 1.7,
    parts: [
      line(3.4, 4.6, 20.6, 4.6),
      line(3.4, 14.2, 20.6, 14.2),
      DSH(rect(5.2, 4.6, 13.6, 6, 2.2), 0, -0.7),
      DSH(rect(7, 14.2, 10, 6, 2.2), 0, -0.7),
    ],
  },
  "align-vertical-justify-center": {
    dur: 1.7,
    parts: [
      line(3.4, 12, 20.6, 12),
      DSH(rect(7, 3.6, 10, 6, 2.2), 0, 0.7),
      DSH(rect(5, 15.4, 14, 6, 2.2), 0, -0.7),
    ],
  },
  "align-vertical-justify-end": {
    dur: 1.7,
    parts: [
      line(3.4, 20.6, 20.6, 20.6),
      DSH(rect(7, 3.6, 10, 6, 2.2), 0, 0.7),
      DSH(rect(5, 11.4, 14, 6, 2.2), 0, 0.7),
    ],
  },
  "align-vertical-justify-start": {
    dur: 1.7,
    parts: [
      line(3.4, 3.4, 20.6, 3.4),
      DSH(rect(7, 5.8, 10, 6, 2.2), 0, -0.7),
      DSH(rect(5, 15.8, 14, 6, 2.2), 0, -0.7),
    ],
  },
  "align-vertical-space-around": {
    dur: 1.7,
    parts: [
      line(3.4, 4.4, 20.6, 4.4),
      line(3.4, 19.6, 20.6, 19.6),
      FLOAT(rect(7, 9.2, 10, 5.6, 2.2), 0, 0.8),
    ],
  },
  "align-vertical-space-between": {
    dur: 1.7,
    parts: [
      line(3.4, 3.4, 20.6, 3.4),
      line(3.4, 20.6, 20.6, 20.6),
      DSH(rect(5.2, 3.4, 13.6, 6, 2.2), 0, -0.7),
      DSH(rect(7, 14.6, 10, 6, 2.2), 0, 0.7),
    ],
  },

  /* ============ between-* (paired bars + entry chevron) ============ */
  "between-horizontal-end": {
    dur: 1.6,
    parts: [
      rect(3, 3.6, 13, 6.6, 1.4),
      rect(3, 13.8, 13, 6.6, 1.4),
      DSH(path("M20.6 9.6L17.8 12L20.6 14.4"), -0.9, 0),
    ],
  },
  "between-horizontal-start": {
    dur: 1.6,
    parts: [
      rect(8, 3.6, 13, 6.6, 1.4),
      rect(8, 13.8, 13, 6.6, 1.4),
      DSH(path("M3.4 9.6L6.2 12L3.4 14.4"), 0.9, 0),
    ],
  },
  "between-vertical-end": {
    dur: 1.6,
    parts: [
      rect(3.6, 3, 6.6, 13, 1.4),
      rect(13.8, 3, 6.6, 13, 1.4),
      DSH(path("M9.6 20.6L12 17.8L14.4 20.6"), 0, -0.9),
    ],
  },
  "between-vertical-start": {
    dur: 1.6,
    parts: [
      rect(3.6, 8, 6.6, 13, 1.4),
      rect(13.8, 8, 6.6, 13, 1.4),
      DSH(path("M9.6 3.4L12 6.2L14.4 3.4"), 0, 0.9),
    ],
  },

  /* ============ charts (no axes — columns grow from a baseline) ============ */
  "chart-no-axes-column-decreasing": {
    dur: 1.6,
    auto: false,
    parts: [GROW(5, 4.5, 0.08), GROW(12, 9.5, 0.2), GROW(19, 14.5, 0.32)],
  },
  "chart-no-axes-column-increasing": {
    dur: 1.6,
    auto: false,
    parts: [GROW(5, 14.5, 0.08), GROW(12, 9.5, 0.2), GROW(19, 4.5, 0.32)],
  },
  "chart-no-axes-combined": {
    dur: 1.8,
    auto: false,
    parts: [
      GROW(4.5, 18.5, 0.06),
      GROW(8.2, 14.5, 0.12),
      GROW(12, 16, 0.18),
      GROW(15.8, 14.5, 0.24),
      GROW(19.5, 10.5, 0.3),
      DRAW(path("M20.8 4.5L13.9 11.5C13.6 11.8 13.2 11.8 12.9 11.5L10.1 8.7C9.8 8.4 9.4 8.4 9.1 8.7L3.2 14.6"), 0.5, 0.85),
    ],
  },
  "chart-no-axes-gantt": {
    dur: 1.6,
    auto: false,
    parts: [GROWR(6.4, 17.6, 6, 0.08), GROWR(4.4, 14.4, 12, 0.2), GROWR(11.6, 19.6, 18, 0.32)],
  },

  /* ============ circle/square arrow-out (base draws, arrow escapes) ============ */
  "circle-arrow-out-down-left": {
    dur: 1.7,
    parts: [
      path("M3.4 12a8.6 8.6 0 1 1 8.6 8.6"),
      G("arr", [line(11.2, 11.2, 4.6, 19.4), path("M9.8 19.4L4.6 19.4L4.6 14.2")]),
    ],
    gAnims: { arr: DIP(-0.8, 0.8) },
  },
  "circle-arrow-out-down-right": {
    dur: 1.7,
    parts: [
      path("M12 20.6a8.6 8.6 0 1 1 8.6-8.6"),
      G("arr", [line(12.8, 12.8, 19.4, 19.4), path("M14.2 19.4L19.4 19.4L19.4 14.2")]),
    ],
    gAnims: { arr: DIP(0.8, 0.8) },
  },
  "circle-arrow-out-up-left": {
    dur: 1.7,
    parts: [
      path("M12 3.4A8.6 8.6 0 1 1 3.4 12"),
      G("arr", [line(11.2, 12.8, 4.6, 4.6), path("M9.8 4.6L4.6 4.6L4.6 9.8")]),
    ],
    gAnims: { arr: DIP(-0.8, -0.8) },
  },
  "circle-arrow-out-up-right": {
    dur: 1.7,
    parts: [
      path("M20.6 12A8.6 8.6 0 1 1 12 3.4"),
      G("arr", [line(12.8, 11.2, 19.4, 4.6), path("M14.2 4.6L19.4 4.6L19.4 9.8")]),
    ],
    gAnims: { arr: DIP(0.8, -0.8) },
  },
  "square-arrow-out-down-left": {
    dur: 1.7,
    parts: [
      path("M12.5 20.5L17.6 20.5C19.3 20.5 20.5 19.3 20.5 17.6L20.5 6.4C20.5 4.7 19.3 3.5 17.6 3.5L6.4 3.5C4.7 3.5 3.5 4.7 3.5 6.4L3.5 12.5"),
      G("arr", [line(11.2, 11.2, 4.6, 19.4), path("M9.8 19.4L4.6 19.4L4.6 14.2")]),
    ],
    gAnims: { arr: DIP(-0.8, 0.8) },
  },
  "square-arrow-out-down-right": {
    dur: 1.7,
    parts: [
      path("M11.5 20.5L6.4 20.5C4.7 20.5 3.5 19.3 3.5 17.6L3.5 6.4C3.5 4.7 4.7 3.5 6.4 3.5L17.6 3.5C19.3 3.5 20.5 4.7 20.5 6.4L20.5 11.5"),
      G("arr", [line(12.8, 12.8, 19.4, 19.4), path("M14.2 19.4L19.4 19.4L19.4 14.2")]),
    ],
    gAnims: { arr: DIP(0.8, 0.8) },
  },
  "square-arrow-out-up-left": {
    dur: 1.7,
    parts: [
      path("M11.5 3.5L17.6 3.5C19.3 3.5 20.5 4.7 20.5 6.4L20.5 17.6C20.5 19.3 19.3 20.5 17.6 20.5L6.4 20.5C4.7 20.5 3.5 19.3 3.5 17.6L3.5 11.5"),
      G("arr", [line(11.2, 12.8, 4.6, 4.6), path("M9.8 4.6L4.6 4.6L4.6 9.8")]),
    ],
    gAnims: { arr: DIP(-0.8, -0.8) },
  },
  "square-arrow-out-up-right": {
    dur: 1.7,
    parts: [
      path("M12.5 3.5L6.4 3.5C4.7 3.5 3.5 4.7 3.5 6.4L3.5 17.6C3.5 19.3 4.7 20.5 6.4 20.5L17.6 20.5C19.3 20.5 20.5 19.3 20.5 17.6L20.5 12.5"),
      G("arr", [line(12.8, 11.2, 19.4, 4.6), path("M14.2 4.6L19.4 4.6L19.4 9.8")]),
    ],
    gAnims: { arr: DIP(0.8, -0.8) },
  },

  /* ============ badges & marks ============ */
  /* funnel mouth cut short, X blocking the pour */
  "filter-x": {
    dur: 1.6,
    parts: [
      path("M12.6 5.4L4.8 5.4C3.9 5.4 3.6 6.3 4.1 6.9L6.6 9.35Q9.2 12.3 9.2 15.95L9.2 19.6C9.2 20.4 10 20.9 10.7 20.6L13.9 19.3C14.4 19.1 14.7 18.7 14.7 18.2L14.7 15.5Q14.7 12.8 17.3 9.85L17.9 9.2"),
      G("badge", [path("M16.6 3.8L21.4 8.6"), path("M21.4 3.8L16.6 8.6")]),
    ],
    sAnims: { badge: POP(19, 6.2, 1.2) },
  },
  /* git branch: two nodes + merge curve popping on the folder */
  "folder-git-2": {
    dur: 1.7,
    parts: [
      path(FOLDER),
      G("badge", [
        circle(12.6, 11.2, 1.9),
        circle(18.7, 16.8, 1.9),
        path("M17 16.8a4.2 4.2 0 0 1-4.4-4.2v4.6"),
      ]),
    ],
    sAnims: { badge: POP(15.6, 14, 1.15) },
  },
  /* return arrow flying in from the folder's left edge */
  "folder-symlink": {
    dur: 1.7,
    parts: [
      path(FOLDER),
      path("M4.6 16.4L4.6 15.4C4.6 14.4 5.4 13.6 6.4 13.6L12.8 13.6"),
      SHIFT(path("M9.6 10.4L13.2 13.6L9.6 16.8"), 0.9, 0),
    ],
  },
  "grid-2x2-check": {
    dur: 1.6,
    parts: [
      path(GRID_BADGE),
      line(12, 3.4, 12, 20.6),
      line(3.4, 12, 20.6, 12),
      G("badge", [path("M15.6 19.3L17.3 21L20.8 17")]),
    ],
    sAnims: { badge: POP(18.2, 19, 1.2) },
  },
  "grid-2x2-plus": {
    dur: 1.6,
    parts: [
      path(GRID_BADGE),
      line(12, 3.4, 12, 20.6),
      line(3.4, 12, 20.6, 12),
      G("badge", [path("M18.7 16.2L18.7 21.2M16.2 18.7L21.2 18.7")]),
    ],
    sAnims: { badge: POP(18.7, 18.7, 1.2) },
  },
  "grid-2x2-x": {
    dur: 1.6,
    parts: [
      path(GRID_BADGE),
      line(12, 3.4, 12, 20.6),
      line(3.4, 12, 20.6, 12),
      G("badge", [path("M16.5 16.5L20.9 20.9M20.9 16.5L16.5 20.9")]),
    ],
    sAnims: { badge: POP(18.7, 18.7, 1.2) },
  },
  "map-pin-check-inside": {
    dur: 1.6,
    parts: [path(PIN), G("mark", [path("M9.7 10.3L11.4 12L14.5 8.5")])],
    sAnims: { mark: POP(12, 10.2, 1.2) },
  },
  "map-pin-minus-inside": {
    dur: 1.6,
    parts: [path(PIN), G("mark", [line(9.6, 10.2, 14.4, 10.2)])],
    sAnims: { mark: POP(12, 10.2, 1.2) },
  },
  "map-pin-plus-inside": {
    dur: 1.6,
    parts: [path(PIN), G("mark", [line(12, 7.8, 12, 12.6), line(9.6, 10.2, 14.4, 10.2)])],
    sAnims: { mark: POP(12, 10.2, 1.2) },
  },
  "map-pin-x-inside": {
    dur: 1.6,
    parts: [path(PIN), G("mark", [path("M10.1 8.3L13.9 12.1"), path("M13.9 8.3L10.1 12.1")])],
    sAnims: { mark: POP(12, 10.2, 1.2) },
  },

  /* ============ dashed variants — dashes materialize via dasharray grow ============ */
  "message-circle-dashed": {
    dur: 1.8,
    parts: [DDRAW(path(BUBBLE_C, DASHED))],
  },
  "message-square-dashed": {
    dur: 1.8,
    parts: [DDRAW(path(BUBBLE_S, DASHED))],
  },
  /* dashed pad outline materializes; binding + lines draw on */
  "notepad-text-dashed": {
    dur: 1.7,
    parts: [
      DDRAW(rect(4.4, 4.2, 15.2, 17, 2, DASHED)),
      path("M8.6 2.6L8.6 6.2M12 2.6L12 6.2M15.4 2.6L15.4 6.2"),
      line(8.4, 10.6, 13.8, 10.6),
      line(8.4, 14.2, 16, 14.2),
      line(8.4, 17.8, 13, 17.8),
    ],
  },
  /* bottom edge reduced to dashes; code brackets spread apart */
  "square-dashed-bottom-code": {
    dur: 1.7,
    parts: [
      path("M8.9 20.5L6.4 20.5C4.7 20.5 3.5 19.3 3.5 17.6L3.5 6.4C3.5 4.7 4.7 3.5 6.4 3.5L17.6 3.5C19.3 3.5 20.5 4.7 20.5 6.4L20.5 17.6C20.5 19.3 19.3 20.5 17.6 20.5L15.1 20.5"),
      path("M10.2 20.5L11.4 20.5M12.6 20.5L13.8 20.5"),
      DSH(path("M10.4 9.4L8.2 12L10.4 14.6"), -0.7, 0),
      DSH(path("M13.6 9.4L15.8 12L13.6 14.6"), 0.7, 0),
    ],
  },
  "square-dashed-kanban": {
    dur: 1.7,
    parts: [
      DDRAW(rect(4, 4, 16, 16, 2.6, DASHED)),
      line(8.4, 7.6, 8.4, 14.4),
      line(12, 7.6, 12, 12.2),
      line(15.6, 7.6, 15.6, 15.8),
    ],
  },
  "square-dashed-mouse-pointer": {
    dur: 1.7,
    parts: [
      DDRAW(path("M16 20L6.4 20C4.9 20 4 19.1 4 17.6L4 6.4C4 4.9 4.9 4 6.4 4L17.6 4C19.1 4 20 4.9 20 6.4L20 10.8", DASHED)),
      G("cur", [path("M11.8 12.6L19.6 16.3C19.8 16.4 19.8 16.8 19.6 16.9L17.9 17.4Q16.2 17.9 15.85 19.55L15.5 21.2C15.3 21.5 15 21.4 14.8 21.2L11.4 13C11.3 12.7 11.6 12.6 11.8 12.6Z")]),
    ],
    sAnims: { cur: POP(15.5, 17, 1.15) },
  },

  /* ============ cursor + no-sign ============ */
  "mouse-pointer-ban": {
    dur: 1.7,
    parts: [
      path(CURSOR),
      G("ban", [circle(16, 16, 5.2), line(12.3, 12.3, 19.7, 19.7)]),
    ],
    sAnims: { ban: POP(16, 16, 1.15) },
  },

  /* ============ notebooks ============ */
  "notebook-tabs": {
    dur: 1.7,
    parts: [
      rect(5, 3.4, 14.6, 17.2, 2.2),
      line(13.9, 3.4, 13.9, 20.6),
      path("M3.3 7.4L5 7.4M3.3 11L5 11M3.3 14.6L5 14.6M3.3 18.2L5 18.2"),
      line(14.6, 7.8, 19, 7.8),
      line(14.6, 12, 19, 12),
      line(14.6, 16.2, 19, 16.2),
    ],
  },

  /* ============ receipts — currency symbol pops mid-draw ============ */
  "receipt-cent": {
    dur: 1.6,
    parts: [
      path(RECEIPT),
      G("sym", [
        path("M12 6.8L12 17.2"),
        path("M14.7 9.7C14 8.8 13 8.3 12 8.3C10 8.3 8.6 9.9 8.6 12C8.6 14.1 10 15.7 12 15.7C13 15.7 14 15.2 14.7 14.3"),
      ]),
    ],
    sAnims: { sym: POP(12, 12, 1.12) },
  },
  "receipt-euro": {
    dur: 1.6,
    parts: [
      path(RECEIPT),
      G("sym", [
        path("M14.7 9.7C14 8.8 13 8.3 12 8.3C10 8.3 8.6 9.9 8.6 12C8.6 14.1 10 15.7 12 15.7C13 15.7 14 15.2 14.7 14.3"),
        line(8.2, 12, 12.8, 12),
      ]),
    ],
    sAnims: { sym: POP(12, 12, 1.12) },
  },
  "receipt-indian-rupee": {
    dur: 1.6,
    parts: [
      path(RECEIPT),
      G("sym", [
        line(8.6, 7.4, 15.4, 7.4),
        line(8.6, 11, 15.4, 11),
        path("M9.4 7.4C12 7.4 13.2 9.1 13.2 11.1C13.2 13.1 12 14.7 9.4 14.7L8.4 14.7L11.8 17.4"),
      ]),
    ],
    sAnims: { sym: POP(12, 12, 1.12) },
  },
  "receipt-japanese-yen": {
    dur: 1.6,
    parts: [
      path(RECEIPT),
      G("sym", [
        path("M9.2 7.4L12 10.2L14.8 7.4"),
        line(12, 10.2, 12, 16.8),
        line(9.4, 12.8, 14.6, 12.8),
        line(9.4, 15.4, 14.6, 15.4),
      ]),
    ],
    sAnims: { sym: POP(12, 12, 1.12) },
  },
  "receipt-pound-sterling": {
    dur: 1.6,
    parts: [
      path(RECEIPT),
      G("sym", [
        path("M9.9 16.8L9.9 10.2C9.9 8.6 11 7.4 12.6 7.4C13.9 7.4 14.9 8.3 15.1 9.6"),
        line(8.6, 13.2, 13.4, 13.2),
        line(8.6, 16.8, 15.2, 16.8),
      ]),
    ],
    sAnims: { sym: POP(12, 12, 1.12) },
  },
  "receipt-russian-ruble": {
    dur: 1.6,
    parts: [
      path(RECEIPT),
      G("sym", [
        path("M9.6 16.8L9.6 7.4L13 7.4C14.7 7.4 15.6 8.3 15.6 9.9C15.6 11.5 14.7 12.4 13 12.4L9.6 12.4"),
        line(8.8, 14.8, 13.6, 14.8),
      ]),
    ],
    sAnims: { sym: POP(12, 12, 1.12) },
  },
  "receipt-swiss-franc": {
    dur: 1.6,
    parts: [
      path(RECEIPT),
      G("sym", [
        path("M10 16.8L10 7.4L14.8 7.4"),
        line(10, 11.4, 13.6, 11.4),
        line(8.8, 14.8, 13.4, 14.8),
      ]),
    ],
    sAnims: { sym: POP(12, 12, 1.12) },
  },

  /* ============ tables ============ */
  "table-cells-merge": {
    dur: 1.7,
    parts: [
      rect(3.4, 4, 17.2, 16, 2.5),
      line(3.4, 9.3, 20.6, 9.3),
      line(3.4, 14.7, 20.6, 14.7),
      line(12, 4, 12, 9.3),
      line(12, 14.7, 12, 20),
    ],
  },
  "table-cells-split": {
    dur: 1.7,
    parts: [
      rect(3.4, 4, 17.2, 16, 2.5),
      line(3.4, 9.3, 20.6, 9.3),
      line(3.4, 14.7, 20.6, 14.7),
      line(12, 4, 12, 20),
    ],
  },
  "table-columns-split": { dur: 1.4, auto: true, parts: [
    rect(3, 4, 18, 16, 2.5),
    path("M9 4V20M15 4V20M3 9.5H21"),
  ] },
  "table-rows-split": { dur: 1.4, auto: true, parts: [
    rect(3, 4, 18, 16, 2.5),
    path("M3 9.3H21M3 14.7H21M9.5 9.3V20"),
  ] },

  /* ============ tally counts — strokes draw left-to-right, slash last ============ */
  "tally-1": { dur: 1.3, parts: [line(4.6, 4, 4.6, 20)] },
  "tally-2": { dur: 1.3, parts: [line(4.6, 4, 4.6, 20), line(9.2, 4, 9.2, 20)] },
  "tally-3": {
    dur: 1.4,
    parts: [line(4.6, 4, 4.6, 20), line(9.2, 4, 9.2, 20), line(13.8, 4, 13.8, 20)],
  },
  "tally-4": {
    dur: 1.4,
    parts: [
      line(4.6, 4, 4.6, 20),
      line(9.2, 4, 9.2, 20),
      line(13.8, 4, 13.8, 20),
      line(18.4, 4, 18.4, 20),
    ],
  },
  "tally-5": {
    dur: 1.5,
    parts: [
      line(4.6, 4, 4.6, 20),
      line(9.2, 4, 9.2, 20),
      line(13.8, 4, 13.8, 20),
      line(18.4, 4, 18.4, 20),
      DRAW(path("M20.6 5.4L3.4 18.6"), 0.55, 0.9),
    ],
  },

  /* ============ tickets + plane ============ */
  "tickets-plane": {
    dur: 1.7,
    parts: [
      G("back", [line(5.6, 4, 18.4, 4)]),
      path(TICKET),
      path("M6.2 9.8L6.2 11.2M6.2 13.8L6.2 15.2M6.2 17.8L6.2 19.2"),
      G("plane", [line(9.8, 13.6, 15.8, 13.6), path("M13.6 11.4l2.2 2.2-2.2 2.2")]),
    ],
    gAnims: { plane: DIP(0.8, -0.5) },
  },
};
