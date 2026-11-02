const path = (d, a = {}) => ({ e: "path", a: { d, ...a } });
const circle = (cx, cy, r, a = {}) => ({ e: "circle", a: { cx, cy, r, ...a } });
const line = (x1, y1, x2, y2, a = {}) => ({ e: "line", a: { x1, y1, x2, y2, ...a } });
const rect = (x, y, w, h, rx, a = {}) => ({ e: "rect", a: { x, y, width: w, height: h, rx, ...a } });
const ellipse = (cx, cy, rx, ry, a = {}) => ({ e: "ellipse", a: { cx, cy, rx, ry, ...a } });
const fill = (color = "currentColor") => ({ fill: color, stroke: "none" });
const an = (attr, values, times) => ({ kind: "attr", attr, values, times });
const tn = (type, values, times, extra = {}) => ({ kind: "transform", type, values, times, ...extra });
const A = (part, anims) => ({ ...part, anims });
const G = (id, children, a = {}) => ({ e: "g", g: id, a, children });

/* ---- bespoke gesture idioms (same vocabulary as the craft batches) ---- */
const HOLD = [0, 0.3, 0.55, 0.8, 1];
/* scale-pop around a mark's own center (sAnims entry). */
const POP = (cx, cy, s = 1.24) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], HOLD),
});
/* wiggle — rotate −a then +a around a pivot, with rest holds (gAnims). */
const WIG = (cx, cy, a = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `0 ${cx} ${cy}`, `-${a} ${cx} ${cy}`, `${a - 2} ${cx} ${cy}`, `0 ${cx} ${cy}`], HOLD);
/* dip — translate out along an axis and spring back (gAnims). */
const DIP = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD);
/* blink — opacity dips once on a mark (for A()). */
const BLINK = (lo = 0.2) => [an("opacity", ["1", "1", `${lo}`, "1", "1"], [0, 0.32, 0.46, 0.6, 1])];
/* knob nudge — a slider handle travels a little along its track and back. */
const SLIDE = (dx, t0 = 0.34) =>
  tn("translate", ["0 0", "0 0", `${dx} 0`, "0 0", "0 0"], [0, t0, +(t0 + 0.18).toFixed(3), +(t0 + 0.34).toFixed(3), 1]);

/* Scan-frame corner brackets (matches scan-face / ai-scan geometry). */
const CORNERS = "M3.4 7.3L3.4 6C3.4 4.6 4.5 3.4 6 3.4L7.3 3.4M16.7 3.4L18 3.4C19.4 3.4 20.6 4.5 20.6 6L20.6 7.3M20.6 16.7L20.6 18C20.6 19.4 19.5 20.6 18 20.6L16.7 20.6M7.3 20.6L6 20.6C4.6 20.6 3.4 19.5 3.4 18L3.4 16.7";
const TL = "M3.4 7.3L3.4 6C3.4 4.6 4.5 3.4 6 3.4L7.3 3.4";
const TR = "M16.7 3.4L18 3.4C19.4 3.4 20.6 4.5 20.6 6L20.6 7.3";
const BR = "M20.6 16.7L20.6 18C20.6 19.4 19.5 20.6 18 20.6L16.7 20.6";
const BL = "M7.3 20.6L6 20.6C4.6 20.6 3.4 19.5 3.4 18L3.4 16.7";
/* the off-stroke shared by every *-off glyph (mic-off01/headphone-off idiom). */
const SLASH = line(3.6, 3.6, 20.4, 20.4);

/** Pen badge (STYLE.md accents): a hollow 45° pen, nib at (tx, ty), with a
 *  round back end. One shape for every *-pen / *-edit badge. */
const pen = (tx, ty, L = 9.4, w = 1.9, nl = 2.6) => {
  const r = (v) => +v.toFixed(2), k = Math.SQRT1_2;
  const P = (d, s) => `${r(tx + k * d + k * s)} ${r(ty - k * d + k * s)}`;
  return `M${tx} ${ty}L${P(nl, w)}L${P(L, w)}A${w} ${w} 0 0 0 ${P(L, -w)}L${P(nl, -w)}Z`;
};

