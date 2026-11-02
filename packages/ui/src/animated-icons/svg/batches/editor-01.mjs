/* editor-01 — editor + layout glyph slice: object alignment, panel chrome,
   table/grid structures, type marks (case/heading/script), scan brackets,
   3d axes, fold/stretch transforms, code delimiters, math marks, list trees.
   Lumio voice: soft blob silhouettes, round caps, one playful detail per
   glyph. Default gesture is the write-on DRAW; bespoke where the verb
   sings — panels dock, chevrons push, corners tighten, carets blink,
   dashes crawl, layers settle. */

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

/* ---- bespoke gesture idioms (shared vocabulary with the craft batches) --
   HOLD phrasing: rest ~30%, act mid-cycle, settle back — pose(t0)==pose(t1). */
const HOLD = [0, 0.3, 0.55, 0.8, 1];
/* scale-pop around a mark's own center (sAnims entry). */
const POP = (cx, cy, s = 1.24, t = HOLD) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], t),
});
/* wiggle — rotate −a then +a around a pivot, with rest holds. */
const WIG = (cx, cy, a = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `0 ${cx} ${cy}`, `-${a} ${cx} ${cy}`, `${a - 2} ${cx} ${cy}`, `0 ${cx} ${cy}`], HOLD);
/* dip — translate out along an axis and spring back (for gAnims). */
const DIP = (dx, dy, t = HOLD) =>
  tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], t);
/* blink — opacity dips once on a mark. */
const BLINK = (lo = 0.15) => [an("opacity", ["1", "1", `${lo}`, "1", "1"], [0, 0.32, 0.46, 0.6, 1])];
/* trace — the stroke writes itself on. pathLength=1 normalizes, no measuring. */
const DRAW = (p, t0 = 0.15, t1 = 0.62) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } },
    [an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1])]);
/* same trick for <line> parts — explicit dash length. */
const DRAWLINE = (x1, y1, x2, y2, t0 = 0.2, t1 = 0.72, a = {}) => {
  const len = +Math.hypot(x2 - x1, y2 - y1).toFixed(1);
  return A(line(x1, y1, x2, y2, { "stroke-dasharray": len, ...a }),
    [an("stroke-dashoffset", [`${len}`, `${len}`, "0", "0"], [0, t0, t1, 1])]);
};
/* slide — a part nudges along an axis inside [t0, t0+.34] and eases back. */
const SLIDE = (dx, dy, t0 = 0.34) =>
  tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"],
    [0, t0, +(t0 + 0.18).toFixed(3), +(t0 + 0.34).toFixed(3), 1]);
/* crawl — marching ants on a dashed part (keeps its dasharray). */
const CRAWL = (p, step = -4.1) =>
  A(p, [an("stroke-dashoffset", ["0", "0", `${step}`, `${step}`], [0, 0.3, 0.8, 1])]);

/* ---- shared anatomy ------------------------------------------------------
   the canonical rounded frame (panels/tables live here), the scan-bracket
   corner set, the tall H letterform, the ¶ bowl, the capital A. */
const FRAME = () => rect(3.4, 4.2, 17.2, 15.6, 2.5);
const SCAN = () =>
  "M3.4 7.3L3.4 6C3.4 4.6 4.5 3.4 6 3.4L7.3 3.4" +
  "M16.7 3.4L18 3.4C19.4 3.4 20.6 4.5 20.6 6L20.6 7.3" +
  "M20.6 16.7L20.6 18C20.6 19.4 19.5 20.6 18 20.6L16.7 20.6" +
  "M7.3 20.6L6 20.6C4.6 20.6 3.4 19.5 3.4 18L3.4 16.7";
/* corners inhale toward the mark they're reading */
const TIGHTEN = { pivot: [12, 12], anim: tn("scale", ["1", "1", "0.93", "1", "1"], HOLD) };
/* capital H: twin stems + crossbar, sits left of a superscript digit */
const HBARS = "M4.4 18.4V5.8M12 18.4V5.8M4.4 12h7.6";
/* capital A: spread feet, apex ~y5.8, crossbar low */
const LETTER_A = "M4 18.6L9.6 5.8c.3-.8 1.4-.8 1.7 0l5.5 12.8";
const BAR_A = "M6.6 13.6h7";
/* lowercase a: bowl + straight stem at x-height */
const SMALL_A = (cx, cy, r = 2.6) => [
  circle(cx, cy, r),
  line(cx + r, cy - r + 0.4, cx + r, cy + r + 1.4),
];

