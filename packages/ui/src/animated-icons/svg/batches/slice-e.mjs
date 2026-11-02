/* slice-e — editor/text/ui-chrome fundamentals: alignment rails, type
   marks, layout chrome, transform arrows, ink tools. Lumio voice: soft
   blob silhouettes, big radii, one playful detail per glyph.
   Expressive gestures where the verb sings — the signature traces
   itself, the eyedropper sucks its drop back up, panels dock in,
   the wand's star twinkles, table rows highlight in sequence.
   Simple chrome (type marks, pilcrow) keeps the auto draw-on. */

const path = (d, a = {}) => ({ e: "path", a: { d, ...a } });
const circle = (cx, cy, r, a = {}) => ({ e: "circle", a: { cx, cy, r, ...a } });
const line = (x1, y1, x2, y2, a = {}) => ({ e: "line", a: { x1, y1, x2, y2, ...a } });
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
/* dip — translate out along an axis and spring back. */
const DIP = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD);
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

export const icons = {
  /* ------------------------------ alignment ------------------------------ */

  /* rail + three bars hugging it; the bars settle against the rail in a cascade */
  "align-left": {
    auto: false,
    dur: 1.7,
    parts: [
      line(5.4, 4, 5.4, 20),
      A(line(9, 6.6, 19.6, 6.6), [SLIDE(-0.9, 0, 0.26)]),
      A(line(9, 12, 15.8, 12), [SLIDE(-0.9, 0, 0.38)]),
      A(line(9, 17.4, 18.4, 17.4), [SLIDE(-0.9, 0, 0.5)]),
    ],
  },

  /* centered bars; they drift off-center briefly then re-center */
  "align-center": {
    auto: false,
    dur: 1.7,
    parts: [
      A(line(5.5, 6.6, 18.5, 6.6), [SLIDE(0.8, 0, 0.26)]),
      A(line(7.5, 12, 16.5, 12), [SLIDE(-0.8, 0, 0.38)]),
      A(line(6.2, 17.4, 17.8, 17.4), [SLIDE(0.8, 0, 0.5)]),
    ],
  },

  /* mirrored: bars settle right against their rail */
  "align-right": {
    auto: false,
    dur: 1.7,
    parts: [
      line(18.6, 4, 18.6, 20),
      A(line(4.4, 6.6, 15, 6.6), [SLIDE(0.9, 0, 0.26)]),
      A(line(8.2, 12, 15, 12), [SLIDE(0.9, 0, 0.38)]),
      A(line(5.6, 17.4, 15, 17.4), [SLIDE(0.9, 0, 0.5)]),
    ],
  },

  /* four equal bars; each right end springs back to the margin in turn */
  "align-justify": {
    auto: false,
    dur: 1.8,
    parts: [
      A(line(4.8, 5.4, 19.2, 5.4), [an("x2", ["19.2", "19.2", "16.4", "19.2", "19.2"], [0, 0.24, 0.36, 0.52, 1])]),
      A(line(4.8, 10, 19.2, 10), [an("x2", ["19.2", "19.2", "16.4", "19.2", "19.2"], [0, 0.36, 0.48, 0.64, 1])]),
      A(line(4.8, 14.6, 19.2, 14.6), [an("x2", ["19.2", "19.2", "16.4", "19.2", "19.2"], [0, 0.48, 0.6, 0.76, 1])]),
      A(line(4.8, 19.2, 19.2, 19.2), [an("x2", ["19.2", "19.2", "16.4", "19.2", "19.2"], [0, 0.6, 0.72, 0.88, 1])]),
    ],
  },

  /* ------------------------------ type marks ------------------------------ */

  /* soft serif T — bowed cap, plain stem, foot serif */
  text: {
    dur: 1.5,
    parts: [
      path("M5.6 5.4C8.2 4.9 15.8 4.9 18.4 5.4"),
      line(12, 6.6, 12, 19.6),
      line(8.8, 19.6, 15.2, 19.6),
    ],
  },

  /* three rows; each check ticks, then its line extends */
  "list-checks": {
    auto: false,
    dur: 1.9,
    parts: [
      DRAW(path("M3.2 6.4L4.8 8L7.4 5"), 0.08, 0.24),
      DRAWLINE(9.8, 6, 19.6, 6, 0.26, 0.44),
      DRAW(path("M3.2 12.4L4.8 14L7.4 11"), 0.42, 0.58),
      DRAWLINE(9.8, 12, 17.6, 12, 0.6, 0.76),
      DRAW(path("M3.2 18.4L4.8 20L7.4 17"), 0.76, 0.9),
      DRAWLINE(9.8, 18, 19.4, 18, 0.88, 0.98),
    ],
  },

  /* opening quotes — two blob-and-tail marks that plop in sequence */
  quote: {
    auto: false,
    dur: 1.6,
    parts: [
      G("q1", [circle(6.4, 7.8, 2.2), path("M5.2 9.6C4.9 12 3.9 13.9 2.9 15.4")]),
      G("q2", [circle(16.4, 7.8, 2.2), path("M15.2 9.6C14.9 12 13.9 13.9 12.9 15.4")]),
    ],
    sAnims: {
      q1: POP(6.4, 9, 1.16),
      q2: POP(16.4, 9, 1.16, [0, 0.42, 0.62, 0.82, 1]),
    },
  },

  /* paragraph lines with an indent arrow; the arrow pushes, lines follow */
  indentation: {
    auto: false,
    dur: 1.8,
    parts: [
      line(9, 5.6, 20.4, 5.6),
      G("ind", [line(12.6, 10.4, 20.4, 10.4), line(12.6, 15.2, 20.4, 15.2)]),
      line(9, 20, 20.4, 20),
      G("arrow", [line(3.2, 12.8, 8, 12.8), path("M5.6 10.6L8.2 12.8L5.6 15")]),
    ],
    gAnims: {
      arrow: DIP(1.2, 0),
      ind: tn("translate", ["0 0", "0 0", "0.9 0", "0 0", "0 0"], [0, 0.36, 0.54, 0.78, 1]),
    },
  },

  /* pilcrow — bowl opens onto the left stem, double stems to the baseline */
  pilaster: {
    dur: 1.5,
    parts: [
      path("M10.6 4.4C8 4.4 6.2 5.8 6.2 7.8C6.2 9.8 8 11.2 10.6 11.2"),
      line(10.6, 4.4, 10.6, 20.4),
      line(14.6, 4.4, 14.6, 20.4),
    ],
  },

  /* handwritten flourish + baseline; the signature writes itself on */
  signature: {
    auto: false,
    dur: 1.9,
    parts: [
      DRAW(path("M3.4 14.6C4.4 10.6 7.2 8.4 8.4 10.8C9.5 13 7.4 15.8 9.8 15C11.7 14.4 12.2 11.2 14 12.2C15.3 12.9 14.7 15.2 16.4 14.6C18.1 14 19.4 11.6 20.7 13.4"), 0.1, 0.62),
      DRAWLINE(4.2, 19.8, 20, 19.8, 0.6, 0.84),
    ],
  },

  /* I-beam inside selection corners; the beam blinks like a real caret */
  "text-cursor": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M7.8 3.8L6 3.8C4.6 3.8 3.4 4.9 3.4 6.4L3.4 8.4M16.2 3.8L18 3.8C19.4 3.8 20.6 4.9 20.6 6.4L20.6 8.4M20.6 15.6L20.6 17.6C20.6 19.1 19.4 20.2 18 20.2L16.2 20.2M7.8 20.2L6 20.2C4.6 20.2 3.4 19.1 3.4 17.6L3.4 15.6"),
      G("beam", [line(12, 6.8, 12, 17.2), path("M9.8 6.8L14.2 6.8M9.8 17.2L14.2 17.2")]),
    ],
    gAnims: { beam: an("opacity", ["1", "1", "0.12", "1", "1"], [0, 0.34, 0.46, 0.58, 1]) },
  },

  /* ------------------------------ layout chrome ------------------------------ */

  /* framed grid with a header row; a wash band slides down the rows */
  "table": { dur: 1.4, auto: true, parts: [
    rect(3, 4, 18, 16, 2.5),
    path("M3 9.5H21M9.5 9.5V20"),
  ] },

  /* two panes; the divider flexes left-right like a live column resize */
  columns: {
    auto: false,
    dur: 1.7,
    parts: [
      rect(3.4, 4.2, 17.2, 15.6, 2.5),
      A(line(12, 4.2, 12, 19.8), [
        an("x1", ["12", "10.7", "13.3", "12"], [0, 0.33, 0.66, 1]),
        an("x2", ["12", "10.7", "13.3", "12"], [0, 0.33, 0.66, 1]),
      ]),
    ],
  },

  /* two stacked panes; the divider flexes up-down */
  rows: {
    auto: false,
    dur: 1.7,
    parts: [
      rect(3.4, 4.2, 17.2, 15.6, 2.5),
      A(line(3.4, 12, 20.6, 12), [
        an("y1", ["12", "10.7", "13.3", "12"], [0, 0.33, 0.66, 1]),
        an("y2", ["12", "10.7", "13.3", "12"], [0, 0.33, 0.66, 1]),
      ]),
    ],
  },

  /* frame + header + side split; the frame holds while the layout assembles */
  layout: {
    auto: false,
    dur: 1.7,
    parts: [
      rect(3.4, 4.2, 17.2, 15.6, 2.5),
      DRAWLINE(3.4, 8.6, 20.6, 8.6, 0.16, 0.5),
      DRAWLINE(9.8, 8.6, 9.8, 19.8, 0.48, 0.78),
    ],
  },

  /* frame + solid left pane that docks in from the edge */
  "panel-left": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3.4, 4.2, 17.2, 15.6, 2.5),
      G("pane", [rect(5.6, 6.4, 5, 11.2, 1.5, fill())]),
    ],
    gAnims: { pane: DIP(-1.1, 0) },
  },

  /* mirrored — solid right pane docks in */
  "panel-right": {
    auto: false,
    dur: 1.6,
    parts: [
      rect(3.4, 4.2, 17.2, 15.6, 2.5),
      G("pane", [rect(13.4, 6.4, 5, 11.2, 1.5, fill())]),
    ],
    gAnims: { pane: DIP(1.1, 0) },
  },

  /* rail divider + nav dots + content lines; the nav dots ping in turn */
  sidebar: {
    auto: false,
    dur: 1.8,
    parts: [
      rect(3.4, 4.2, 17.2, 15.6, 2.5),
      line(9.4, 4.2, 9.4, 19.8),
      G("d1", [circle(6.4, 8, 1, fill())]),
      G("d2", [circle(6.4, 12.2, 1, fill())]),
      line(12.4, 8, 18.2, 8),
      line(12.4, 12.2, 16.6, 12.2),
      line(12.4, 16.4, 18.2, 16.4),
    ],
    sAnims: {
      d1: POP(6.4, 8, 1.6, [0, 0.24, 0.44, 0.66, 1]),
      d2: POP(6.4, 12.2, 1.6, [0, 0.44, 0.64, 0.86, 1]),
    },
  },

  /* ------------------------------ transforms ------------------------------ */

  /* parallel NE/SW arrows darting outward */
  "maximize-2": {
    auto: false,
    dur: 1.5,
    parts: [
      G("ne", [line(13.2, 10.8, 19.6, 4.4), path("M15.2 4.4L19.6 4.4L19.6 8.8")]),
      G("sw", [line(10.8, 13.2, 4.4, 19.6), path("M8.8 19.6L4.4 19.6L4.4 15.2")]),
    ],
    gAnims: { ne: DIP(0.9, -0.9), sw: DIP(-0.9, 0.9) },
  },

  /* same arrows pointing inward — they pull to center */
  "minimize-2": {
    auto: false,
    dur: 1.5,
    parts: [
      G("ne", [line(19.8, 4.2, 15, 9), path("M18.2 9L15 9L15 5.8")]),
      G("sw", [line(4.2, 19.8, 9, 15), path("M5.8 15L9 15L9 18.2")]),
    ],
    gAnims: { ne: DIP(-0.7, 0.7), sw: DIP(0.7, -0.7) },
  },

  /* a box growing toward corner marks — literally expands to the frame */
  expand: {
    auto: false,
    dur: 1.7,
    parts: [
      G("box", [rect(8.6, 8.6, 6.8, 6.8, 2)]),
      path("M4.6 6.9L4.6 4.6L6.9 4.6M17.1 4.6L19.4 4.6L19.4 6.9M19.4 17.1L19.4 19.4L17.1 19.4M6.9 19.4L4.6 19.4L4.6 17.1"),
    ],
    sAnims: { box: { pivot: [12, 12], anim: tn("scale", ["1", "1", "1.5", "1", "1"], HOLD) } },
  },

  /* corner marks pressing inward on a box — squeeze to fit */
  shrink: {
    auto: false,
    dur: 1.7,
    parts: [
      G("box", [rect(9, 9, 6, 6, 1.9)]),
      path("M4.4 7.9L7.9 7.9L7.9 4.4M16.1 4.4L16.1 7.9L19.6 7.9M19.6 16.1L16.1 16.1L16.1 19.6M7.9 19.6L7.9 16.1L4.4 16.1"),
    ],
    sAnims: { box: { pivot: [12, 12], anim: tn("scale", ["1", "1", "0.6", "1", "1"], HOLD) } },
  },

  /* apart-pointing horizontal arrows; they take turns pushing out */
  "move-horizontal": {
    auto: false,
    dur: 1.7,
    parts: [
      G("lf", [line(9.4, 12, 4.2, 12), path("M7 9.4L4.2 12L7 14.6")]),
      G("rt", [line(14.6, 12, 19.8, 12), path("M17 9.4L19.8 12L17 14.6")]),
    ],
    gAnims: {
      lf: tn("translate", ["0 0", "0 0", "-0.9 0", "0 0", "0 0"], [0, 0.15, 0.32, 0.5, 1]),
      rt: tn("translate", ["0 0", "0 0", "0.9 0", "0 0", "0 0"], [0, 0.5, 0.66, 0.84, 1]),
    },
  },

  /* apart-pointing vertical arrows; they take turns pushing out */
  "move-vertical": {
    auto: false,
    dur: 1.7,
    parts: [
      G("up", [line(12, 9.4, 12, 4.2), path("M9.4 7L12 4.2L14.6 7")]),
      G("dn", [line(12, 14.6, 12, 19.8), path("M9.4 17L12 19.8L14.6 17")]),
    ],
    gAnims: {
      up: tn("translate", ["0 0", "0 0", "0 -0.9", "0 0", "0 0"], [0, 0.15, 0.32, 0.5, 1]),
      dn: tn("translate", ["0 0", "0 0", "0 0.9", "0 0", "0 0"], [0, 0.5, 0.66, 0.84, 1]),
    },
  },

  /* rewind arc that traces itself back, then the head ticks in */
  undo: {
    auto: false,
    dur: 1.8,
    parts: [
      DRAW(path("M8.4 8.2C10 5.4 13.2 4.3 16.1 5.3C19 6.3 20.7 9.2 20.5 12.4C20.3 15.6 18.2 18.7 15.1 19.9C12 21.1 8.3 20.1 6.1 17.5"), 0.12, 0.6),
      DRAW(path("M10.2 4.4L6.4 7L10 9.7"), 0.6, 0.78),
    ],
  },

  /* forward arc — undo's mirror */
  redo: {
    auto: false,
    dur: 1.8,
    parts: [
      DRAW(path("M15.6 8.2C14 5.4 10.8 4.3 7.9 5.3C5 6.3 3.3 9.2 3.5 12.4C3.7 15.6 5.8 18.7 8.9 19.9C12 21.1 15.7 20.1 17.9 17.5"), 0.12, 0.6),
      DRAW(path("M13.8 4.4L17.6 7L14 9.7"), 0.6, 0.78),
    ],
  },

  /* corner-headed circular arrow; the whole glyph nods counter-clockwise */
  "rotate-ccw": {
    auto: false,
    dur: 1.8,
    parts: [
      G("spin", [
        path("M4.6 4L4.6 8.6L9.2 8.6"),
        path("M4.6 13.8A8.6 8.6 0 1 0 7 6.4L4.6 8.6"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "0 12 12", "-52 12 12", "0 12 12", "0 12 12"], HOLD) },
  },

  /* clockwise twin */
  "rotate-cw": {
    auto: false,
    dur: 1.8,
    parts: [
      G("spin", [
        path("M19.4 4L19.4 8.6L14.8 8.6"),
        path("M19.4 13.8A8.6 8.6 0 1 1 17 6.4L19.4 8.6"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 12 12", "0 12 12", "52 12 12", "0 12 12", "0 12 12"], HOLD) },
  },

  /* dashed mirror axis; each blob flips through its own center in turn */
  "flip-horizontal": {
    auto: false,
    dur: 1.9,
    parts: [
      line(12, 3.6, 12, 20.4, { "stroke-dasharray": "2.4 3.2" }),
      G("lf", [path("M8.9 5.6C7.4 5.6 6.2 6.2 5.3 7.4L4 9.2C3.1 10.4 3.1 13.6 4 14.8L5.3 16.6C6.2 17.8 7.4 18.4 8.9 18.4L8.9 5.6Z")]),
      G("rt", [path("M15.1 5.6C16.6 5.6 17.8 6.2 18.7 7.4L20 9.2C20.9 10.4 20.9 13.6 20 14.8L18.7 16.6C17.8 17.8 16.6 18.4 15.1 18.4L15.1 5.6Z")]),
    ],
    sAnims: {
      lf: { pivot: [6, 12], anim: tn("scale", ["1 1", "1 1", "-1 1", "1 1", "1 1"], [0, 0.28, 0.5, 0.72, 1]) },
      rt: { pivot: [18, 12], anim: tn("scale", ["1 1", "1 1", "-1 1", "1 1", "1 1"], [0, 0.44, 0.66, 0.88, 1]) },
    },
  },

  /* same flip across a horizontal axis */
  "flip-vertical": {
    auto: false,
    dur: 1.9,
    parts: [
      line(3.6, 12, 20.4, 12, { "stroke-dasharray": "2.4 3.2" }),
      G("tp", [path("M5.6 8.9C5.6 7.4 6.2 6.2 7.4 5.3L9.2 4C10.4 3.1 13.6 3.1 14.8 4L16.6 5.3C17.8 6.2 18.4 7.4 18.4 8.9L5.6 8.9Z")]),
      G("bt", [path("M5.6 15.1C5.6 16.6 6.2 17.8 7.4 18.7L9.2 20C10.4 20.9 13.6 20.9 14.8 20L16.6 18.7C17.8 17.8 18.4 16.6 18.4 15.1L5.6 15.1Z")]),
    ],
    sAnims: {
      tp: { pivot: [12, 6.6], anim: tn("scale", ["1 1", "1 1", "1 -1", "1 1", "1 1"], [0, 0.28, 0.5, 0.72, 1]) },
      bt: { pivot: [12, 17.4], anim: tn("scale", ["1 1", "1 1", "1 -1", "1 1", "1 1"], [0, 0.44, 0.66, 0.88, 1]) },
    },
  },

  /* ------------------------------ color & ink tools ------------------------------ */

  /* wand rod + four-point star at the tip; star twinkles, motes blink */
  wand: {
    auto: false,
    dur: 1.8,
    parts: [
      line(3.8, 20.2, 14.4, 9.6),
      G("star", [path("M16.9 4.4L17.6 6.4L19.6 7L17.6 7.6L16.9 9.6L16.2 7.6L14.2 7L16.2 6.4Z")]),
      A(circle(19.9, 4.4, 0.85, fill()), [an("opacity", ["1", "1", "0.15", "1", "1"], [0, 0.4, 0.52, 0.64, 1])]),
      A(circle(8.4, 4.4, 0.85, fill()), [an("opacity", ["1", "1", "0.15", "1", "1"], [0, 0.56, 0.68, 0.8, 1])]),
    ],
    sAnims: { star: POP(16.9, 7, 1.22, [0, 0.26, 0.46, 0.68, 1]) },
  },

  /* tilted pail — a flattened lip replaces the left vertex; drop falls off it */
  "paint-bucket": {
    auto: false,
    dur: 1.9,
    parts: [
      path("M13.2 3.6L18.8 9.2C19.7 10.1 19.7 11.5 18.8 12.4L12.4 18.8C11.5 19.7 10.1 19.7 9.2 18.8L4.9 14.5C4.3 13.9 4 13.1 4.2 12.3L4.4 11.4C4.6 10.6 5 10 5.5 9.5L10 3.6C10.9 2.7 12.3 2.7 13.2 3.6Z"),
      path("M6.9 12.3L17.5 12.3"),
      A(circle(3.4, 13.2, 1.05, fill()), [
        an("cy", ["13.2", "13.2", "19.2", "19.2", "13.2"], [0, 0.24, 0.62, 0.78, 1]),
        an("opacity", ["1", "1", "1", "0", "0", "1"], [0, 0.6, 0.72, 0.86, 0.97, 1]),
      ]),
    ],
  },

  /* fat handle + curled bristle; the brush dabs down toward its tip */
  paintbrush: {
    auto: false,
    dur: 1.7,
    parts: [
      G("brush", [
        path("M9.4 13.6C9.8 12.8 10.4 12.2 11.2 11.8L18.2 4.8C19.1 3.9 20.5 3.9 21.4 4.8C22.3 5.7 22.3 7.1 21.4 8L14.4 15C14 15.8 13.4 16.4 12.6 16.8"),
        path("M9.8 13.2C8.4 13.4 7.6 14.6 7.6 16C7.6 17.8 6.2 19.2 4.6 19.4C4 19.5 3.7 20.2 4.1 20.7C4.4 21 4.9 21.1 5.4 21C7.6 20.6 9.6 19.8 10.9 18.3C11.9 17.1 12.1 15.6 11.5 14.2"),
        path("M10 14.9L13.3 11.6"),
      ]),
    ],
    gAnims: { brush: DIP(-0.8, 0.8) },
  },

  /* pipette + squeeze bulb; the drop pulls back up into the tip */
  eyedropper: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M9 14.8L16.6 7.2C17.3 6.5 18.4 6.5 19.1 7.2L19.4 7.5C20.1 8.2 20.1 9.3 19.4 10L11.8 17.6L9 14.8Z"),
      circle(19.2, 5.6, 1.8),
      path("M8.8 15.4L7.2 17"),
      A(circle(5.6, 19.4, 1.15, fill()), [
        an("cx", ["5.6", "5.6", "6.5", "5.6", "5.6"], HOLD),
        an("cy", ["19.4", "19.4", "17.7", "19.4", "19.4"], HOLD),
        an("r", ["1.15", "1.15", "0.45", "1.15", "1.15"], HOLD),
      ]),
    ],
  },

  /* ring + dark half; the dark side swings like a contrast dial */
  contrast: {
    keepFill: true,
    auto: false,
    dur: 1.8,
    parts: [
      circle(12, 12, 8.6),
      G("half", [path("M12 3.4C7.2 3.4 3.4 7.2 3.4 12C3.4 16.8 7.2 20.6 12 20.6Z", fill())]),
    ],
    gAnims: { half: tn("rotate", ["0 12 12", "0 12 12", "24 12 12", "0 12 12", "0 12 12"], HOLD) },
  },

  /* crescent cradling a small sun; the moon drifts over the sun */
  "sun-moon": {
    auto: false,
    dur: 1.9,
    parts: [
      circle(8.8, 8.8, 3.1),
      path("M8.8 3.6L8.8 4.7M3.6 8.8L4.7 8.8M5.3 5.3L6.1 6.1"),
      G("moon", [path("M20.3 15.9A6.6 6.6 0 1 1 11.9 7.5A5.2 5.2 0 0 0 20.3 15.9Z")]),
    ],
    gAnims: { moon: DIP(-1.2, -1.2) },
  },

  /* ring + inner disc; the disc transits across the face */
  eclipse: {
    auto: false,
    dur: 2,
    parts: [
      circle(12, 12, 8.4),
      A(circle(15, 12, 5.4, fill()), [an("cx", ["15", "15", "9.8", "15", "15"], HOLD)]),
    ],
  },

  /* hex-barrel pencil, eraser band, lead dot; it rocks on its point */
  pencil: {
    auto: false,
    dur: 1.7,
    parts: [
      G("pencil", [
        path("M5.2 18.8L5.8 15.7C6 15 6.4 14.4 7 13.9L16.5 4.4C17.3 3.6 18.6 3.6 19.4 4.4C20.2 5.2 20.2 6.5 19.4 7.3L9.9 16.8C9.4 17.3 8.8 17.7 8.1 17.9L5.2 18.8Z"),
        path("M15.6 5.3L18.8 8.5"),
        circle(5.9, 18.1, 0.7, fill()),
      ]),
    ],
    gAnims: { pencil: WIG(5.4, 18.6, 7) },
  },

  /* slim ballpoint with a pocket clip; it presses down to write */
  pen: {
    auto: false,
    dur: 1.6,
    parts: [
      G("pen", [
        path("M5.4 20.6L6.4 18.2C6.7 17.6 7.2 17.1 7.8 16.7L17.8 6.7C18.6 5.9 19.9 5.9 20.7 6.7C21.5 7.5 21.5 8.8 20.7 9.6L10.7 19.6C10.2 20.1 9.6 20.5 8.9 20.7L5.4 20.6Z"),
        path("M14.6 8.2L18.4 4.4"),
      ]),
    ],
    gAnims: { pen: DIP(-0.7, 0.7) },
  },

  /* nib resting on the bezier's first anchor; it presses while the curve traces */
  "pen-tool": {
    auto: false,
    dur: 2,
    parts: [
      /* a clean vector nib: one soft shield, the slit, a solid vent dot */
      DRAW(path("M7.2 20.8h9.6"), 0.3, 0.7),
      G("nib", [
        path("M12 3.4l5.6 8.6c-.9 2.4-2.8 4.4-5.6 5.6-2.8-1.2-4.7-3.2-5.6-5.6z"),
        line(12, 3.4, 12, 9.4),
        circle(12, 11.6, 1.4, fill()),
      ]),
    ],
    gAnims: { nib: tn("translate", ["0 0", "0 0", "-0.45 0.7", "0 0", "0 0"], [0, 0.18, 0.4, 0.6, 1]) },
  },

  /* chisel-tip marker; it glides while its fat stroke draws on */
  marker: {
    auto: false,
    dur: 1.9,
    parts: [
      G("pen", [
        path("M8.6 16L16.9 7.7C17.8 6.8 19.2 6.8 20.1 7.7C21 8.6 21 10 20.1 10.9L11.8 19.2L7.4 19.8L8.6 16Z"),
        path("M17.8 8.6L19.6 10.4"),
      ]),
      DRAWLINE(8.4, 21.6, 18.4, 21.6, 0.3, 0.68, { "stroke-width": 3 }),
    ],
    gAnims: { pen: tn("translate", ["0 0", "0 0", "1.5 0.4", "1.5 0.4", "0 0"], [0, 0.3, 0.62, 0.72, 1]) },
  },

  /* angled marker over a translucent stripe; the stripe draws under it */
  highlighter: {
    auto: false,
    dur: 1.6,
    parts: [
      G("pen", [path("M13.4 4.8l5.8 5.8-6.7 6.7-6.6.9.9-6.6z")]),
      line(4, 20.6, 12, 20.6),
    ],
    gAnims: { pen: tn("translate", ["0 0", "-0.8 0.8", "0 0"]) },
  },

  /* steep pencil, lone silhouette; it rocks on its point */
  "edit-2": {
    auto: false,
    dur: 1.6,
    parts: [
      G("pen", [
        path("M4.4 19.6L4.9 16.9C5.1 16.3 5.5 15.8 6 15.3L15.3 6C16 5.3 17.1 5.3 17.8 6L17.9 6.1C18.6 6.8 18.6 7.9 17.9 8.6L8.6 17.9C8.1 18.4 7.5 18.8 6.8 19L4.4 19.6Z"),
        path("M14.6 6.7L17.3 9.4"),
      ]),
    ],
    gAnims: { pen: WIG(4.9, 19.4, 7) },
  },

  /* pen + half baseline; the pen dips and the line writes on */
  "edit-3": {
    auto: false,
    dur: 1.8,
    parts: [
      G("pen", [
        path("M4.6 19.4L5.1 16.7C5.3 16 5.8 15.4 6.4 14.9L15.7 5.6C16.5 4.8 17.8 4.8 18.6 5.6L18.7 5.7C19.5 6.5 19.5 7.8 18.7 8.6L9.4 17.9C8.9 18.4 8.3 18.8 7.6 19L4.6 19.4Z"),
        path("M14.9 6.4L17.7 9.2"),
      ]),
      DRAWLINE(11.4, 20.8, 19.8, 20.8, 0.34, 0.66),
    ],
    gAnims: { pen: DIP(-0.5, 0.5) },
  },

  /* plume with a rib and barb nicks; it sways like it's writing */
  quill: {
    auto: false,
    dur: 1.8,
    parts: [
      G("feather", [
        path("M19.8 4.2C15.9 3.8 11.7 5.6 9 8.8C6.3 12 5.2 15.6 5.4 18.8L5.4 19.7C5.4 20.2 5.9 20.5 6.3 20.3L7.2 19.9C10.4 18.5 14 16.3 16.6 13.6C19.2 10.9 20.4 7.6 19.8 4.2Z"),
        path("M6.6 19.8C8.6 14.2 12.2 9.4 17.4 6.4"),
        path("M9.8 13.4L11 14.6M13.2 9.6L14.6 10.8"),
      ]),
    ],
    gAnims: { feather: WIG(6, 20, 6) },
  },

  /* big A + small a; the letters bounce like they're being typed */
  "font-case": {
    auto: false,
    dur: 1.8,
    parts: [
      G("capA", [
        path("M4.4 19.4L8.7 6.2C9 5.2 10.1 5.2 10.4 6.2L13.9 19.4"),
        line(6.9, 14.4, 11.7, 14.4),
      ]),
      G("lca", [
        path("M19.6 13.2C18.7 12.4 17.3 12.4 16.4 13.2C15.5 14 15.4 15.9 16.3 16.9C17.2 17.9 18.6 18 19.5 17.3"),
        line(19.6, 12.6, 19.6, 18.8),
      ]),
    ],
    gAnims: {
      capA: tn("translate", ["0 0", "0 0", "0 -0.9", "0 0", "0 0"], [0, 0.15, 0.33, 0.5, 1]),
      lca: tn("translate", ["0 0", "0 0", "0 -0.9", "0 0", "0 0"], [0, 0.5, 0.67, 0.84, 1]),
    },
  },

  /* clipboard; pasted lines type themselves in one by one */
  paste: {
    auto: false,
    dur: 1.9,
    parts: [
      rect(4.8, 5.8, 14.4, 15, 2.5),
      rect(8.4, 3.2, 7.2, 3.8, 1.9),
      DRAWLINE(8, 11.4, 15.8, 11.4, 0.16, 0.4),
      DRAWLINE(8, 14.8, 14.6, 14.8, 0.4, 0.62),
      DRAWLINE(8, 18.2, 12.8, 18.2, 0.62, 0.84),
    ],
  },
};