export const icons = {
  /* ------------------------------ social ------------------------------ */

  /* upright # — hashtag's straighter sibling */
  hash: {
    dur: 1.4,
    parts: [
      line(9.8, 3.6, 8.6, 20.4),
      line(15.8, 3.6, 14.6, 20.4),
      line(4.4, 8.9, 19.7, 8.9),
      line(4.1, 15.1, 19.4, 15.1),
    ],
  },

  /* ------------------------------ devices ------------------------------ */

  /* >_ prompt in a rounded square; the cursor blinks */
  terminal: {
    auto: false,
    dur: 1.6,
    parts: [
      rect(2.8, 4, 18.4, 16, 2.6),
      path("M6.8 8.4L10.4 12L6.8 15.6"),
      A(line(12.8, 15.6, 17.4, 15.6), BLINK(0.15)),
    ],
  },

  /* ------------------------------ media ------------------------------ */

  /* the canon mic silhouette + slash — matches mic + mic-off01/02 */
  "mic-off": {
    dur: 1.5,
    parts: [
      path("M9 5A3 3 0 0 1 15 5L15 10.7A3 3 0 0 1 9 10.7L9 5Z"),
      path("M5.6 10.8A6.4 6.4 0 0 0 18.4 10.8"),
      line(12, 17.2, 12, 20.6),
      line(8.6, 20.6, 15.4, 20.6),
      SLASH,
    ],
  },

  /* canon video body + lens wedge + slash */
  "video-off": {
    dur: 1.5,
    parts: [
      path("M6.7 5.6L14.1 5.6C16 5.6 17.5 7.1 17.5 9L17.5 15C17.5 16.9 16 18.4 14.1 18.4L6.7 18.4C4.8 18.4 3.3 16.9 3.3 15L3.3 9C3.3 7.1 4.8 5.6 6.7 5.6Z"),
      path("M17.5 10.6L20.5 8.9C21.1 8.6 21.7 8.9 21.7 9.6L21.7 14.4C21.7 15.1 21.1 15.4 20.5 15.1L17.5 13.4"),
      circle(8.2, 12, 1.1, fill()),
      SLASH,
    ],
  },

  /* ------------------------------ messaging ------------------------------ */

  /* the family handset + slash */
  "phone-off": {
    dur: 1.5,
    parts: [
      path("M5 4.5L8 4.5L9.6 8.9L7.6 10.5A13.5 13.5 0 0 0 13.6 16.5L15.2 14.5L19.6 16.1L19.6 19.1A1.5 1.5 0 0 1 18 20.6A16.5 16.5 0 0 1 3.5 6.1A1.5 1.5 0 0 1 5 4.5Z"),
      SLASH,
    ],
  },

  /* envelope with the flap flipped up; the flap lifts open */
  "mail-open": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M3.2 10.6L3.2 17.6C3.2 19.4 4.6 20.8 6.4 20.8L17.6 20.8C19.4 20.8 20.8 19.4 20.8 17.6L20.8 10.6"),
      path("M3.4 10.8L10.8 15.3C11.5 15.7 12.5 15.7 13.2 15.3L20.6 10.8"),
      G("flap", [path("M3.2 10.6L11 4.5C11.6 4 12.4 4 13 4.5L20.8 10.6")]),
    ],
    gAnims: { flap: DIP(0, -1.4) },
  },

  /* square bubble with a soft tail at bottom-left */
  "message-square": {
    dur: 1.5,
    parts: [
      path("M5.4 4.8L18.6 4.8C20 4.8 21.1 5.9 21.1 7.3L21.1 15.3C21.1 16.7 20 17.8 18.6 17.8L8.6 17.8L4.2 21C3.7 21.4 3 21.1 3 20.4L3 7.3C3 5.9 4.1 4.8 5.4 4.8Z"),
    ],
  },

  /* ------------------------------ files ------------------------------ */

  /* floppy: clipped top-right corner, shutter up top, slot at the bottom */
  save: {
    dur: 1.5,
    parts: [
      path("M5.4 3.4L14.8 3.4C15.4 3.4 16 3.6 16.4 4.1L19.9 7.6C20.3 8 20.6 8.6 20.6 9.2L20.6 18.6C20.6 19.6 19.8 20.6 18.8 20.6L5.2 20.6C4.2 20.6 3.4 19.6 3.4 18.6L3.4 5.4C3.4 4.4 4.2 3.4 5.4 3.4Z"),
      rect(7.2, 3.4, 6.6, 5, 0.9),
      path("M7.6 20.6L7.6 16.4C7.6 16 8 15.6 8.4 15.6L15.6 15.6C16 15.6 16.4 16 16.4 16.4L16.4 20.6"),
    ],
  },

  /* tabbed folder with the front flap tipped open */
  "folder-open": {
    auto: false,
    dur: 1.6,
    parts: [
      path("M3.6 18L3.6 6.2C3.6 5 4.6 4 5.8 4L9.7 4C10.3 4 10.8 4.2 11.2 4.7L12 5.8C12.4 6.3 12.9 6.5 13.5 6.5L18.2 6.5C19.4 6.5 20.4 7.5 20.4 8.7L20.4 9.8"),
      G("flap", [
        path("M5.9 13.9L7.6 10.9C8 10.2 8.7 9.8 9.5 9.8L19.3 9.8C20.4 9.8 21.2 10.9 20.9 11.9L19.3 18.9C19 20 18 20.8 16.9 20.8L5 20.8C3.9 20.8 3.1 19.7 3.4 18.7Z"),
      ]),
    ],
    gAnims: { flap: tn("rotate", ["0 4.5 20.8", "0 4.5 20.8", "-5 4.5 20.8", "0 4.5 20.8", "0 4.5 20.8"], HOLD) },
  },

  /* canon file silhouette + centered plus — file-add's twin name */
  "file-plus": {
    dur: 1.5,
    parts: [
      path("M7.7 3L12.6 3C13.1 3.1 13.6 3.3 14 3.7L18.3 8C18.7 8.5 19 9 19 9.6L19 18.3C19 19.8 17.8 21 16.3 21L7.7 21C6.2 21 5 19.8 5 18.3L5 5.7C5 4.2 6.2 3 7.7 3Z"),
      path("M13.5 3.2L13.5 6.1C13.5 7.9 15 9.3 16.8 9.3L19 9.3"),
      path("M12 11.8L12 16.8M9.5 14.3L14.5 14.3"),
    ],
  },

  /* spiral-pad notebook with a pen across the bottom corner */
  "notebook-pen": {
    dur: 1.6,
    parts: [
      path("M9.8 20.8H7c-1.2 0-2.2-1-2.2-2.2V5.4c0-1.2 1-2.2 2.2-2.2h9c1.2 0 2.2 1 2.2 2.2v4.8"),
      path("M2.7 6.6L4.8 6.6M2.7 10L4.8 10M2.7 13.4L4.8 13.4M2.7 16.8L4.8 16.8"),
      path(pen(12.8, 21.2)),
    ],
  },

  /* ------------------------------ education ------------------------------ */

  /* shelf books at staggered heights, rightmost leaning */
  "library": { dur: 1.4, auto: true, parts: [
    rect(3, 4.5, 4.2, 15.5, 1.2),
    rect(8.8, 4.5, 4.2, 15.5, 1.2),
    rect(14.2, 5, 4.2, 15, 1.2, { transform: "rotate(10 16.3 20)" }),
  ] },

  /* ------------------------------ time ------------------------------ */

  /* plain circle + top bar; the hand sweeps up-right and eases back */
  timer: {
    auto: false,
    dur: 1.7,
    parts: [
      line(10, 3.4, 14, 3.4),
      circle(12, 13.6, 7.7),
      G("hand", [line(12, 13.6, 15.1, 10.5)]),
    ],
    gAnims: { hand: tn("rotate", ["0 12 13.6", "0 12 13.6", "34 12 13.6", "0 12 13.6", "0 12 13.6"], HOLD) },
  },

  /* circle + knob stem; the hand ticks back then returns */
  stopwatch: {
    auto: false,
    dur: 1.7,
    parts: [
      line(10.4, 3.2, 13.6, 3.2),
      line(12, 3.2, 12, 5.6),
      circle(12, 13.8, 7.4),
      G("hand", [line(12, 13.8, 9.6, 11.2)]),
    ],
    gAnims: { hand: tn("rotate", ["0 12 13.8", "0 12 13.8", "-30 12 13.8", "0 12 13.8", "0 12 13.8"], HOLD) },
  },

  /* counter-clockwise rewind arc + clock hands that tick backwards */
  history: {
    auto: false,
    dur: 1.8,
    parts: [
      path("M3.5 3.4L3.5 8.4L8.5 8.4"),
      path("M3.5 13A8.5 8.5 0 1 0 6.1 5.6L3.5 8.4"),
      G("hands", [path("M12 8.2L12 12.6L15.2 14.6")]),
    ],
    gAnims: { hands: tn("rotate", ["0 12 12.6", "0 12 12.6", "-40 12 12.6", "0 12 12.6", "0 12 12.6"], HOLD) },
  },

  /* ------------------------------ ui ------------------------------ */

  /* soft scissors — the two halves snip shut around the pivot */
  scissors: {
    auto: false,
    dur: 1.7,
    parts: [
      G("lft", [
        circle(7.2, 17.6, 2.5),
        path("M9.4 16.4C11.7 13.8 15.6 8.2 18.8 4.9"),
      ]),
      G("rgt", [
        circle(16.8, 17.6, 2.5),
        path("M14.6 16.4C12.3 13.8 8.4 8.2 5.2 4.9"),
      ]),
    ],
    gAnims: {
      lft: tn("rotate", ["0 12 10.7", "0 12 10.7", "7 12 10.7", "0 12 10.7", "0 12 10.7"], HOLD),
      rgt: tn("rotate", ["0 12 10.7", "0 12 10.7", "-7 12 10.7", "0 12 10.7", "0 12 10.7"], HOLD),
    },
  },

  /* diagonal ruler with three tick marks on the top edge */
  ruler: {
    dur: 1.5,
    parts: [
      path("M3.6 14.9L14.9 3.6C15.8 2.7 17.2 2.7 18.1 3.6L20.4 5.9C21.3 6.8 21.3 8.2 20.4 9.1L9.1 20.4C8.2 21.3 6.8 21.3 5.9 20.4L3.6 18.1C2.7 17.2 2.7 15.8 3.6 14.9Z"),
      path("M6.4 12.1L7.7 13.4M9.25 9.25L10.55 10.55M12.1 6.4L13.4 7.7"),
    ],
  },

  /* plump pencil above a baseline; it rocks on its tip like it's writing */
  "pen-line": {
    auto: false,
    dur: 1.6,
    parts: [
      G("pen", [
        path("M4.6 17.6L5.1 15.9C5.4 14.9 6.2 14 7.1 13.2L15.3 5C16.2 4.1 17.6 4.1 18.5 5L18.7 5.2C19.6 6.1 19.6 7.5 18.7 8.4L10.5 16.6C9.7 17.5 8.8 18.4 7.8 18.6L6.1 19.1C5.3 19.3 4.7 18.8 4.6 17.6Z"),
        path("M14.2 6.2L17.8 9.8"),
      ]),
      line(4.5, 21.1, 19.5, 21.1),
    ],
    gAnims: { pen: WIG(6, 17.5, 6) },
  },

  /* rounded square + the family check */
  "square-check": {
    dur: 1.4,
    parts: [
      rect(3.5, 3.5, 17, 17, 2.7),
      path("M8.4 12.5L11.3 15.4L16.1 9.6"),
    ],
  },

  /* ring + a dot that pulses */
  "circle-dot": {
    auto: false,
    dur: 1.6,
    parts: [
      circle(12, 12, 8.5),
      G("dot", [circle(12, 12, 1.5, fill())]),
    ],
    sAnims: { dot: POP(12, 12, 1.3) },
  },

  /* three tracks, three knobs — each nudges along its own rail */
  "sliders-horizontal": {
    auto: false,
    dur: 1.8,
    parts: [
      line(3.4, 6, 9.4, 6),
      line(14.6, 6, 20.6, 6),
      line(3.4, 12, 8.4, 12),
      line(13.6, 12, 20.6, 12),
      line(3.4, 18, 14.4, 18),
      line(19.6, 18, 20.6, 18),
      G("k1", [line(12, 4.2, 12, 7.8)]),
      G("k2", [line(11, 10.2, 11, 13.8)]),
      G("k3", [line(17, 16.2, 17, 19.8)]),
    ],
    gAnims: {
      k1: SLIDE(1.4, 0.3),
      k2: SLIDE(-1.4, 0.42),
      k3: SLIDE(1.2, 0.54),
    },
  },

  /* settings-2: two slider rows with circle knobs */
  "settings-2": {
    auto: false,
    dur: 1.8,
    parts: [
      line(11.6, 7, 20.2, 7),
      line(3.8, 17, 12.6, 17),
      G("k1", [circle(8, 7, 3.1)]),
      G("k2", [circle(16, 17, 3.1)]),
    ],
    gAnims: {
      k1: SLIDE(1.5, 0.34),
      k2: SLIDE(-1.5, 0.46),
    },
  },

  /* fullscreen brackets; the corners breathe inward */
  scan: {
    auto: false,
    dur: 1.9,
    parts: [
      G("tl", [path(TL)]),
      G("tr", [path(TR)]),
      G("br", [path(BR)]),
      G("bl", [path(BL)]),
    ],
    gAnims: {
      tl: DIP(0.7, 0.7),
      tr: DIP(-0.7, 0.7),
      br: DIP(-0.7, -0.7),
      bl: DIP(0.7, -0.7),
    },
  },

  /* brackets + a beam that sweeps top to bottom */
  "scan-line": {
    auto: false,
    dur: 1.8,
    parts: [
      path(CORNERS),
      G("beam", [line(3.4, 12, 20.6, 12)]),
    ],
    gAnims: { beam: tn("translate", ["0 -4.8", "0 4.8", "0 -4.8"], [0, 0.5, 1]) },
  },

  /* six-point asterisk */
  asterisk: {
    dur: 1.4,
    parts: [
      line(12, 4.4, 12, 19.6),
      line(5.3, 8.2, 18.7, 15.8),
      line(18.7, 8.2, 5.3, 15.8),
    ],
  },

  /* slash + two rings on the diagonal */
  percent: {
    dur: 1.4,
    parts: [
      line(18.5, 5.5, 5.5, 18.5),
      circle(6.8, 6.8, 2.8),
      circle(17.2, 17.2, 2.8),
    ],
  },

  /* bar + dot above + dot below */
  divide: {
    dur: 1.4,
    parts: [
      circle(12, 6.4, 1.25, fill()),
      line(4.2, 12, 19.8, 12),
      circle(12, 17.6, 1.25, fill()),
    ],
  },

  /* two level bars */
  equal: {
    dur: 1.4,
    parts: [line(4.4, 8.4, 19.6, 8.4), line(4.4, 15.6, 19.6, 15.6)],
  },

  /* figure-eight lemniscate, one continuous stroke */
  infinity: {
    dur: 1.6,
    parts: [
      path("M6.5 8.5C4.5 8.5 3 10 3 12S4.5 15.5 6.5 15.5C8.7 15.5 10.3 13.8 12 12C13.7 10.2 15.3 8.5 17.5 8.5C19.5 8.5 21 10 21 12S19.5 15.5 17.5 15.5C15.3 15.5 13.7 13.8 12 12C10.3 10.2 8.7 8.5 6.5 8.5Z"),
    ],
  },

  /* ------------------------------ commerce ------------------------------ */

  /* three finder squares + a bottom-right data block; cells flicker */
  "qr-code": {
    auto: false,
    dur: 1.9,
    parts: [
      rect(3.4, 3.4, 6.4, 6.4, 1.4),
      rect(14.2, 3.4, 6.4, 6.4, 1.4),
      rect(3.4, 14.2, 6.4, 6.4, 1.4),
      A(rect(14.2, 14.2, 2.6, 2.6, 0.7), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.3, 0.42, 0.54, 1])]),
      A(rect(18, 18, 2.6, 2.6, 0.7), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.48, 0.6, 0.72, 1])]),
      rect(14.2, 18.6, 2, 2, 0.5),
      rect(18.6, 14.2, 2, 2, 0.5),
    ],
  },

  /* paper slip with a zigzag bottom edge and two lines of text */
  receipt: {
    dur: 1.5,
    parts: [
      path("M6 3.4L18 3.4C18.6 3.4 19 3.8 19 4.4L19 20.4L17.2 19.2L15.4 20.4L13.6 19.2L11.8 20.4L10 19.2L8.2 20.4L6.4 19.2L4.6 20.4L4.6 4.4C4.6 3.8 5 3.4 5.6 3.4Z"),
      path("M8.4 8.6L15.6 8.6M8.4 12.6L15.6 12.6M8.4 16.2L13 16.2"),
    ],
  },

  /* ------------------------------ type ------------------------------ */

  /* B with two plump bowls */
  bold: {
    dur: 1.5,
    parts: [
      path("M6.4 4.4L13.4 4.4C15.8 4.4 17.7 6.3 17.7 8.6S15.8 12.8 13.4 12.8L6.4 12.8"),
      path("M6.4 12.8L14.4 12.8C17 12.8 19 14.8 19 17.1S17 21.4 14.4 21.4L6.4 21.4"),
      line(6.4, 4.4, 6.4, 21.4),
    ],
  },

  /* leaning stem with shifted caps */
  italic: {
    dur: 1.4,
    parts: [
      line(10.5, 4.2, 17.5, 4.2),
      line(14.2, 4.2, 9.8, 19.8),
      line(6.5, 19.8, 13.5, 19.8),
    ],
  },

  /* U-bowl over a baseline */
  underline: {
    dur: 1.4,
    parts: [
      path("M6.4 4.2L6.4 10.8C6.4 14.2 8.9 16.4 12 16.4S17.6 14.2 17.6 10.8L17.6 4.2"),
      line(4.6, 20.4, 19.4, 20.4),
    ],
  },

  /* S-curl + bowl, struck through the middle */
  strikethrough: {
    dur: 1.5,
    parts: [
      path("M16.8 5L9.8 5C8.3 5 7.2 6.1 7.2 7.5C7.2 8.9 8 9.9 9.1 10.4"),
      path("M14.6 12.6C16.4 12.6 17.8 14 17.8 15.8C17.8 18.2 15.9 20 13.4 20L7.2 20"),
      line(3.6, 12, 20.4, 12),
    ],
  },

  /* sigma with corner ticks */
  sigma: {
    dur: 1.5,
    parts: [
      path("M17.2 7L17.2 5L6.8 5L11.9 11.3C12.2 11.7 12.2 12.3 11.9 12.7L6.8 19L17.2 19L17.2 16.8"),
    ],
  },

  /* pi: top bar with curled ends, two legs */
  pi: {
    dur: 1.5,
    parts: [
      path("M5.4 6.6C5.4 5.7 6.1 5 7 5L17 5C17.9 5 18.6 5.7 18.6 6.6"),
      line(9.4, 7.4, 9.4, 19.4),
      line(14.6, 7.4, 14.6, 19.4),
    ],
  },
};