export const icons = {
  /* ============================ object alignment ============================ */

  /* left rail — two object blocks settle against it in a cascade */
  "align-start-vertical": {
    auto: false,
    dur: 1.7,
    parts: [
      line(4.6, 4, 4.6, 20),
      A(rect(6.6, 5, 11.6, 4.6, 1.3), [SLIDE(-0.7, 0, 0.26)]),
      A(rect(6.6, 14.4, 7.8, 4.6, 1.3), [SLIDE(-0.7, 0, 0.44)]),
    ],
  },

  /* vertical center rail — blocks flank it and squeeze inward */
  "align-center-vertical": {
    auto: false,
    dur: 1.7,
    parts: [
      line(12, 3.6, 12, 20.4),
      G("l", [rect(4, 5, 6.4, 4.4, 1.3), rect(4, 14.6, 6.4, 4.4, 1.3)]),
      G("r", [rect(13.6, 5, 6.4, 4.4, 1.3), rect(13.6, 14.6, 6.4, 4.4, 1.3)]),
    ],
    gAnims: { l: DIP(0.7, 0), r: DIP(-0.7, 0) },
  },

  /* right rail — blocks settle right in a cascade */
  "align-end-vertical": {
    auto: false,
    dur: 1.7,
    parts: [
      line(19.4, 4, 19.4, 20),
      A(rect(7, 5, 11.6, 4.6, 1.3), [SLIDE(0.7, 0, 0.26)]),
      A(rect(10.8, 14.4, 7.8, 4.6, 1.3), [SLIDE(0.7, 0, 0.44)]),
    ],
  },

  /* top rail — blocks hang below and lift to meet it */
  "align-start-horizontal": {
    auto: false,
    dur: 1.7,
    parts: [
      line(4, 4.6, 20, 4.6),
      A(rect(5.2, 6.6, 4.6, 11.6, 1.3), [SLIDE(0, -0.7, 0.26)]),
      A(rect(14.2, 6.6, 4.6, 7.8, 1.3), [SLIDE(0, -0.7, 0.44)]),
    ],
  },

  /* horizontal center rail — blocks flank it above and below */
  "align-center-horizontal": {
    auto: false,
    dur: 1.7,
    parts: [
      line(3.6, 12, 20.4, 12),
      G("t", [rect(4.6, 4, 4.4, 6.4, 1.3), rect(15, 4, 4.4, 6.4, 1.3)]),
      G("b", [rect(4.6, 13.6, 4.4, 6.4, 1.3), rect(15, 13.6, 4.4, 6.4, 1.3)]),
    ],
    gAnims: { t: DIP(0, 0.7), b: DIP(0, -0.7) },
  },

  /* bottom rail — blocks drop down to sit on it */
  "align-end-horizontal": {
    auto: false,
    dur: 1.7,
    parts: [
      line(4, 19.4, 20, 19.4),
      A(rect(5.2, 6, 4.6, 11.6, 1.3), [SLIDE(0, 0.7, 0.26)]),
      A(rect(14.2, 9.8, 4.6, 7.8, 1.3), [SLIDE(0, 0.7, 0.44)]),
    ],
  },

  /* ============================ panel chrome ============================ */

  /* left pane + chevron pushing toward it — the pane folds shut */
  "panel-left-close": {
    auto: false,
    dur: 1.6,
    parts: [
      FRAME(),
      line(9.6, 4.2, 9.6, 19.8),
      G("ch", [path("M16.4 8.8l-3.2 3.2 3.2 3.2")]),
    ],
    gAnims: { ch: DIP(-0.9, 0) },
  },

  /* left pane + chevron pulling away — the pane swings open */
  "panel-left-open": {
    auto: false,
    dur: 1.6,
    parts: [
      FRAME(),
      line(9.6, 4.2, 9.6, 19.8),
      G("ch", [path("M13.2 8.8l3.2 3.2-3.2 3.2")]),
    ],
    gAnims: { ch: DIP(0.9, 0) },
  },

  /* left pane as marching-ants dashes */
  "panel-left-dashed": {
    auto: false,
    dur: 1.8,
    parts: [
      FRAME(),
      CRAWL(line(9.6, 4.2, 9.6, 19.8, { "stroke-dasharray": "0.9 3.2" })),
    ],
  },

  /* mirrored trio for the right edge */
  "panel-right-close": {
    auto: false,
    dur: 1.6,
    parts: [
      FRAME(),
      line(14.4, 4.2, 14.4, 19.8),
      G("ch", [path("M8.6 8.8l3.2 3.2-3.2 3.2")]),
    ],
    gAnims: { ch: DIP(0.9, 0) },
  },

  "panel-right-open": {
    auto: false,
    dur: 1.6,
    parts: [
      FRAME(),
      line(14.4, 4.2, 14.4, 19.8),
      G("ch", [path("M11.8 8.8l-3.2 3.2 3.2 3.2")]),
    ],
    gAnims: { ch: DIP(-0.9, 0) },
  },

  "panel-right-dashed": {
    auto: false,
    dur: 1.8,
    parts: [
      FRAME(),
      CRAWL(line(14.4, 4.2, 14.4, 19.8, { "stroke-dasharray": "0.9 3.2" })),
    ],
  },

  /* top pane variants — chevron up = close, down = open */
  "panel-top-close": {
    auto: false,
    dur: 1.6,
    parts: [
      FRAME(),
      line(3.4, 9.4, 20.6, 9.4),
      G("ch", [path("M8.8 15.4l3.2-3.2 3.2 3.2")]),
    ],
    gAnims: { ch: DIP(0, -0.9) },
  },

  "panel-top-open": {
    auto: false,
    dur: 1.6,
    parts: [
      FRAME(),
      line(3.4, 9.4, 20.6, 9.4),
      G("ch", [path("M8.8 11.8l3.2 3.2 3.2-3.2")]),
    ],
    gAnims: { ch: DIP(0, 0.9) },
  },

  "panel-top-dashed": {
    auto: false,
    dur: 1.8,
    parts: [
      FRAME(),
      CRAWL(line(3.4, 9.4, 20.6, 9.4, { "stroke-dasharray": "0.9 3.2" })),
    ],
  },

  /* bottom pane variants */
  "panel-bottom-close": {
    auto: false,
    dur: 1.6,
    parts: [
      FRAME(),
      line(3.4, 14.6, 20.6, 14.6),
      G("ch", [path("M8.8 8.6l3.2 3.2 3.2-3.2")]),
    ],
    gAnims: { ch: DIP(0, 0.9) },
  },

  "panel-bottom-open": {
    auto: false,
    dur: 1.6,
    parts: [
      FRAME(),
      line(3.4, 14.6, 20.6, 14.6),
      G("ch", [path("M8.8 12.2l3.2-3.2 3.2 3.2")]),
    ],
    gAnims: { ch: DIP(0, -0.9) },
  },

  "panel-bottom-dashed": {
    auto: false,
    dur: 1.8,
    parts: [
      FRAME(),
      CRAWL(line(3.4, 14.6, 20.6, 14.6, { "stroke-dasharray": "0.9 3.2" })),
    ],
  },

  /* L-splits — two dividers compose a sidebar+footer layout */
  "panels-left-bottom": {
    auto: false,
    dur: 1.8,
    parts: [
      FRAME(),
      DRAWLINE(9.6, 4.2, 9.6, 19.8, 0.16, 0.52),
      DRAWLINE(9.6, 14.6, 20.6, 14.6, 0.5, 0.78),
    ],
  },

  "panels-right-bottom": {
    auto: false,
    dur: 1.8,
    parts: [
      FRAME(),
      DRAWLINE(14.4, 4.2, 14.4, 19.8, 0.16, 0.52),
      DRAWLINE(3.4, 14.6, 14.4, 14.6, 0.5, 0.78),
    ],
  },

  "panels-top-left": {
    auto: false,
    dur: 1.8,
    parts: [
      FRAME(),
      DRAWLINE(3.4, 9.4, 20.6, 9.4, 0.16, 0.52),
      DRAWLINE(9.6, 9.4, 9.6, 19.8, 0.5, 0.78),
    ],
  },

  /* frame + four inspection dots pinging corner to corner */
  "inspection-panel": {
    auto: false,
    dur: 1.9,
    parts: [
      FRAME(),
      G("p1", [circle(7, 7, 0.95, fill())]),
      G("p2", [circle(17, 7, 0.95, fill())]),
      G("p3", [circle(7, 17, 0.95, fill())]),
      G("p4", [circle(17, 17, 0.95, fill())]),
    ],
    sAnims: {
      p1: POP(7, 7, 1.7, [0, 0.18, 0.38, 0.6, 1]),
      p2: POP(17, 7, 1.7, [0, 0.3, 0.5, 0.72, 1]),
      p4: POP(17, 17, 1.7, [0, 0.42, 0.62, 0.84, 1]),
      p3: POP(7, 17, 1.7, [0, 0.54, 0.74, 0.94, 1]),
    },
  },

  /* ============================ tables & grids ============================ */

  /* header row + tall first column; the layout writes itself in */
  "table-2": {
    auto: false,
    dur: 1.8,
    parts: [
      FRAME(),
      DRAWLINE(3.4, 9.4, 20.6, 9.4, 0.16, 0.52),
      DRAWLINE(9.6, 4.2, 9.6, 19.8, 0.48, 0.78),
    ],
  },

  /* three lines with page dots on the right — the dots tick off top to bottom */
  "table-of-contents": {
    auto: false,
    dur: 1.9,
    parts: [
      line(4.2, 5.8, 14.6, 5.8),
      line(4.2, 12, 14.6, 12),
      line(4.2, 18.2, 14.6, 18.2),
      G("d1", [circle(19.2, 5.8, 1.15)]),
      G("d2", [circle(19.2, 12, 1.15)]),
      G("d3", [circle(19.2, 18.2, 1.15)]),
    ],
    sAnims: {
      d1: POP(19.2, 5.8, 1.4, [0, 0.2, 0.4, 0.62, 1]),
      d2: POP(19.2, 12, 1.4, [0, 0.36, 0.56, 0.78, 1]),
      d3: POP(19.2, 18.2, 1.4, [0, 0.52, 0.72, 0.94, 1]),
    },
  },

  /* frame with a right rail and two row rules; the side pane highlights */
  "table-properties": {
    auto: false,
    dur: 1.8,
    parts: [
      FRAME(),
      line(15, 4.2, 15, 19.8),
      line(3.4, 9.4, 20.6, 9.4),
      line(3.4, 14.6, 20.6, 14.6),
      A(rect(15.9, 5.1, 3.8, 3.4, 0.9, fill()), [
        an("y", ["5.1", "5.1", "10.4", "5.1", "5.1"], HOLD),
        an("opacity", ["0.35", "0.35", "0.35", "0.35", "0.35"], HOLD),
      ]),
    ],
  },

  /* two panes; the divider drifts like a live resize */
  "columns-2": {
    auto: false,
    dur: 1.7,
    parts: [
      FRAME(),
      A(line(12, 4.2, 12, 19.8), [
        an("x1", ["12", "10.8", "13.2", "12"], [0, 0.33, 0.66, 1]),
        an("x2", ["12", "10.8", "13.2", "12"], [0, 0.33, 0.66, 1]),
      ]),
    ],
  },

  /* three panes; dividers draw in left to right */
  "columns-3": {
    auto: false,
    dur: 1.8,
    parts: [
      FRAME(),
      DRAWLINE(9.4, 4.2, 9.4, 19.8, 0.14, 0.5),
      DRAWLINE(14.6, 4.2, 14.6, 19.8, 0.46, 0.76),
    ],
  },

  /* four panes; dividers cascade */
  "columns-4": {
    auto: false,
    dur: 1.9,
    parts: [
      FRAME(),
      DRAWLINE(7.7, 4.2, 7.7, 19.8, 0.12, 0.42),
      DRAWLINE(12, 4.2, 12, 19.8, 0.34, 0.62),
      DRAWLINE(16.3, 4.2, 16.3, 19.8, 0.56, 0.82),
    ],
  },

  /* two stacked panes; the divider flexes up-down */
  "rows-2": {
    auto: false,
    dur: 1.7,
    parts: [
      FRAME(),
      A(line(3.4, 12, 20.6, 12), [
        an("y1", ["12", "10.8", "13.2", "12"], [0, 0.33, 0.66, 1]),
        an("y2", ["12", "10.8", "13.2", "12"], [0, 0.33, 0.66, 1]),
      ]),
    ],
  },

  /* three stacked panes; rules draw top to bottom */
  "rows-3": {
    auto: false,
    dur: 1.8,
    parts: [
      FRAME(),
      DRAWLINE(3.4, 9.4, 20.6, 9.4, 0.14, 0.5),
      DRAWLINE(3.4, 14.6, 20.6, 14.6, 0.46, 0.76),
    ],
  },

  /* four stacked panes; rules cascade */
  "rows-4": {
    auto: false,
    dur: 1.9,
    parts: [
      FRAME(),
      DRAWLINE(3.4, 8.1, 20.6, 8.1, 0.12, 0.42),
      DRAWLINE(3.4, 12, 20.6, 12, 0.34, 0.62),
      DRAWLINE(3.4, 15.9, 20.6, 15.9, 0.56, 0.82),
    ],
  },

  /* cross-divided frame; the four cells blink in corner order */
  "grid-2x2": {
    auto: false,
    dur: 1.9,
    parts: [
      FRAME(),
      line(12, 4.2, 12, 19.8),
      line(3.4, 12, 20.6, 12),
      G("c1", [rect(5.6, 6.4, 4.6, 3.8, 1.1, fill())]),
      G("c2", [rect(13.8, 6.4, 4.6, 3.8, 1.1, fill())]),
      G("c3", [rect(5.6, 13.8, 4.6, 3.8, 1.1, fill())]),
      G("c4", [rect(13.8, 13.8, 4.6, 3.8, 1.1, fill())]),
    ],
    sAnims: {
      c1: POP(7.9, 8.3, 1.3, [0, 0.16, 0.34, 0.54, 1]),
      c2: POP(16.1, 8.3, 1.3, [0, 0.3, 0.48, 0.68, 1]),
      c4: POP(16.1, 15.7, 1.3, [0, 0.44, 0.62, 0.82, 1]),
      c3: POP(7.9, 15.7, 1.3, [0, 0.58, 0.76, 0.96, 1]),
    },
  },

  /* 3×3 lattice; the center cell pulses as the grid resolves */
  "grid-3x3": {
    auto: false,
    dur: 1.9,
    parts: [
      FRAME(),
      DRAWLINE(9.4, 4.2, 9.4, 19.8, 0.1, 0.4),
      DRAWLINE(14.6, 4.2, 14.6, 19.8, 0.24, 0.54),
      DRAWLINE(3.4, 9.4, 20.6, 9.4, 0.38, 0.68),
      DRAWLINE(3.4, 14.6, 20.6, 14.6, 0.52, 0.82),
      G("mid", [rect(10.4, 10.4, 3.2, 3.2, 0.9, fill())]),
    ],
    sAnims: { mid: POP(12, 12, 1.35, [0, 0.62, 0.8, 0.97, 1]) },
  },

  /* ============================ scan brackets ============================ */

  /* corners inhale while the eye blinks once */
  "scan-eye": {
    auto: false,
    dur: 2,
    parts: [
      G("cr", [path(SCAN())]),
      G("eye", [
        path("M5.6 12.2c1.5-2.7 3.9-4.1 6.4-4.1s4.9 1.4 6.4 4.1c-1.5 2.7-3.9 4.1-6.4 4.1s-4.9-1.4-6.4-4.1z"),
        circle(12, 12.2, 1.15, fill()),
      ]),
    ],
    sAnims: {
      cr: TIGHTEN,
      eye: { pivot: [12, 12.2], anim: tn("scale", ["1 1", "1 1", "1 0.22", "1 1", "1 1"], HOLD) },
    },
  },

  /* corners tighten around the little magnifier */
  "scan-search": {
    auto: false,
    dur: 2,
    parts: [
      G("cr", [path(SCAN())]),
      G("mg", [circle(11.6, 11.4, 3.3), line(14.2, 14, 16.8, 16.6)]),
    ],
    sAnims: {
      cr: TIGHTEN,
      mg: { pivot: [12.6, 12.6], anim: tn("scale", ["1", "1", "1.14", "1", "1"], HOLD) },
    },
  },

  /* corners read three lines — they write in while the corners tighten */
  "scan-text": {
    auto: false,
    dur: 2,
    parts: [
      G("cr", [path(SCAN())]),
      DRAWLINE(7.2, 8.4, 16.8, 8.4, 0.2, 0.42),
      DRAWLINE(7.2, 12, 17.6, 12, 0.4, 0.62),
      DRAWLINE(7.2, 15.6, 13.4, 15.6, 0.6, 0.8),
    ],
    sAnims: { cr: TIGHTEN },
  },

  /* corners + qr blocks pinging in reading order */
  "scan-qr-code": {
    auto: false,
    dur: 2,
    parts: [
      G("cr", [path(SCAN())]),
      G("q1", [rect(7.4, 7.4, 3.8, 3.8, 1)]),
      G("q2", [rect(13.8, 7.4, 2.6, 2.6, 0.8)]),
      G("q3", [rect(7.4, 13.8, 2.6, 2.6, 0.8)]),
      G("q4", [rect(13.8, 13.8, 3.8, 3.8, 1), rect(16.4, 16.4, 1.4, 1.4, 0.4, fill())]),
    ],
    sAnims: {
      cr: TIGHTEN,
      q1: POP(9.3, 9.3, 1.18, [0, 0.2, 0.4, 0.62, 1]),
      q2: POP(15.1, 8.7, 1.24, [0, 0.34, 0.54, 0.76, 1]),
      q3: POP(8.7, 15.1, 1.24, [0, 0.48, 0.68, 0.88, 1]),
      q4: POP(15.7, 15.7, 1.18, [0, 0.62, 0.82, 1, 1]),
    },
  },

  /* ============================ transforms ============================ */

  /* the box breathes toward its corner marks */
  fullscreen: {
    auto: false,
    dur: 1.8,
    parts: [
      path(SCAN()),
      G("bx", [rect(8.2, 8.2, 7.6, 7.6, 1.8)]),
    ],
    sAnims: { bx: { pivot: [12, 12], anim: tn("scale", ["1", "1", "1.22", "1", "1"], HOLD) } },
  },

  /* page halves fold onto the dashed spine — chevrons push inward */
  "fold-horizontal": {
    auto: false,
    dur: 1.8,
    parts: [
      line(12, 3.4, 12, 20.6, { "stroke-dasharray": "2.2 3" }),
      G("l", [line(3.4, 12, 7.6, 12), path("M6.4 9l-3 3 3 3")]),
      G("r", [line(16.4, 12, 20.6, 12), path("M17.6 9l3 3-3 3")]),
    ],
    gAnims: { l: DIP(1.1, 0), r: DIP(-1.1, 0) },
  },

  /* same fold around a horizontal spine */
  "fold-vertical": {
    auto: false,
    dur: 1.8,
    parts: [
      line(3.4, 12, 20.6, 12, { "stroke-dasharray": "2.2 3" }),
      G("t", [line(12, 3.4, 12, 7.6), path("M9 6.4l3-3 3 3")]),
      G("b", [line(12, 16.4, 12, 20.6), path("M9 17.6l3 3 3-3")]),
    ],
    gAnims: { t: DIP(0, 1.1), b: DIP(0, -1.1) },
  },

  /* the crease relaxes — halves press outward */
  "unfold-horizontal": {
    auto: false,
    dur: 1.8,
    parts: [
      line(12, 3.4, 12, 20.6, { "stroke-dasharray": "2.2 3" }),
      G("l", [line(3.4, 12, 7.6, 12), path("M3.4 9l3 3-3 3")]),
      G("r", [line(16.4, 12, 20.6, 12), path("M20.6 9l-3 3 3 3")]),
    ],
    gAnims: { l: DIP(-1.1, 0), r: DIP(1.1, 0) },
  },

  "unfold-vertical": {
    auto: false,
    dur: 1.8,
    parts: [
      line(3.4, 12, 20.6, 12, { "stroke-dasharray": "2.2 3" }),
      G("t", [line(12, 3.4, 12, 7.6), path("M9 3.4l3 3 3-3")]),
      G("b", [line(12, 16.4, 12, 20.6), path("M9 20.6l3-3 3 3")]),
    ],
    gAnims: { t: DIP(0, -1.1), b: DIP(0, 1.1) },
  },

  /* two wide slabs — they squeeze in along X then spring back, elastic */
  "stretch-horizontal": {
    auto: false,
    dur: 1.7,
    parts: [
      A(rect(3.4, 4.4, 17.2, 5, 1.6), [
        an("x", ["3.4", "3.4", "4.8", "3.4", "3.4"], HOLD),
        an("width", ["17.2", "17.2", "14.4", "17.2", "17.2"], HOLD),
      ]),
      A(rect(3.4, 14.6, 17.2, 5, 1.6), [
        an("x", ["3.4", "3.4", "4.8", "3.4", "3.4"], HOLD),
        an("width", ["17.2", "17.2", "14.4", "17.2", "17.2"], HOLD),
      ]),
    ],
  },

  /* same elastic squeeze along Y */
  "stretch-vertical": {
    auto: false,
    dur: 1.7,
    parts: [
      A(rect(4.4, 3.4, 5, 17.2, 1.6), [
        an("y", ["3.4", "3.4", "4.8", "3.4", "3.4"], HOLD),
        an("height", ["17.2", "17.2", "14.4", "17.2", "17.2"], HOLD),
      ]),
      A(rect(14.6, 3.4, 5, 17.2, 1.6), [
        an("y", ["3.4", "3.4", "4.8", "3.4", "3.4"], HOLD),
        an("height", ["17.2", "17.2", "14.4", "17.2", "17.2"], HOLD),
      ]),
    ],
  },

  /* the rule holds; the arrows test it from both sides */
  "separator-horizontal": {
    auto: false,
    dur: 1.7,
    parts: [
      line(3.4, 12, 20.6, 12),
      G("up", [path("M8.8 8.6l3.2-3.2 3.2 3.2")]),
      G("dn", [path("M8.8 15.4l3.2 3.2 3.2-3.2")]),
    ],
    gAnims: { up: DIP(0, -0.8), dn: DIP(0, 0.8) },
  },

  "separator-vertical": {
    auto: false,
    dur: 1.7,
    parts: [
      line(12, 3.4, 12, 20.6),
      G("lf", [path("M8.6 8.8L5.4 12l3.2 3.2")]),
      G("rt", [path("M15.4 8.8l3.2 3.2-3.2 3.2")]),
    ],
    gAnims: { lf: DIP(-0.8, 0), rt: DIP(0.8, 0) },
  },

  /* twin diagonal arrows — they breathe along the anti-diagonal */
  "move-diagonal": {
    auto: false,
    dur: 1.7,
    parts: [
      line(5.4, 18.6, 18.6, 5.4),
      G("ne", [path("M13.4 5.4h5.2v5.2")]),
      G("sw", [path("M10.6 18.6H5.4v-5.2")]),
    ],
    gAnims: { ne: DIP(0.9, -0.9), sw: DIP(-0.9, 0.9) },
  },

  /* same glide on the main diagonal */
  "move-diagonal-2": {
    auto: false,
    dur: 1.7,
    parts: [
      line(5.4, 5.4, 18.6, 18.6),
      G("se", [path("M18.6 13.4v5.2h-5.2")]),
      G("nw", [path("M5.4 10.6V5.4h5.2")]),
    ],
    gAnims: { se: DIP(0.9, 0.9), nw: DIP(-0.9, -0.9) },
  },

  /* almost-full circle chasing its own tail — the head nods through */
  "iteration-cw": {
    auto: false,
    dur: 1.9,
    parts: [
      G("spin", [
        path("M4.6 9.4a8.2 8.2 0 1 1 8.2 8.2H4.6"),
        path("M8.6 21.4l-4-4 4-4"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "0 12 12", "46 12 12", "0 12 12", "0 12 12"], HOLD) },
  },

  "iteration-ccw": {
    auto: false,
    dur: 1.9,
    parts: [
      G("spin", [
        path("M19.4 9.4a8.2 8.2 0 1 0-8.2 8.2h8.2"),
        path("M15.4 13.4l4 4-4 4"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "0 12 12", "-46 12 12", "0 12 12", "0 12 12"], HOLD) },
  },

  /* the lens puffs, the plus flexes */
  "zoom-in": {
    auto: false,
    dur: 1.7,
    parts: [
      circle(10.8, 10.8, 7.4),
      line(16.4, 16.4, 20.8, 20.8),
      G("pl", [line(10.8, 8.4, 10.8, 13.2), line(8.4, 10.8, 13.2, 10.8)]),
    ],
    sAnims: { pl: { pivot: [10.8, 10.8], anim: tn("scale", ["1", "1", "1.25", "1", "1"], HOLD) } },
  },

  "zoom-out": {
    auto: false,
    dur: 1.7,
    parts: [
      circle(10.8, 10.8, 7.4),
      line(16.4, 16.4, 20.8, 20.8),
      G("mn", [line(8.4, 10.8, 13.2, 10.8)]),
    ],
    sAnims: { mn: { pivot: [10.8, 10.8], anim: tn("scale", ["1", "1", "0.6", "1", "1"], HOLD) } },
  },

  /* ============================ type marks ============================ */

  /* capital H + baseline digit — the digit ticks in */
  "heading-1": {
    auto: false,
    dur: 1.7,
    parts: [
      path(HBARS),
      G("d", [path("M17.2 19.4h3.4M18.9 19.4v-7.2l-1.6 1.1")]),
    ],
    sAnims: { d: POP(18.9, 15.8, 1.22, [0, 0.3, 0.52, 0.76, 1]) },
  },

  "heading-2": {
    auto: false,
    dur: 1.7,
    parts: [
      path(HBARS),
      G("d", [path("M20.8 19.4h-4.2v-.4c0-.5.2-.9.6-1.2l2.2-2c.6-.5.9-1.2.9-1.9 0-1.1-.9-2-2-2s-2 .9-2 2")]),
    ],
    sAnims: { d: POP(18.7, 15.8, 1.22, [0, 0.3, 0.52, 0.76, 1]) },
  },

  "heading-3": {
    auto: false,
    dur: 1.7,
    parts: [
      path(HBARS),
      G("d", [path("M17 12.4c.5-1 1.4-1.5 2.4-1.5 1.2 0 2.1.9 2.1 2s-.9 2-2.1 2c1.2 0 2.1.9 2.1 2s-.9 2-2.1 2c-1 0-1.9-.5-2.4-1.4")]),
    ],
    sAnims: { d: POP(19, 15, 1.22, [0, 0.3, 0.52, 0.76, 1]) },
  },

  "heading-4": {
    auto: false,
    dur: 1.7,
    parts: [
      path(HBARS),
      G("d", [path("M20 10.8v8.6 M20 10.8l-3.6 5.2h5.2")]),
    ],
    sAnims: { d: POP(18.9, 15.2, 1.22, [0, 0.3, 0.52, 0.76, 1]) },
  },

  "heading-5": {
    auto: false,
    dur: 1.7,
    parts: [
      path(HBARS),
      G("d", [path("M21.2 10.8h-4v3.2c.4-.3.9-.4 1.4-.4 1.4 0 2.4 1 2.4 2.4s-1 2.4-2.4 2.4c-.9 0-1.6-.4-2.1-1")]),
    ],
    sAnims: { d: POP(18.9, 15, 1.22, [0, 0.3, 0.52, 0.76, 1]) },
  },

  "heading-6": {
    auto: false,
    dur: 1.7,
    parts: [
      path(HBARS),
      G("d", [circle(19, 16.2, 2.1), path("M20.4 10.2c-1.7 1.9-2.7 3.6-2.9 5.6")]),
    ],
    sAnims: { d: POP(18.9, 15, 1.22, [0, 0.3, 0.52, 0.76, 1]) },
  },

  /* two lowercase a's — the bowls bob one after the other */
  "case-lower": {
    auto: false,
    dur: 1.7,
    parts: [
      G("a1", SMALL_A(7.2, 13.2, 3.2)),
      G("a2", SMALL_A(16.8, 13.2, 3.2)),
    ],
    gAnims: {
      a1: DIP(0, -0.9, [0, 0.2, 0.4, 0.62, 1]),
      a2: DIP(0, -0.9, [0, 0.42, 0.62, 0.84, 1]),
    },
  },

  /* capital A + B — the second bowl of the B swells last */
  "case-upper": {
    auto: false,
    dur: 1.7,
    parts: [
      path(LETTER_A),
      path(BAR_A),
      G("b", [
        line(16.4, 6.2, 16.4, 18.6),
        path("M16.4 6.2h2.4c1.5 0 2.5 1 2.5 2.3s-1 2.4-2.5 2.4h-2.4h2.9c1.7 0 2.9 1.1 2.9 2.6s-1.2 2.6-2.9 2.6h-2.9"),
      ]),
    ],
    sAnims: { b: POP(18.8, 12.4, 1.12, [0, 0.3, 0.52, 0.76, 1]) },
  },

  /* capital + lowercase side by side — the little a hops */
  "case-sensitive": {
    auto: false,
    dur: 1.7,
    parts: [
      path(LETTER_A),
      path(BAR_A),
      G("a", SMALL_A(17.6, 13.6, 2.8)),
    ],
    gAnims: { a: DIP(0, -1, [0, 0.32, 0.52, 0.76, 1]) },
  },

  /* big A beside a small A — the small one springs up to compare */
  "a-large-small": {
    auto: false,
    dur: 1.7,
    parts: [
      /* big A narrowed so the small A stands clear of it, 3px apart at the feet */
      path("M2.8 18.6L7.4 6.6C7.7 5.9 8.6 5.9 8.9 6.6L13.6 18.6"),
      path("M4.8 14H11.8"),
      G("sm", [
        path("M16.8 18.6L18.8 11.4C19 10.9 19.6 10.9 19.8 11.4L21.8 18.6"),
        line(17.6, 16, 21, 16),
      ]),
    ],
    sAnims: { sm: { pivot: [19.3, 18.6], anim: tn("scale", ["1", "1", "1.2", "1", "1"], HOLD) } },
  },

  /* A standing on its baseline — the bar underlines in */
  baseline: {
    auto: false,
    dur: 1.7,
    parts: [
      path("M6.2 16.4L11.2 5.6c.3-.8 1.4-.8 1.7 0l5 10.8"),
      line(8.8, 12.4, 14.4, 12.4),
      DRAWLINE(4.2, 19.6, 19.8, 19.6, 0.4, 0.72),
    ],
  },

  /* A leads two short lines, all resting on a shared baseline */
  "letter-text": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M3.8 14.6l3.4-8c.2-.6 1.1-.6 1.4 0l3.4 8"),
      line(5.6, 11.6, 10.2, 11.6),
      line(14.4, 7, 20.4, 7),
      line(14.4, 12.4, 20.4, 12.4),
      DRAWLINE(3.8, 18.4, 20.4, 18.4, 0.42, 0.74),
    ],
  },

  /* ¶ — the bowl curls into twin stems; the head draws itself */
  pilcrow: {
    auto: false,
    dur: 1.8,
    parts: [
      line(13.4, 4.6, 13.4, 20),
      line(17.4, 4.6, 17.4, 20),
      DRAW(path("M18.6 4.6H10.8c-2.7 0-4.5 1.9-4.5 4.4s1.8 4.4 4.5 4.4h2.6"), 0.14, 0.6),
    ],
  },

  /* ¶ riding a left arrow — the arrow tugs the paragraph home */
  "pilcrow-left": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M12.8 3.6v9.6M16.6 3.6v9.6M18.2 3.6h-7.2c-2.2 0-3.7 1.6-3.7 3.7s1.5 3.7 3.7 3.7h1.8"),
      G("ar", [line(20.4, 17.6, 4, 17.6), path("M8.4 14.4L4 17.6l4.4 3.2")]),
    ],
    gAnims: { ar: DIP(-1, 0) },
  },

  "pilcrow-right": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M10.6 3.6v9.6M14.4 3.6v9.6M16 3.6H8.8c-2.2 0-3.7 1.6-3.7 3.7s1.5 3.7 3.7 3.7h1.8"),
      G("ar", [line(3.6, 17.6, 20, 17.6), path("M15.6 14.4L20 17.6l-4.4 3.2")]),
    ],
    gAnims: { ar: DIP(1, 0) },
  },

  /* x with a small ² floating high — the superscript pops */
  superscript: {
    auto: false,
    dur: 1.7,
    parts: [
      line(4.6, 13, 12.2, 20.6),
      line(12.2, 13, 4.6, 20.6),
      G("sup", [path("M15.6 7c.3-1.2 1.3-2 2.6-2 1.4 0 2.4 1 2.4 2.2 0 .8-.4 1.5-1 2l-2.5 2.1c-.5.4-.7.9-.7 1.4v.2h5.4")]),
    ],
    sAnims: { sup: POP(18, 8.4, 1.3, [0, 0.3, 0.52, 0.76, 1]) },
  },

  /* x with a small ₂ sitting low */
  subscript: {
    auto: false,
    dur: 1.7,
    parts: [
      line(4.6, 4.4, 12.2, 12),
      line(12.2, 4.4, 4.6, 12),
      G("sub", [path("M15.6 15.2c.3-1.2 1.3-2 2.6-2 1.4 0 2.4 1 2.4 2.2 0 .8-.4 1.5-1 2l-2.5 2.1c-.5.4-.7.9-.7 1.4v.2h5.4")]),
    ],
    sAnims: { sub: POP(18, 16.6, 1.3, [0, 0.3, 0.52, 0.76, 1]) },
  },

  /* ============================ text tooling ============================ */

  /* block quote: rail + three bars; the rail leads, bars follow */
  "text-quote": {
    auto: false,
    dur: 1.8,
    parts: [
      line(4.2, 10.6, 4.2, 18.6),
      line(4.2, 6, 20.4, 6),
      DRAWLINE(8.2, 12, 20.4, 12, 0.26, 0.52),
      DRAWLINE(8.2, 17.4, 20.4, 17.4, 0.5, 0.76),
    ],
  },

  /* text lines + a lens parked on the last line; the lens tilts in */
  "text-search": {
    auto: false,
    dur: 1.7,
    parts: [
      line(3.8, 5.6, 20.2, 5.6),
      line(3.8, 11, 11.4, 11),
      line(3.8, 16.4, 10, 16.4),
      G("mg", [circle(15.8, 14.2, 3.2), line(18.3, 16.7, 20.6, 19)]),
    ],
    gAnims: { mg: WIG(15.8, 14.2, 10) },
  },

  /* dashed selection box + lines inside; the dashes march */
  "text-select": {
    auto: false,
    dur: 1.9,
    parts: [
      CRAWL(rect(3.8, 4, 16.4, 16, 2.2, { "stroke-dasharray": "0.9 3.1" })),
      line(7.2, 8.6, 16.8, 8.6),
      line(7.2, 12, 15.4, 12),
      line(7.2, 15.4, 13.4, 15.4),
    ],
  },

  /* a field with a live caret; the caret blinks */
  "text-cursor-input": {
    auto: false,
    dur: 1.8,
    parts: [
      rect(3.4, 7.4, 17.2, 9.2, 2.1),
      G("cr", [line(12, 9.8, 12, 14.2), path("M10.4 9.8h3.2M10.4 14.2h3.2")]),
    ],
    gAnims: { cr: an("opacity", ["1", "1", "0.1", "1", "1"], [0, 0.3, 0.45, 0.6, 1]) },
  },

  /* a hollow T — the outline is the glyph; it traces on */
  "type-outline": {
    auto: false,
    dur: 1.8,
    parts: [
      DRAW(path("M5.6 5.4h12.8c.6 0 1 .4 1 1v1.6c0 .6-.4 1-1 1h-3v9.6c0 .6-.4 1-1 1h-2.8c-.6 0-1-.4-1-1V9h-3c-.6 0-1-.4-1-1V6.4c0-.6.4-1 1-1z"), 0.14, 0.66),
    ],
  },

  /* T losing its formatting — the x snaps in */
  "remove-formatting": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M5.2 7.4V5h13.6v2.4"),
      path("M11.8 5L8.6 18.8"),
      line(5.6, 18.8, 11.4, 18.8),
      G("x", [line(16.2, 15.4, 20.8, 20), line(20.8, 15.4, 16.2, 20)]),
    ],
    sAnims: { x: POP(18.5, 17.7, 1.3, [0, 0.34, 0.54, 0.78, 1]) },
  },

  /* two tiles exchange places on curved lanes */
  "replace-all": {
    auto: false,
    dur: 2,
    parts: [
      rect(4, 4.6, 6.4, 6.4, 1.5),
      rect(13.6, 13, 6.4, 6.4, 1.5),
      DRAW(path("M13.8 8.4c-1.6-1.9-4.3-2.2-6.4-.7"), 0.2, 0.5),
      DRAW(path("M10.2 15.6c1.6 1.9 4.3 2.2 6.4.7"), 0.46, 0.76),
    ],
  },

  /* ab riding a word-boundary bracket; the bracket underlines */
  "whole-word": {
    auto: false,
    dur: 1.9,
    parts: [
      circle(7, 11.4, 3),
      line(10, 8.6, 10, 14.4),
      line(14, 8.6, 14, 14.4),
      circle(17, 11.4, 3),
      DRAW(path("M20.6 16.6v.9c0 .6-.5 1.1-1.1 1.1H4.5c-.6 0-1.1-.5-1.1-1.1v-.9"), 0.4, 0.78),
    ],
  },

  /* a line that wraps and returns; the arrow curls home */
  "wrap-text": {
    auto: false,
    dur: 1.9,
    parts: [
      line(3.4, 5.8, 20.6, 5.8),
      DRAW(path("M3.4 11.6h13.2c1.9 0 3.3 1.4 3.3 3.1s-1.4 3.1-3.3 3.1h-3"), 0.18, 0.6),
      DRAW(path("M15.6 14.4l-2.6 2.4 2.6 2.4"), 0.58, 0.8),
    ],
  },

  /* a six-spoke star beside its match box; the star twirls */
  regex: {
    auto: false,
    dur: 1.8,
    parts: [
      G("star", [
        line(16.8, 4.6, 16.8, 13),
        line(13, 6.9, 20.6, 11.1),
        line(13, 11.1, 20.6, 6.9),
      ]),
      rect(3.8, 14.8, 5.4, 5.4, 1.3),
    ],
    gAnims: { star: tn("rotate", ["0 16.8 8.8", "0 16.8 8.8", "60 16.8 8.8", "0 16.8 8.8", "0 16.8 8.8"], HOLD) },
  },

  /* the f hook hands its bar to the i; the tie draws across */
  ligature: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M8.2 19.6V8.4c0-2.4 1.9-4.2 4.3-4.2 1.4 0 2.7.7 3.4 1.9"),
      DRAWLINE(5.6, 11.8, 17.4, 11.8, 0.3, 0.58),
      line(16.4, 11.8, 16.4, 19.6),
      line(5.6, 19.6, 10.8, 19.6),
      line(14.6, 19.6, 18.8, 19.6),
    ],
  },

  /* § — the double-S traces top to bottom */
  section: {
    auto: false,
    dur: 1.9,
    parts: [
      DRAW(path("M16.4 5.8c-.9-1.2-2.6-1.9-4.4-1.9-2.3 0-4.1 1.1-4.1 2.9 0 3.6 8.2 2.6 8.2 6.4 0 1.9-1.9 3-4.1 3-1.8 0-3.5-.7-4.4-1.9M7.6 18.2c.9 1.2 2.6 1.9 4.4 1.9 2.3 0 4.1-1.1 4.1-2.9 0-3.6-8.2-2.6-8.2-6.4 0-1.9 1.9-3 4.1-3 1.8 0 3.5.7 4.4 1.9"), 0.1, 0.72),
    ],
  },

  /* & — the loop writes itself, finishing in the tail tick */
  ampersand: {
    auto: false,
    dur: 2,
    parts: [
      DRAW(path("M15.8 12.2h3.4M17 12.2a7.4 7.4 0 0 1-7.6 7.6c-2.3 0-4-1.8-4-4.1 0-5.5 7.4-3.6 7.4-7.9a2.9 2.9 0 1 0-5.8 0c0 3.1 2.7 8.3 11.2 12"), 0.08, 0.74),
    ],
  },

  /* && — twin marks writing in sequence */
  ampersands: {
    auto: false,
    dur: 2.1,
    parts: [
      DRAW(path("M9.8 15.4c-3.8-2.3-5.6-5.5-5.6-7.3a1.7 1.7 0 0 1 3.4 0c0 2-3.8 2.1-3.8 5.1 0 1.5 1.2 2.7 2.7 2.7 2.4 0 4.4-2 4.4-4.4"), 0.08, 0.5),
      DRAW(path("M20.6 15.4c-3.8-2.3-5.6-5.5-5.6-7.3a1.7 1.7 0 0 1 3.4 0c0 2-3.8 2.1-3.8 5.1 0 1.5 1.2 2.7 2.7 2.7 2.4 0 4.4-2 4.4-4.4"), 0.34, 0.8),
    ],
  },

  /* ============================ list structure ============================ */

  /* indented child rows tucked under a parent line; the stem drops */
  "list-tree": {
    auto: false,
    dur: 1.9,
    parts: [
      line(7, 5.6, 20.2, 5.6),
      DRAW(path("M4.4 5.4v9.8c0 .6.5 1.2 1.2 1.2H7"), 0.2, 0.48),
      DRAWLINE(7, 11.4, 20.2, 11.4, 0.42, 0.64),
      DRAWLINE(7, 17.2, 20.2, 17.2, 0.58, 0.8),
    ],
  },

  /* rows pinch up under the last one — the group collapses */
  "list-collapse": {
    auto: false,
    dur: 1.8,
    /* two chevrons squeeze the list in toward the middle row */
    parts: [
      G("top", [path("M3.8 4.6l3 3 3-3")]),
      G("bot", [path("M3.8 19.4l3-3 3 3")]),
      line(13, 6, 21, 6),
      line(3.5, 12, 21, 12),
      line(13, 18, 21, 18),
    ],
    gAnims: { top: DIP(0, 1.2), bot: DIP(0, -1.2) },
  },

  /* ============================ stacking ============================ */

  /* two layered diamonds; the top sheet lifts and resettles */
  "layers-2": {
    auto: false,
    dur: 1.8,
    parts: [
      G("top", [path("M12 4.4l7.8 3.9c.5.25.5.95 0 1.2L12 13.4 4.2 9.5c-.5-.25-.5-.95 0-1.2L12 4.4z")]),
      path("M4.4 14l7.6 3.8 7.6-3.8"),
    ],
    gAnims: { top: DIP(0, -1.1) },
  },

  /* three-sheet stack; sheets settle in order, top last */
  "layers-3": {
    auto: false,
    dur: 2,
    parts: [
      G("t1", [path("M12 4.2l7.8 3.9c.5.25.5.95 0 1.2L12 13.2 4.2 9.3c-.5-.25-.5-.95 0-1.2L12 4.2z")]),
      G("t2", [path("M4.4 13.6l7.6 3.8 7.6-3.8")]),
      G("t3", [path("M4.4 17.6l7.6 3.8 7.6-3.8")]),
    ],
    gAnims: {
      t3: DIP(0, -0.5, [0, 0.2, 0.4, 0.6, 1]),
      t2: DIP(0, -0.8, [0, 0.36, 0.56, 0.76, 1]),
      t1: DIP(0, -1.1, [0, 0.52, 0.72, 0.92, 1]),
    },
  },

  /* a tile arriving in front of two corner brackets — it slides over */
  "bring-to-front": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M8.4 4.4H6.2c-1 0-1.8.8-1.8 1.8v2.2"),
      path("M15.6 19.6h2.2c1 0 1.8-.8 1.8-1.8v-2.2"),
      G("tile", [rect(8.4, 8.4, 7.4, 7.4, 1.7), rect(10.2, 10.2, 3.8, 3.8, 1, fill())]),
    ],
    gAnims: { tile: DIP(-1.2, -1.2) },
  },

  /* a tile slipping behind — it drifts down-right into the brackets */
  "send-to-back": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M8.4 4.4H6.2c-1 0-1.8.8-1.8 1.8v2.2"),
      path("M15.6 19.6h2.2c1 0 1.8-.8 1.8-1.8v-2.2"),
      G("tile", [rect(8.4, 8.4, 7.4, 7.4, 1.7)]),
    ],
    gAnims: { tile: DIP(1.2, 1.2) },
  },

  /* frame holding a tall narrow pane; the pane flexes its share */
  proportions: {
    auto: false,
    dur: 1.7,
    parts: [
      FRAME(),
      A(line(12.6, 4.2, 12.6, 19.8), [
        an("x1", ["12.6", "11.6", "13.6", "12.6"], [0, 0.33, 0.66, 1]),
        an("x2", ["12.6", "11.6", "13.6", "12.6"], [0, 0.33, 0.66, 1]),
      ]),
    ],
  },

  /* a small tile with a big diagonal arrow — it wants the whole canvas */
  scaling: {
    auto: false,
    dur: 1.8,
    parts: [
      rect(4.2, 10.6, 8.4, 8.4, 1.8),
      G("grow", [path("M20.6 3.4l-7.8 7.8M15.4 3.4h5.2v5.2")]),
    ],
    gAnims: { grow: DIP(1, -1) },
  },

  /* ============================ node flows ============================ */

  /* two nodes joined by a dogleg connector — the connector draws in */
  workflow: {
    auto: false,
    dur: 1.9,
    parts: [
      rect(4, 4.4, 6.8, 6.8, 1.6),
      rect(13.2, 12.8, 6.8, 6.8, 1.6),
      DRAW(path("M7.4 11.2v3c0 .7.5 1.2 1.2 1.2h4.6"), 0.3, 0.62),
      G("dot", [circle(15.8, 15.4, 1, fill())]),
    ],
    sAnims: { dot: POP(15.8, 15.4, 1.6, [0, 0.6, 0.8, 0.96, 1]) },
  },

  /* two lanes merging into one — the join pop */
  merge: {
    auto: false,
    dur: 1.8,
    parts: [
      circle(6.4, 6.4, 1.7),
      circle(6.4, 17.6, 1.7),
      circle(17.6, 12, 1.7),
      DRAW(path("M8.1 6.4h2.3c1 0 1.9.5 2.5 1.3l2.4 3.4"), 0.24, 0.56),
      DRAW(path("M8.1 17.6h2.3c1 0 1.9-.5 2.5-1.3l2.4-3.4"), 0.42, 0.74),
    ],
  },

  /* one lane forking into two — the split draws outward */
  split: {
    auto: false,
    dur: 1.8,
    parts: [
      circle(6.4, 12, 1.7),
      circle(17.6, 6.4, 1.7),
      circle(17.6, 17.6, 1.7),
      DRAW(path("M8.1 12h2.3c1 0 1.9-.5 2.5-1.3l2.4-3.4"), 0.24, 0.56),
      DRAW(path("M8.1 12h2.3c1 0 1.9.5 2.5 1.3l2.4 3.4"), 0.42, 0.74),
    ],
  },

  /* two shapes exchanging a lane — the lane curves over */
  combine: {
    auto: false,
    dur: 1.9,
    parts: [
      rect(4, 4.4, 6.4, 6.4, 1.5),
      rect(13.6, 13.2, 6.4, 6.4, 1.5),
      DRAW(path("M10.4 7.6h2.6c1.6 0 3.2.9 4.2 2.2"), 0.22, 0.52),
      DRAW(path("M13.6 16.4h-2.6c-1.6 0-3.2-.9-4.2-2.2"), 0.44, 0.74),
    ],
  },

  /* plus over minus — a diff; the pair drifts open then settles */
  diff: {
    auto: false,
    dur: 1.6,
    /* plus over minus, split by a hairline gap */
    parts: [
      G("plus", [line(12, 3.5, 12, 11.5), line(8, 7.5, 16, 7.5)]),
      line(7.5, 17.5, 16.5, 17.5),
      line(4.5, 13.5, 19.5, 13.5),
    ],
    gAnims: { plus: DIP(0, 0.8) },
  },

  /* ============================ code delimiters ============================ */

  /* twin braces leaning toward each other */
  braces: {
    auto: false,
    dur: 1.8,
    parts: [
      G("l", [path("M8.2 4.2H7c-.9 0-1.5.7-1.5 1.6v4c0 1-.7 1.8-1.7 1.8 1 0 1.7.8 1.7 1.8v4c0 .9.7 1.6 1.5 1.6h1.2")]),
      G("r", [path("M15.8 4.2H17c.9 0 1.5.7 1.5 1.6v4c0 1 .7 1.8 1.7 1.8-1 0-1.7.8-1.7 1.8v4c0 .9-.7 1.6-1.5 1.6h-1.2")]),
    ],
    gAnims: { l: DIP(0.7, 0), r: DIP(-0.7, 0) },
  },

  /* flat-topped brackets stepping inward */
  brackets: {
    auto: false,
    dur: 1.8,
    parts: [
      G("l", [path("M8.8 5H6.6c-.6 0-1 .4-1 1v12c0 .6.4 1 1 1h2.2")]),
      G("r", [path("M15.2 5h2.2c.6 0 1 .4 1 1v12c0 .6-.4 1-1 1h-2.2")]),
    ],
    gAnims: { l: DIP(0.7, 0), r: DIP(-0.7, 0) },
  },

  /* tall parens breathing around the gap */
  parentheses: {
    auto: false,
    dur: 1.8,
    parts: [
      G("l", [path("M7.8 4.4C5.4 6.8 4.2 9.2 4.2 12s1.2 5.2 3.6 7.6")]),
      G("r", [path("M16.2 4.4c2.4 2.4 3.6 4.8 3.6 7.6s-1.2 5.2-3.6 7.6")]),
    ],
    gAnims: { l: DIP(-0.6, 0), r: DIP(0.6, 0) },
  },

  /* angle brackets cradling a slash; the slash tips forward */
  "code-xml": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M8 7.4L4 12l4 4.6"),
      path("M16 7.4l4 4.6-4 4.6"),
      G("sl", [line(13.2, 6, 10.8, 18)]),
    ],
    gAnims: { sl: tn("rotate", ["0 12 12", "0 12 12", "10 12 12", "0 12 12", "0 12 12"], HOLD) },
  },

  /* parens holding a variable; the x bobs between them */
  variable: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M6.6 4C4.6 6 3.6 8.6 3.6 12s1 6 3 8"),
      path("M17.4 4c2 2 3 4.6 3 8s-1 6-3 8"),
      G("x", [line(9.8, 9.6, 14.2, 14.4), line(14.2, 9.6, 9.8, 14.4)]),
    ],
    gAnims: { x: DIP(0, -1) },
  },

  /* ============================ math & 3d ============================ */

  /* Ω — the loop writes then the feet land */
  omega: {
    auto: false,
    dur: 1.9,
    parts: [
      DRAW(path("M9.4 18.6c-2.6-1.2-4.4-3.9-4.4-7 0-4 2.9-7 7-7s7 3 7 7c0 3.1-1.8 5.8-4.4 7"), 0.12, 0.6),
      DRAWLINE(4.4, 18.6, 9.4, 18.6, 0.58, 0.76),
      DRAWLINE(14.6, 18.6, 19.6, 18.6, 0.7, 0.86),
    ],
  },

  /* √ — the check swings long then the roof draws over */
  radical: {
    auto: false,
    dur: 1.8,
    parts: [
      DRAW(path("M4.4 12.8l3.4 3.4c.3.3.8.3 1-.1l5.2-11.6"), 0.14, 0.55),
      DRAWLINE(13.6, 4.6, 20.6, 4.6, 0.52, 0.78),
    ],
  },

  /* a spoke ending at an arc — the arc draws, then the spoke taps it */
  radius: {
    auto: false,
    dur: 1.9,
    parts: [
      circle(19.4, 4.6, 1.5),
      circle(19.4, 19.4, 1.5),
      DRAW(path("M19.4 19.4a14.8 14.8 0 0 0 0-14.8"), 0.14, 0.5),
      DRAWLINE(4.4, 12, 19, 12, 0.44, 0.7),
      circle(4.4, 12, 1.5),
    ],
  },

  /* Ø through a disc — the diagonal strikes through after the rim */
  diameter: {
    auto: false,
    dur: 1.9,
    parts: [
      circle(12, 12, 7.4),
      DRAWLINE(6.6, 17.4, 17.4, 6.6, 0.3, 0.62),
      circle(6.6, 17.4, 1.4, fill()),
      circle(17.4, 6.6, 1.4, fill()),
    ],
  },

  /* curve kissing its straight line — the line grazes across */
  "tangent": { dur: 1.4, auto: true, parts: [
    circle(10, 14, 6),
    line(9.4, 5, 19, 14.6),
    path("M10 14 14.2 9.8"),
  ] },

  /* L-frame axes with a depth diagonal; the diagonal flicks out */
  "axis-3d": {
    auto: false,
    dur: 1.8,
    parts: [
      path("M5.6 3.6v14.8c0 .6.4 1 1 1h14.8"),
      G("z", [path("M5.6 18.4L12.8 11.2")]),
      path("M9 14.6l3.8-3.4M13.6 11.4l-4.4.8"),
    ],
    gAnims: { z: DIP(-0.8, 0.8) },
  },

  /* 4-way arrows with a diagonal kicker — all four breathe at once */
  "move-3d": {
    auto: false,
    dur: 1.8,
    parts: [
      G("ax", [path("M4.4 12h15.2M17.4 9.6l2.6 2.4-2.6 2.4M6.6 9.6L4 12l2.6 2.4")]),
      G("ay", [path("M12 4.4v15.2M9.6 6.6L12 4l2.4 2.6M9.6 17.4l2.4 2.6 2.4-2.6")]),
      G("z", [path("M16.8 7.2L7.2 16.8M9.6 16l-2.4.8.8-2.4M14.4 8l2.4-.8-.8 2.4")]),
    ],
    gAnims: { z: DIP(0.8, -0.8) },
  },

  /* a disc tilted in space; a tick on the rim marks the orbit direction */
  "rotate-3d": { dur: 1.4, auto: true, parts: [
    path("M20.5 12A8.5 8.5 0 1 1 12 3.5c2.4 0 4.6.9 6.3 2.5L20.5 8M20.5 3.5V8H16"),
    path("M12 7.6 15.4 9.6V13.6L12 15.6 8.6 13.6V9.6Z"),
    path("M12 11.6V15.6M12 11.6 8.6 9.6M12 11.6 15.4 9.6"),
  ] },

  /* ============================ indent & grip ============================ */

  /* lines hop right as the chevron pushes them */
  "indent-increase": {
    auto: false,
    dur: 1.8,
    parts: [
      line(11, 6, 20.6, 6),
      line(11, 12, 20.6, 12),
      line(11, 18, 20.6, 18),
      G("ch", [path("M4 9l3.6 3-3.6 3")]),
      G("ln", [line(6.4, 12, 9.4, 12)]),
    ],
    gAnims: { ch: DIP(0.9, 0), ln: DIP(1.4, 0) },
  },

  /* lines relax left as the chevron pulls back */
  "indent-decrease": {
    auto: false,
    dur: 1.8,
    parts: [
      line(11, 6, 20.6, 6),
      line(11, 12, 20.6, 12),
      line(11, 18, 20.6, 18),
      G("ch", [path("M9.4 9l-3.6 3 3.6 3")]),
      G("ln", [line(9.4, 12, 6.4, 12)]),
    ],
    gAnims: { ch: DIP(-0.9, 0), ln: DIP(-1.4, 0) },
  },

  /* two columns of three dots — they tick down like a fingertip drag */
  "grip": {
    auto: false,
    dur: 1.7,
    parts: [
      G("g1", [circle(9.2, 6.4, 1.15)]), G("g2", [circle(9.2, 12, 1.15)]),
      G("g3", [circle(9.2, 17.6, 1.15)]), G("g4", [circle(14.8, 6.4, 1.15)]),
      G("g5", [circle(14.8, 12, 1.15)]), G("g6", [circle(14.8, 17.6, 1.15)]),
    ],
    gAnims: {
      g1: DIP(0, -0.7, [0, 0.18, 0.34, 0.5, 1]),
      g2: DIP(0, -0.7, [0, 0.28, 0.44, 0.6, 1]),
      g3: DIP(0, -0.7, [0, 0.38, 0.54, 0.7, 1]),
      g4: DIP(0, -0.7, [0, 0.26, 0.42, 0.58, 1]),
      g5: DIP(0, -0.7, [0, 0.36, 0.52, 0.68, 1]),
      g6: DIP(0, -0.7, [0, 0.46, 0.62, 0.78, 1]),
    },
  },

  /* two rows of three dots — they tick right like a thumb slide */
  "grip-horizontal": {
    auto: false,
    dur: 1.7,
    parts: [
      G("g1", [circle(6.4, 9.2, 1.15)]), G("g2", [circle(12, 9.2, 1.15)]),
      G("g3", [circle(17.6, 9.2, 1.15)]), G("g4", [circle(6.4, 14.8, 1.15)]),
      G("g5", [circle(12, 14.8, 1.15)]), G("g6", [circle(17.6, 14.8, 1.15)]),
    ],
    gAnims: {
      g1: DIP(-0.7, 0, [0, 0.18, 0.34, 0.5, 1]),
      g2: DIP(-0.7, 0, [0, 0.28, 0.44, 0.6, 1]),
      g3: DIP(-0.7, 0, [0, 0.38, 0.54, 0.7, 1]),
      g4: DIP(-0.7, 0, [0, 0.26, 0.42, 0.58, 1]),
      g5: DIP(-0.7, 0, [0, 0.36, 0.52, 0.68, 1]),
      g6: DIP(-0.7, 0, [0, 0.46, 0.62, 0.78, 1]),
    },
  },

  /* a four-finger hand closing; the thumb swings in last */
  grab: {
    auto: false,
    dur: 1.9,
    parts: [
      G("palm", [
        path("M8.2 10.8V6.4a1.7 1.7 0 0 1 3.4 0v3.8M11.6 9.8V4.8a1.7 1.7 0 0 1 3.4 0v5M15 9.8V6.8a1.7 1.7 0 0 1 3.4 0v7.6c0 3.6-2.6 6.2-6.4 6.2-3.2 0-5-1.3-6.2-3.5L4.4 14.2c-.7-1.1-.5-2.4.4-3a1.7 1.7 0 0 1 2.4.7l1 1.8"),
      ]),
    ],
    gAnims: { palm: WIG(11.4, 20.4, 7) },
  },

  /* ============================ close ============================ */
};

