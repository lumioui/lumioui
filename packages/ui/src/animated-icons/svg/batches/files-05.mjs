/* files-05 — the files/folders/lists/messages/docs wave.
   Silhouettes are shared with the sibling batches: DOC/FOLD with files-01..03,
   FOLDER with slice-f, MSQ with fundamentals-c, MC with gaps-b, ENV with
   messaging-03, CAL with time-01, PIN with wayfinding-04.
   Badge/verb idioms are the same HOLD-family phrasing.
   (phone-* and list-collapse/list-tree live in basics-01/editor-01.) */

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

/* ---- idioms (same vocabulary as work-01 / slice-f) ---- */
const HOLD = [0, 0.3, 0.55, 0.8, 1];
const POP = (cx, cy, s = 1.24) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], HOLD),
});
const WIG = (cx, cy, a = 9) =>
  tn("rotate", [`0 ${cx} ${cy}`, `0 ${cx} ${cy}`, `-${a} ${cx} ${cy}`, `${a - 2} ${cx} ${cy}`, `0 ${cx} ${cy}`], HOLD);
const DIP = (dx, dy) => tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], HOLD);
const SHIFT = (p, dx, dy, t = HOLD) => A(p, [tn("translate", ["0 0", "0 0", `${dx} ${dy}`, "0 0", "0 0"], t)]);
const DRAW = (p, t0 = 0.15, t1 = 0.62) =>
  A({ ...p, a: { ...p.a, pathLength: 1, "stroke-dasharray": 1 } }, [
    an("stroke-dashoffset", ["1", "1", "0", "0"], [0, t0, t1, 1]),
  ]);
const BLINK = (lo = 0.2) => [an("opacity", ["1", "1", `${lo}`, "1", "1"], [0, 0.32, 0.46, 0.6, 1])];
const RIPPLE = (cx, cy, t0, s = 1.18) => ({
  pivot: [cx, cy],
  anim: tn("scale", ["1", "1", `${s}`, "1", "1"], [0, t0, +(t0 + 0.13).toFixed(3), +(t0 + 0.3).toFixed(3), 1]),
});
const SPIN = (cx, cy) => tn("rotate", [`0 ${cx} ${cy}`, `360 ${cx} ${cy}`, `0 ${cx} ${cy}`], [0, 0.97, 1]);
const PULSE = (t0) => [an("opacity", ["1", "1", "0.3", "1", "1"], [0, t0, +(t0 + 0.12).toFixed(3), +(t0 + 0.26).toFixed(3), 1])];
/* ratchet — stepped rotation, two clicks per loop (cogs). */
const RATCHET = (cx, cy, step = 60) =>
  tn(
    "rotate",
    [`0 ${cx} ${cy}`, `0 ${cx} ${cy}`, `${step} ${cx} ${cy}`, `${step} ${cx} ${cy}`, `${step * 2} ${cx} ${cy}`, `${step * 2} ${cx} ${cy}`],
    [0, 0.26, 0.4, 0.66, 0.8, 1],
  );

/* small bloom for cog badges — same cosine-lobe recipe as files-01. */
const bloom = (cx, cy, lobes, rMid, amp, steps = 10) => {
  const pts = [];
  for (let i = 0; i < lobes * steps; i++) {
    const t = (i / (lobes * steps)) * Math.PI * 2;
    const r = rMid + amp * Math.cos(lobes * t + Math.PI / 2);
    pts.push(`${(cx + r * Math.cos(t)).toFixed(2)} ${(cy + r * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
};

/* ---- shared silhouettes ---- */

/* closed document body + dogear (files-01 family). */
const DOC =
  "M7.7 3L12.6 3C13.1 3.1 13.6 3.3 14 3.7L18.3 8C18.7 8.5 19 9 19 9.6L19 18.3C19 19.8 17.8 21 16.3 21L7.7 21C6.2 21 5 19.8 5 18.3L5 5.7C5 4.2 6.2 3 7.7 3Z";
const FOLD = "M13.5 3.2L13.5 6.1C13.5 7.9 15 9.3 16.8 9.3L19 9.3";
/* document with the bottom-right corner open for a badge (x~13.4+, y~14.5+). */
const DOC_BR =
  "M11.8 21H7.7C6.2 21 5 19.8 5 18.3V5.7C5 4.2 6.2 3 7.7 3H12.6C13.1 3.1 13.6 3.3 14 3.7L18.3 8C18.7 8.5 19 9 19 9.6V12.4";
/* document with the lower-left edge open for an in/out arrow (x~2.5-10, y~13-20). */
const DOC_L =
  "M5 10.4L5 5.7C5 4.2 6.2 3 7.7 3L12.6 3C13.1 3.1 13.6 3.3 14 3.7L18.3 8C18.7 8.5 19 9 19 9.6L19 18.3C19 19.8 17.8 21 16.3 21L13.6 21";

/* closed folder (slice-f family) + variants that open an edge for a badge. */
const FOLDER =
  "M3.6 18.6L3.6 6.2C3.6 5 4.6 4 5.8 4L9.6 4C10.2 4 10.7 4.2 11.1 4.7L12.1 5.9C12.5 6.4 13 6.6 13.6 6.6L18.2 6.6C19.4 6.6 20.4 7.6 20.4 8.9L20.4 18.6C20.4 19.8 19.4 20.8 18.2 20.8L5.8 20.8C4.6 20.8 3.6 19.8 3.6 18.6Z";
/* folder, bottom-right corner open (badge x~13+, y~14+). */
const FOL_BR =
  "M10.6 20.8H5.8C4.6 20.8 3.6 19.8 3.6 18.6L3.6 6.2C3.6 5 4.6 4 5.8 4L9.6 4C10.2 4 10.7 4.2 11.1 4.7L12.1 5.9C12.5 6.4 13 6.6 13.6 6.6L18.2 6.6C19.4 6.6 20.4 7.6 20.4 8.9L20.4 13.6";
/* folder, lower-left edge open (arrow zone x~2.5-11, y~12.5-19.5). */
const FOL_IN =
  "M3.6 11.2L3.6 6.2C3.6 5 4.6 4 5.8 4L9.6 4C10.2 4 10.7 4.2 11.1 4.7L12.1 5.9C12.5 6.4 13 6.6 13.6 6.6L18.2 6.6C19.4 6.6 20.4 7.6 20.4 8.9L20.4 18.6C20.4 19.8 19.4 20.8 18.2 20.8L10.2 20.8";
/* open folder: back panel + front flap (fundamentals-c folder-open family). */
const FLB =
  "M3.6 18L3.6 6.2C3.6 5 4.6 4 5.8 4L9.7 4C10.3 4 10.8 4.2 11.2 4.7L12 5.8C12.4 6.3 12.9 6.5 13.5 6.5L18.2 6.5C19.4 6.5 20.4 7.5 20.4 8.7L20.4 9.8";
const FLF =
  "M5.9 13.9L7.6 10.9C8 10.2 8.7 9.8 9.5 9.8L19.3 9.8C20.4 9.8 21.2 10.9 20.9 11.9L19.3 18.9C19 20 18 20.8 16.9 20.8L5 20.8C3.9 20.8 3.1 19.7 3.4 18.7Z";

/* square bubble (fundamentals-c) + badge-open variants. */
const MSQ =
  "M5.4 4.8L18.6 4.8C20 4.8 21.1 5.9 21.1 7.3L21.1 15.3C21.1 16.7 20 17.8 18.6 17.8L8.6 17.8L4.2 21C3.7 21.4 3 21.1 3 20.4L3 7.3C3 5.9 4.1 4.8 5.4 4.8Z";
/* square bubble, top-right corner open (badge x~13.5+, y~2.5-10). */
const MSQ_TR =
  "M12.4 4.8L5.4 4.8C4.1 4.8 3 5.9 3 7.3L3 20.4C3 21.1 3.7 21.4 4.2 21L8.6 17.8L18.6 17.8C20 17.8 21.1 16.7 21.1 15.3L21.1 11.4";
/* square bubble, bottom-right corner open (badge x~13+, y~13+). */
const MSQ_BR =
  "M12.2 17.8L8.6 17.8L4.2 21C3.7 21.4 3 21.1 3 20.4L3 7.3C3 5.9 4.1 4.8 5.4 4.8L18.6 4.8C20 4.8 21.1 5.9 21.1 7.3L21.1 11.4";
/* round bubble (gaps-b). */
const MC = "M8.6 19.6A8.6 8.6 0 1 0 4.5 16.1L3.3 21.2Z";

/* envelope (messaging-03): body leaves the right side clear for badges. */
const ENV_BOX = rect(3, 6.8, 14.4, 12.4, 2);
const FLAP = "M3.4 7.6L10.6 12.8C11.3 13.3 12.3 13.3 13 12.8L17.7 9.3";

/* calendar (time-01): body, hangers, divider; CAL_OPEN clears bottom-right. */
const CAL =
  "M5.6 5.4L18.4 5.4C19.9 5.4 21.1 6.6 21.1 8.1L21.1 17.9C21.1 19.4 19.9 20.6 18.4 20.6L5.6 20.6C4.1 20.6 2.9 19.4 2.9 17.9L2.9 8.1C2.9 6.6 4.1 5.4 5.6 5.4Z";
const CAL_OPEN =
  "M21.1 13.4L21.1 8.1C21.1 6.6 19.9 5.4 18.4 5.4L5.6 5.4C4.1 5.4 2.9 6.6 2.9 8.1L2.9 17.9C2.9 19.4 4.1 20.6 5.6 20.6L13.5 20.6";
const POSTS = "M8.2 3.6L8.2 7.6M15.8 3.6L15.8 7.6";

/* map pin (wayfinding-04): bulb center (12,10.2) r7.3, tip (12,21.5). */
const PIN =
  "M12 21.5C12 21.5 19.3 15.4 19.3 10.2A7.3 7.3 0 1 0 4.7 10.2C4.7 15.4 12 21.5 12 21.5Z";
const PIN_LENS = circle(12, 10.2, 2.8);
/* pin with the lower-right arc open for a badge (x~14.5+, y~15.5+). */
const PIN_BR =
  "M18.6 13.9C18.9 13.1 19.3 11.5 19.3 10.2A7.3 7.3 0 1 0 4.7 10.2C4.7 15.4 12 21.5 12 21.5C12.4 21 13.2 20.3 14.2 19.4";

/* heart marks at the two common sizes. */
const HEART_C = (cx, cy, s = 1) =>
  `M${cx} ${cy + 2.9 * s}S${cx - 3.4 * s} ${cy + 0.6 * s} ${cx - 3.8 * s} ${cy - 1.2 * s}C${cx - 4.2 * s} ${cy - 2.7 * s} ${cx - 3.1 * s} ${cy - 3.7 * s} ${cx - 2 * s} ${cy - 3.7 * s}C${cx - 1.2 * s} ${cy - 3.7 * s} ${cx - 0.5 * s} ${cy - 3.3 * s} ${cx - 0.1 * s} ${cy - 2.7 * s}C${cx + 0.3 * s} ${cy - 3.3 * s} ${cx + 1 * s} ${cy - 3.7 * s} ${cx + 1.8 * s} ${cy - 3.7 * s}C${cx + 2.9 * s} ${cy - 3.7 * s} ${cx + 4 * s} ${cy - 2.7 * s} ${cx + 3.6 * s} ${cy - 1.2 * s}C${cx + 3.2 * s} ${cy + 0.6 * s} ${cx} ${cy + 2.9 * s} ${cx} ${cy + 2.9 * s}Z`;

/* tiny braces for json marks — drawn open/close around (cx). */
const BRACE_L = (x, y) => `M${x} ${y}C${x - 0.6} ${y} ${x - 1} ${y + 0.4} ${x - 1} ${y + 0.9}L${x - 1} ${y + 1.9}C${x - 1} ${y + 2.5} ${x - 1.6} ${y + 3.1} ${x - 2.2} ${y + 3.1}C${x - 1.6} ${y + 3.1} ${x - 1} ${y + 3.7} ${x - 1} ${y + 4.3}L${x - 1} ${y + 5.3}C${x - 1} ${y + 5.8} ${x - 0.6} ${y + 6.2} ${x} ${y + 6.2}`;
const BRACE_R = (x, y) => `M${x} ${y}C${x + 0.6} ${y} ${x + 1} ${y + 0.4} ${x + 1} ${y + 0.9}L${x + 1} ${y + 1.9}C${x + 1} ${y + 2.5} ${x + 1.6} ${y + 3.1} ${x + 2.2} ${y + 3.1}C${x + 1.6} ${y + 3.1} ${x + 1} ${y + 3.7} ${x + 1} ${y + 4.3}L${x + 1} ${y + 5.3}C${x + 1} ${y + 5.8} ${x + 0.6} ${y + 6.2} ${x} ${y + 6.2}`;

/* three list rows; marks live left of x~9 or at a specific row. */
const ROWS_3 = [line(12.4, 5.6, 20.8, 5.6), line(12.4, 12, 20.8, 12), line(12.4, 18.4, 20.8, 18.4)];

/** Small cog (STYLE.md accents): ring + 6 short spokes. A scalloped bloom
 *  under ~10px fuses into a blob; spokes stay readable down to 16px. */
const cog = (cx, cy, s = 1) => {
  const r = (v) => +v.toFixed(2);
  let d = "";
  for (let i = 0; i < 6; i++) {
    const t = (i / 6 + 1 / 12) * Math.PI * 2;
    d += `M${r(cx + 3.3 * s * Math.cos(t))} ${r(cy + 3.3 * s * Math.sin(t))}L${r(cx + 3.9 * s * Math.cos(t))} ${r(cy + 3.9 * s * Math.sin(t))}`;
  }
  return [circle(cx, cy, r(2.3 * s)), path(d)];
};

/** Pen badge (STYLE.md accents): a hollow 45° pen, nib at (tx, ty), with a
 *  round back end. One shape for every *-pen / *-edit badge. */
const pen = (tx, ty, L = 9.4, w = 1.9, nl = 2.6) => {
  const r = (v) => +v.toFixed(2), k = Math.SQRT1_2;
  const P = (d, s) => `${r(tx + k * d + k * s)} ${r(ty - k * d + k * s)}`;
  return `M${tx} ${ty}L${P(nl, w)}L${P(L, w)}A${w} ${w} 0 0 0 ${P(L, -w)}L${P(nl, -w)}Z`;
};

export const icons = {
  /* ------------------------------ files ------------------------------ */

  /* two sheets sliding in from behind each other. */
  files: {
    dur: 1.5,
    auto: false,
    parts: [
      path("M10.2 4.4L13.2 4.4C13.6 4.4 14 4.5 14.3 4.8L17.7 8.2C18 8.5 18.2 8.9 18.2 9.3L18.2 17.2C18.2 18.3 17.3 19.2 16.2 19.2L10.2 19.2C9.1 19.2 8.2 18.3 8.2 17.2L8.2 6.4C8.2 5.3 9.1 4.4 10.2 4.4Z"),
      path("M13.9 4.6L13.9 6.6C13.9 7.5 14.6 8.2 15.5 8.2L17.8 8.2"),
      G("back", [
        path("M6.4 7.4L4.8 7.4C3.9 7.4 3.2 8.1 3.2 9L3.2 19.4C3.2 20.3 3.9 21 4.8 21L11.8 21C12.7 21 13.4 20.3 13.4 19.4L13.4 18.6"),
      ]),
    ],
    gAnims: { back: tn("translate", ["-1.1 -1.1", "-1.1 -1.1", "0 0", "0 0"], [0, 0.4, 0.75, 1]) },
  },

  /* three staggered sheets. */
  "file-stack": {
    dur: 1.5,
    auto: false,
    parts: [
      G("back", [
        path("M5.2 11.8L4.4 11.8C3.7 11.8 3.2 12.3 3.2 13L3.2 20.4C3.2 21 3.7 21.5 4.4 21.5L10.8 21.5C11.3 21.5 11.4 21.2 11.4 20.7"),
      ]),
      G("mid", [
        path("M10.4 7.8L9.4 7.8C8.8 7.8 8.4 8.2 8.4 8.8L8.4 16.4C8.4 16.9 8.8 17.4 9.4 17.4L15.4 17.4C16 17.4 16.4 16.9 16.4 16.4L16.4 15.8"),
      ]),
      path("M13.4 3L15.8 3C16.3 3 16.7 3.2 17 3.5L20.1 6.6C20.4 6.9 20.6 7.3 20.6 7.8L20.6 11.8C20.6 12.4 20.1 12.8 19.6 12.8L13.4 12.8C12.8 12.8 12.4 12.4 12.4 11.8L12.4 4C12.4 3.4 12.8 3 13.4 3Z"),
      path("M16.8 3.2L16.8 5.4C16.8 6.3 17.5 7 18.4 7L20.4 7"),
    ],
    gAnims: {
      back: tn("translate", ["-1.2 -1.2", "-1.2 -1.2", "0 0", "0 0"], [0, 0.42, 0.78, 1]),
      mid: tn("translate", ["-0.6 -0.6", "-0.6 -0.6", "0 0", "0 0"], [0, 0.32, 0.68, 1]),
    },
  },

  "file-down": {
    dur: 1.5,
    auto: false,
    parts: [
      path(DOC),
      path(FOLD),
      G("arrow", [line(12, 13.2, 12, 17.8), path("M9.8 15.6L12 17.8L14.2 15.6")]),
    ],
    gAnims: { arrow: DIP(0, 1.1) },
  },

  "file-up": {
    dur: 1.5,
    auto: false,
    parts: [
      path(DOC),
      path(FOLD),
      G("arrow", [line(12, 18, 12, 13.4), path("M9.8 15.6L12 13.4L14.2 15.6")]),
    ],
    gAnims: { arrow: DIP(0, -1.1) },
  },

  "file-heart": {
    dur: 1.5,
    auto: false,
    parts: [
      path(DOC_BR),
      path(FOLD),
      G("pop", [path(HEART_C(17.2, 17.6, 0.92))]),
    ],
    sAnims: { pop: POP(17.2, 17.6) },
  },

  "file-user": {
    dur: 1.5,
    auto: false,
    parts: [
      path(DOC),
      path(FOLD),
      G("pop", [
        circle(12, 13.6, 2.3),
        path("M8.9 19.6C9.4 17.7 10.6 16.7 12 16.7C13.4 16.7 14.6 17.7 15.1 19.6"),
      ]),
    ],
    sAnims: { pop: POP(12, 15.4, 1.14) },
  },

  "file-cog": {
    dur: 2,
    auto: false,
    parts: [
      /* the sheet stops short of the cog: 2px of air, no stroke beneath it */
      path("M11.8 21H7.7C6.2 21 5 19.8 5 18.3V5.7C5 4.2 6.2 3 7.7 3H12.6C13.1 3.1 13.6 3.3 14 3.7L18.3 8C18.7 8.5 19 9 19 9.6V10.9"),
      path(FOLD),
      G("cog", cog(17.6, 17.6, 0.9)),
    ],
    gAnims: { cog: RATCHET(17.6, 17.6) },
  },

  "file-digit": {
    dur: 1.4,
    auto: false,
    parts: [
      path(DOC),
      path(FOLD),
      G("one", [path("M10.8 15.2L12.2 14L12.2 18.8"), line(10.4, 18.8, 13.8, 18.8)]),
    ],
    sAnims: { one: POP(12, 16.6, 1.12) },
  },

  "file-terminal": {
    dur: 1.6,
    auto: false,
    parts: [
      path(DOC),
      path(FOLD),
      G("prompt", [path("M8.6 16L10.4 14.2L8.6 12.4"), A(line(11.8, 17, 16.2, 17), BLINK(0.15))]),
    ],
    sAnims: { prompt: POP(12, 14.8, 1.1) },
  },

  "file-type": {
    dur: 1.5,
    auto: false,
    parts: [
      path(DOC),
      path(FOLD),
      G("t", [
        path("M9.8 12.8L9.8 12.3C9.8 12 10 11.8 10.3 11.8L13.7 11.8C14 11.8 14.2 12 14.2 12.3L14.2 12.8"),
        line(12, 12.2, 12, 17.8),
        line(11.2, 17.8, 12.8, 17.8),
      ]),
    ],
    sAnims: { t: POP(12, 15, 1.1) },
  },

  "file-type-2": {
    dur: 1.5,
    auto: false,
    parts: [
      path(DOC_BR),
      path(FOLD),
      G("t", [
        path("M15.5 15.4L15.5 15C15.5 14.8 15.7 14.6 15.9 14.6L19.3 14.6C19.5 14.6 19.7 14.8 19.7 15L19.7 15.4"),
        line(17.6, 15, 17.6, 19.8),
        line(16.8, 19.8, 18.4, 19.8),
      ]),
    ],
    sAnims: { t: POP(17.6, 17.4, 1.14) },
  },

  "file-json": {
    dur: 1.5,
    auto: false,
    parts: [
      path(DOC),
      path(FOLD),
      G("braces", [
        path(BRACE_L(11, 12.2)),
        path(BRACE_R(13, 12.2)),
        circle(12, 15.2, 0.5, fill()),
        circle(12, 16.6, 0.5, fill()),
      ]),
    ],
    sAnims: { braces: POP(12, 15.5, 1.1) },
  },

  "file-json-2": {
    dur: 1.5,
    auto: false,
    parts: [
      path(DOC_BR),
      path(FOLD),
      G("braces", [
        path(BRACE_L(15.4, 14.2)),
        path(BRACE_R(19.6, 14.2)),
        circle(17.5, 17.2, 0.45, fill()),
        circle(17.5, 18.6, 0.45, fill()),
      ]),
    ],
    sAnims: { braces: POP(17.5, 17.4, 1.14) },
  },

  "file-music": {
    dur: 1.6,
    auto: false,
    parts: [
      path(DOC_BR),
      path(FOLD),
      G("note", [path("M17.4 19.8L17.4 15L20 16.2"), circle(16, 19.6, 1.4)]),
    ],
    gAnims: { note: DIP(0, -0.8) },
  },

  "file-volume": {
    dur: 1.6,
    auto: false,
    parts: [
      path(DOC_L),
      path(FOLD),
      G("spk", [path("M4.8 17.6h1.5l2.3-1.8v6l-2.3-1.8H4.8z", { ...fill(), stroke: "currentColor", "stroke-width": 1, "stroke-linejoin": "round" })]),
      G("wave", [path("M10.8 16.8c1 .9 1 2.8 0 3.7")]),
    ],
    sAnims: { wave: RIPPLE(10.8, 18.6, 0.45, 1.3) },
  },

  "file-volume-2": {
    dur: 1.6,
    auto: false,
    parts: [
      path(DOC_BR),
      path(FOLD),
      G("spk", [path("M13.2 17.6h1.5l2.3-1.8v6l-2.3-1.8h-1.5z", { ...fill(), stroke: "currentColor", "stroke-width": 1, "stroke-linejoin": "round" })]),
      G("w1", [path("M19.2 16.8c1 .9 1 2.8 0 3.7")]),
    ],
    sAnims: { w1: RIPPLE(19.2, 18.6, 0.45, 1.25) },
  },

  "file-pen": {
    dur: 1.6,
    auto: false,
    parts: [
      path("M10 21H7.7C6.2 21 5 19.8 5 18.3V5.7C5 4.2 6.2 3 7.7 3H12.6C13.1 3.1 13.6 3.3 14 3.7L18.3 8C18.7 8.5 19 9 19 9.6V10.6"),
      path(FOLD),
      G("pen", [path(pen(12.8, 21.2))]),
    ],
    gAnims: { pen: WIG(12.8, 21.2, 8) },
  },

  "file-pen-line": {
    dur: 1.6,
    auto: false,
    parts: [
      path("M10 21H7.7C6.2 21 5 19.8 5 18.3V5.7C5 4.2 6.2 3 7.7 3H12.6C13.1 3.1 13.6 3.3 14 3.7L18.3 8C18.7 8.5 19 9 19 9.6V10.2"),
      path(FOLD),
      G("pen", [path(pen(12.8, 18.6, 8.2, 1.8, 2.4))]),
      DRAW(line(13.2, 21.6, 20.4, 21.6), 0.55, 0.8),
    ],
    gAnims: { pen: WIG(12.8, 18.6, 8) },
  },

  "file-scan": {
    dur: 1.8,
    auto: false,
    parts: [
      path(DOC_BR),
      path(FOLD),
      A(line(13.6, 17.6, 20.4, 17.6), [
        an("y1", ["17.6", "20.2", "15.4", "17.6"], [0, 0.35, 0.7, 1]),
        an("y2", ["17.6", "20.2", "15.4", "17.6"], [0, 0.35, 0.7, 1]),
      ]),
    ],
  },

  "file-sliders": {
    dur: 1.7,
    auto: false,
    parts: [
      path(DOC),
      path(FOLD),
      line(8.4, 12.8, 15.6, 12.8),
      line(8.4, 16.6, 15.6, 16.6),
      SHIFT(line(10.2, 12.1, 10.2, 13.5), 1.4, 0),
      SHIFT(line(13.8, 15.9, 13.8, 17.3), -1.4, 0),
    ],
  },

  "file-symlink": {
    dur: 1.6,
    auto: false,
    parts: [
      path(DOC_L),
      path(FOLD),
      G("hook", [
        path("M3.4 18.6L3.4 18C3.4 16.6 4.4 15.6 5.8 15.6L10.4 15.6"),
        path("M8.2 13.4L10.6 15.8L8.2 18.2"),
      ]),
    ],
    gAnims: { hook: DIP(0.8, 0) },
  },

  "file-input": {
    dur: 1.6,
    auto: false,
    parts: [
      path(DOC_L),
      path(FOLD),
      G("arrow", [line(3, 16.4, 9, 16.4), path("M7 14.4L9 16.4L7 18.4")]),
    ],
    gAnims: { arrow: DIP(0.9, 0) },
  },

  "file-output": {
    dur: 1.6,
    auto: false,
    parts: [
      path(DOC_L),
      path(FOLD),
      G("arrow", [line(3, 16.4, 9, 16.4), path("M5 14.4L3 16.4L5 18.4")]),
    ],
    gAnims: { arrow: DIP(-0.9, 0) },
  },

  /* ------------------------------ folders ------------------------------ */

  "folder-closed": {
    dur: 1.35,
    parts: [path(FOLDER), line(3.6, 10.2, 20.4, 10.2)],
  },

  folders: {
    dur: 1.5,
    auto: false,
    parts: [
      G("back", [
        path("M5.4 8L5.4 6.6C5.4 5.4 6.4 4.4 7.6 4.4L11.2 4.4C11.8 4.4 12.3 4.6 12.7 5.1L13.5 6"),
      ]),
      path("M3.2 18.4L3.2 10.8C3.2 9.6 4.2 8.6 5.4 8.6L9.2 8.6C9.8 8.6 10.3 8.8 10.7 9.3L11.5 10.3C11.9 10.8 12.4 11 13 11L18.6 11C19.8 11 20.8 12 20.8 13.2L20.8 18.4C20.8 19.6 19.8 20.6 18.6 20.6L5.4 20.6C4.2 20.6 3.2 19.6 3.2 18.4Z"),
    ],
    gAnims: { back: DIP(-0.9, -0.9) },
  },

  "folder-open-dot": {
    dur: 1.6,
    auto: false,
    parts: [
      path(FLB),
      G("flap", [path(FLF)]),
      G("dot", [circle(12.4, 15.6, 1.05, fill())]),
    ],
    gAnims: { flap: WIG(20.4, 9.8, 6) },
    sAnims: { dot: POP(12.4, 15.6, 1.5) },
  },

  "folder-up": {
    dur: 1.6,
    auto: false,
    parts: [
      path(FOLDER),
      G("arrow", [line(12, 17.6, 12, 11.8), path("M9.6 14.4L12 11.8L14.4 14.4")]),
    ],
    gAnims: { arrow: DIP(0, -1) },
  },

  "folder-down": {
    dur: 1.6,
    auto: false,
    parts: [
      path(FOLDER),
      G("arrow", [line(12, 11.8, 12, 17.6), path("M9.6 15L12 17.6L14.4 15")]),
    ],
    gAnims: { arrow: DIP(0, 1) },
  },

  "folder-code": {
    dur: 1.6,
    auto: false,
    parts: [
      path(FOLDER),
      G("chev", [path("M10.4 11.4L8.2 13.9L10.4 16.4"), path("M14.6 11.4L16.8 13.9L14.6 16.4")]),
    ],
    sAnims: { chev: POP(12.5, 13.9, 1.12) },
  },

  "folder-git": {
    dur: 1.6,
    auto: false,
    parts: [
      path(FOLDER),
      line(6.6, 13.6, 9.9, 13.6),
      line(14.1, 13.6, 17.4, 13.6),
      G("node", [circle(12, 13.6, 2.1)]),
    ],
    sAnims: { node: POP(12, 13.6, 1.2) },
  },

  "folder-heart": {
    dur: 1.6,
    auto: false,
    parts: [path(FOL_BR), G("pop", [path(HEART_C(17, 17.4, 0.9))])],
    sAnims: { pop: POP(17, 17.4) },
  },

  "folder-key": {
    dur: 1.7,
    auto: false,
    parts: [
      path(FOL_BR),
      G("key", [circle(17.2, 19.2, 1.7), line(17.2, 17.5, 17.2, 13.4), line(17.2, 14.8, 19.1, 14.8)]),
    ],
    gAnims: { key: WIG(17.2, 19.2, 8) },
  },

  "folder-lock": {
    dur: 1.7,
    auto: false,
    parts: [
      path(FOL_BR),
      rect(14.1, 15.2, 6.4, 5, 1.3),
      G("pin", [path("M15.3 15.2L15.3 14C15.3 12.9 16.2 12 17.3 12C18.4 12 19.3 12.9 19.3 14L19.3 15.2")]),
    ],
    gAnims: { pin: tn("translate", ["0 0", "0 0", "0 1.3", "0 1.3", "0 0"], [0, 0.25, 0.5, 0.75, 1]) },
  },

  "folder-root": {
    dur: 1.6,
    auto: false,
    parts: [
      path(FOLDER),
      G("root", [circle(12, 12.4, 2), line(12, 14.4, 12, 19)]),
    ],
    sAnims: { root: POP(12, 12.4, 1.15) },
  },

  "folder-search": {
    dur: 1.7,
    auto: false,
    parts: [
      path(FOL_BR),
      G("lens", [circle(17.2, 17.2, 2.8), line(19.2, 19.2, 20.9, 20.9)]),
    ],
    gAnims: { lens: WIG(17.2, 17.2, 8) },
  },

  "folder-search-2": {
    dur: 1.7,
    auto: false,
    parts: [
      path(FOLDER),
      G("lens", [circle(12, 12.6, 3.3), line(14.4, 15, 16.6, 17.2)]),
    ],
    gAnims: { lens: WIG(12, 12.6, 8) },
  },

  "folder-sync": {
    dur: 1.8,
    auto: false,
    pp: false,
    parts: [
      path(FOL_BR),
      G("sync", [
        path("M15.5 16.6A3.1 3.1 0 0 1 20.5 15"),
        path("M20.6 13.3L20.6 15.2L18.7 15.2"),
        path("M19.7 18.7A3.1 3.1 0 0 1 14.7 20.3"),
        path("M14.6 22L14.6 20.1L16.5 20.1"),
      ]),
    ],
    gAnims: { sync: SPIN(17.6, 17.6) },
  },

  "folder-tree": {
    dur: 1.6,
    auto: false,
    parts: [
      path(FOLDER),
      G("tree", [
        line(9, 9.6, 9, 18.4),
        path("M9 11.4L9 13.4C9 14.5 9.9 15.4 11 15.4L12 15.4"),
        line(11.2, 9.6, 15.6, 9.6),
        line(13.4, 15.4, 16.6, 15.4),
        line(13.4, 18.4, 16.6, 18.4),
      ]),
    ],
    sAnims: { tree: POP(12, 14, 1.08) },
  },

  "folder-clock": {
    dur: 1.9,
    auto: false,
    pp: false,
    parts: [
      path(FOL_BR),
      circle(17.2, 17, 4.6),
      G("hands", [line(17.2, 17, 17.2, 14.6), line(17.2, 17, 19, 18)]),
    ],
    gAnims: { hands: SPIN(17.2, 17) },
  },

  "folder-archive": {
    dur: 1.6,
    auto: false,
    parts: [
      path(FOL_BR),
      G("slot", [
        line(17.4, 11.8, 17.4, 13),
        line(17.4, 15.2, 17.4, 16.6),
        circle(17.4, 19.4, 1.7),
      ]),
    ],
    sAnims: { slot: POP(17.4, 16.4, 1.12) },
  },

  "folder-input": {
    dur: 1.6,
    auto: false,
    parts: [
      path(FOL_IN),
      G("arrow", [line(2.8, 15.8, 10.6, 15.8), path("M8.4 13.6L10.6 15.8L8.4 18")]),
    ],
    gAnims: { arrow: DIP(1, 0) },
  },

  "folder-output": {
    dur: 1.6,
    auto: false,
    parts: [
      path(FOL_IN),
      G("arrow", [line(2.8, 15.8, 10.6, 15.8), path("M5 13.6L2.8 15.8L5 18")]),
    ],
    gAnims: { arrow: DIP(-1, 0) },
  },

  "folder-pen": {
    dur: 1.6,
    auto: false,
    parts: [
      path("M9.6 20.8H5.8C4.6 20.8 3.6 19.8 3.6 18.6L3.6 6.2C3.6 5 4.6 4 5.8 4L9.6 4C10.2 4 10.7 4.2 11.1 4.7L12.1 5.9C12.5 6.4 13 6.6 13.6 6.6L18.2 6.6C19.4 6.6 20.4 7.6 20.4 8.9L20.4 10.4"),
      G("pen", [path(pen(12.8, 21.2))]),
    ],
    gAnims: { pen: WIG(12.8, 21.2, 8) },
  },

  "folder-kanban": {
    dur: 1.6,
    auto: false,
    parts: [
      path(FOLDER),
      A(line(8.4, 10.4, 8.4, 15), BLINK(0.25)),
      A(line(12, 10.4, 12, 17), BLINK(0.15)),
      A(line(15.6, 10.4, 15.6, 13), BLINK(0.35)),
    ],
  },

  "folder-cog": {
    dur: 2,
    auto: false,
    parts: [
      path("M10.6 20.8H5.8C4.6 20.8 3.6 19.8 3.6 18.6L3.6 6.2C3.6 5 4.6 4 5.8 4L9.6 4C10.2 4 10.7 4.2 11.1 4.7L12.1 5.9C12.5 6.4 13 6.6 13.6 6.6L18.2 6.6C19.4 6.6 20.4 7.6 20.4 8.9L20.4 11"),
      G("cog", cog(17.6, 17.6, 0.9)),
    ],
    gAnims: { cog: RATCHET(17.6, 17.6) },
  },

  "folder-dot": {
    dur: 1.4,
    auto: false,
    parts: [path(FOLDER), G("dot", [circle(12, 13.4, 1.1, fill())])],
    sAnims: { dot: POP(12, 13.4, 1.6) },
  },

  /* ------------------------------ lists / logs ------------------------------ */

  "list-check": {
    dur: 1.6,
    auto: false,
    parts: [
      ...ROWS_3,
      G("pop", [path("M3.4 16.8L5.4 18.8L9.2 14.6")]),
    ],
    sAnims: { pop: POP(5.9, 16.8, 1.2) },
  },

  "list-x": {
    dur: 1.6,
    auto: false,
    parts: [
      ...ROWS_3,
      G("deny", [line(3.6, 15.8, 7.8, 20), line(7.8, 15.8, 3.6, 20)]),
    ],
    gAnims: { deny: WIG(5.7, 17.9, 10) },
  },

  "list-plus": {
    dur: 1.6,
    auto: false,
    parts: [
      ...ROWS_3,
      G("pop", [line(5.7, 15.8, 5.7, 20), line(3.6, 17.9, 7.8, 17.9)]),
    ],
    sAnims: { pop: POP(5.7, 17.9, 1.2) },
  },

  "list-minus": {
    dur: 1.5,
    auto: false,
    parts: [...ROWS_3, A(line(3.6, 17.9, 7.8, 17.9), BLINK(0.15))],
  },

  "list-end": {
    dur: 1.7,
    auto: false,
    parts: [
      line(3.4, 5.6, 15.6, 5.6),
      line(3.4, 12, 15.6, 12),
      line(3.4, 18.4, 9.4, 18.4),
      path("M20.8 5.4L20.8 17.2C20.8 18.4 19.8 19.4 18.6 19.4L15.8 19.4"),
      G("tip", [path("M16.4 16.6L13.8 19.2L16.4 21.8")]),
    ],
    gAnims: { tip: DIP(-0.9, 0) },
  },

  "list-start": {
    dur: 1.7,
    auto: false,
    parts: [
      line(3.4, 5.6, 9, 5.6),
      line(3.4, 12, 16, 12),
      line(3.4, 18.4, 16, 18.4),
      path("M20.8 19.4L20.8 7.4C20.8 6.2 19.8 5.2 18.6 5.2L15.8 5.2"),
      G("tip", [path("M16.4 8.8L13.8 6.2L16.4 3.6")]),
    ],
    gAnims: { tip: DIP(-0.9, 0) },
  },

  "list-filter": {
    dur: 1.5,
    parts: [
      A(line(2.9, 5.6, 21.1, 5.6), PULSE(0.15)),
      A(line(6.1, 12, 17.9, 12), PULSE(0.3)),
      A(line(9.2, 18.4, 14.8, 18.4), PULSE(0.45)),
    ],
  },

  "list-ordered": {
    dur: 1.7,
    auto: false,
    parts: [
      line(11.2, 5.6, 20.8, 5.6),
      line(11.2, 12, 20.8, 12),
      line(11.2, 18.4, 20.8, 18.4),
      G("n1", [path("M4 4.2L5.4 4.2L5.4 8.8"), line(4.2, 8.8, 6.4, 8.8)]),
      G("n2", [path("M6.4 20.4L3.4 20.4C3.4 19.4 5.9 18.5 5.9 17.1A1.4 1.4 0 0 0 3.5 16.1")]),
    ],
    sAnims: { n1: POP(5, 6.5, 1.18), n2: POP(4.9, 18, 1.18) },
  },

  "list-restart": {
    dur: 1.9,
    auto: false,
    parts: [
      line(3.4, 5.6, 20.8, 5.6),
      line(3.4, 12, 7.6, 12),
      line(3.4, 18.4, 7.6, 18.4),
      G("arc", [
        path("M12.2 18.4A5.2 5.2 0 0 0 21.2 15.2A4.4 4.4 0 0 0 16.7 10.7C15.5 10.7 14.4 11.2 13.6 12L11.8 13.8"),
        path("M11.8 9.6L11.8 13.8L16 13.8"),
      ]),
    ],
    gAnims: { arc: WIG(16.5, 15.3, 12) },
  },

  "list-todo": {
    dur: 1.7,
    auto: false,
    parts: [
      line(12.4, 5.6, 20.8, 5.6),
      line(12.4, 12, 20.8, 12),
      line(12.4, 18.4, 20.8, 18.4),
      G("c1", [path("M3.2 5.4L4.9 7.1L8.3 3.7")]),
      G("c2", [path("M3.2 17.4L4.9 19.1L8.3 15.7")]),
    ],
    sAnims: { c1: POP(5.7, 5.4, 1.2), c2: POP(5.7, 17.4, 1.2) },
  },

  "list-video": {
    dur: 1.6,
    auto: false,
    parts: [
      line(3.4, 5.6, 20.8, 5.6),
      line(3.4, 12, 10.4, 12),
      line(3.4, 18.4, 10.4, 18.4),
      G("play", [
        path("M14.4 12.2C14.5 11.5 15.2 11.1 15.8 11.4L20.4 13.9C21 14.2 21 15 20.4 15.3L15.8 17.8C15.2 18.1 14.5 17.7 14.4 17Z"),
      ]),
    ],
    sAnims: { play: POP(17.2, 14.6, 1.2) },
  },

  logs: {
    dur: 1.7,
    parts: [
      A(line(3.2, 5.6, 4.6, 5.6), PULSE(0.15)),
      A(line(3.2, 12, 4.6, 12), PULSE(0.28)),
      A(line(3.2, 18.4, 4.6, 18.4), PULSE(0.41)),
      A(line(8.4, 5.6, 9.8, 5.6), PULSE(0.2)),
      A(line(8.4, 12, 9.8, 12), PULSE(0.33)),
      A(line(8.4, 18.4, 9.8, 18.4), PULSE(0.46)),
      line(13.4, 5.6, 20.8, 5.6),
      line(13.4, 12, 20.8, 12),
      line(13.4, 18.4, 20.8, 18.4),
    ],
  },

  /* ------------------------------ mail ------------------------------ */

  "mail-minus": {
    dur: 1.5,
    auto: false,
    parts: [ENV_BOX, path(FLAP), A(line(18, 15.4, 21.4, 15.4), BLINK(0.15))],
  },

  "mail-question": {
    dur: 1.7,
    auto: false,
    parts: [
      ENV_BOX,
      path(FLAP),
      G("q", [
        path("M18.4 12.2C18.5 11.4 19.2 10.8 20 10.8C20.8 10.8 21.5 11.4 21.5 12.2C21.5 13 20.7 13.2 20.3 13.8C20.2 14 20.1 14.2 20.1 14.5"),
        circle(20, 17.6, 1.05, fill()),
      ]),
    ],
    sAnims: { q: POP(20, 14.2, 1.15) },
  },

  "mail-search": {
    dur: 1.7,
    auto: false,
    parts: [
      ENV_BOX,
      path(FLAP),
      G("lens", [circle(18.6, 14.8, 2.7), line(20.5, 16.7, 21.9, 18.1)]),
    ],
    gAnims: { lens: WIG(18.6, 14.8, 8) },
  },

  "mail-warning": {
    dur: 1.6,
    auto: false,
    parts: [
      ENV_BOX,
      path(FLAP),
      G("bang", [line(19.7, 11.4, 19.7, 15.4), circle(19.7, 18.2, 1.05, fill())]),
    ],
    gAnims: { bang: WIG(19.7, 14.8, 7) },
  },

  "mail-x": {
    dur: 1.6,
    auto: false,
    parts: [
      ENV_BOX,
      path(FLAP),
      G("deny", [line(17.7, 13.2, 21.7, 17.2), line(21.7, 13.2, 17.7, 17.2)]),
    ],
    gAnims: { deny: WIG(19.7, 15.2, 9) },
  },

  mailbox: {
    dur: 1.7,
    auto: false,
    parts: [
      path("M20.8 16.6C21.2 16.6 21.5 16.3 21.5 15.9L21.5 10.1C21.5 7.7 19.6 5.8 17.2 5.8L6.8 5.8C4.4 5.8 2.5 7.7 2.5 10.1L2.5 15.9C2.5 16.3 2.8 16.6 3.2 16.6Z"),
      path("M6.8 5.8C9.2 5.8 11.1 7.7 11.1 10.1L11.1 16.6"),
      G("flag", [line(18.6, 9.4, 18.6, 5.4), path("M18.6 5.4L15.6 5.4L15.6 7.2L18.6 7.2")]),
    ],
    gAnims: { flag: DIP(0, -1.1) },
  },

  mails: {
    dur: 1.7,
    auto: false,
    parts: [
      G("back", [path("M7.4 6.8L19.4 6.8C20.3 6.8 21 7.5 21 8.4L21 16.4C21 17.1 20.5 17.7 19.9 17.9")]),
      rect(2.8, 9.4, 14.2, 11, 2),
      path("M3.2 10.2L10.1 15C10.8 15.5 11.7 15.5 12.4 15L16.6 11.9"),
    ],
    gAnims: { back: DIP(0.9, -0.9) },
  },

  /* ------------------------------ message-circle ------------------------------ */

  "message-circle-code": {
    dur: 1.6,
    auto: false,
    parts: [
      path(MC),
      G("chev", [path("M10 7.9L7.6 10.3L10 12.7"), path("M14.8 7.9L17.2 10.3L14.8 12.7")]),
    ],
    sAnims: { chev: POP(12.4, 10.3, 1.1) },
  },

  "message-circle-heart": {
    dur: 1.6,
    auto: false,
    parts: [path(MC), G("pop", [path(HEART_C(12.4, 10.9, 0.82))])],
    sAnims: { pop: POP(12.4, 10.9) },
  },

  "message-circle-more": {
    dur: 1.6,
    auto: false,
    parts: [
      path(MC),
      A(circle(8.4, 10.3, 0.55, fill()), PULSE(0.15)),
      A(circle(12.4, 10.3, 0.55, fill()), PULSE(0.28)),
      A(circle(16.4, 10.3, 0.55, fill()), PULSE(0.41)),
    ],
  },

  "message-circle-off": {
    dur: 1.6,
    auto: false,
    parts: [path(MC), A(line(7.2, 17.4, 17.4, 7.2), BLINK(0.15))],
  },

  "message-circle-plus": {
    dur: 1.6,
    auto: false,
    parts: [path(MC), G("pop", [line(12.4, 7.4, 12.4, 13.2), line(9.5, 10.3, 15.3, 10.3)])],
    sAnims: { pop: POP(12.4, 10.3) },
  },

  "message-circle-question": {
    dur: 1.7,
    auto: false,
    parts: [
      path(MC),
      G("q", [
        path("M10.6 7.9C10.7 6.9 11.4 6.2 12.4 6.2C13.4 6.2 14.2 6.9 14.2 7.9C14.2 9.2 13 9.4 12.5 10.4C12.4 10.7 12.4 10.9 12.4 11.3"),
        circle(12.4, 14.4, 1.05, fill()),
      ]),
    ],
    sAnims: { q: POP(12.4, 10.3, 1.12) },
  },

  "message-circle-reply": {
    dur: 1.7,
    auto: false,
    parts: [
      path(MC),
      G("reply", [
        path("M10.5 12.7L8.1 10.3L10.5 7.9"),
        path("M8.1 10.3L14.6 10.3C15.7 10.3 16.6 11.2 16.6 12.3L16.6 13.4"),
      ]),
    ],
    gAnims: { reply: DIP(-0.9, 0) },
  },

  "message-circle-warning": {
    dur: 1.6,
    auto: false,
    parts: [
      path(MC),
      G("bang", [line(12.4, 6.6, 12.4, 11), circle(12.4, 14.2, 1.1, fill())]),
    ],
    gAnims: { bang: WIG(12.4, 10.5, 7) },
  },

  "message-circle-x": {
    dur: 1.6,
    auto: false,
    parts: [
      path(MC),
      G("deny", [line(10, 7.9, 14.8, 12.7), line(14.8, 7.9, 10, 12.7)]),
    ],
    gAnims: { deny: WIG(12.4, 10.3, 9) },
  },

  /* ------------------------------ message-square ------------------------------ */

  "message-square-code": {
    dur: 1.6,
    auto: false,
    parts: [
      path(MSQ),
      G("chev", [path("M9.9 9.1L7.6 11.3L9.9 13.5"), path("M14.1 9.1L16.4 11.3L14.1 13.5")]),
    ],
    sAnims: { chev: POP(12, 11.3, 1.1) },
  },

  "message-square-diff": {
    dur: 1.7,
    auto: false,
    parts: [
      path(MSQ),
      G("plus", [line(9.9, 8.9, 14.1, 8.9), line(12, 6.8, 12, 11)]),
      A(line(9.9, 14.6, 14.1, 14.6), BLINK(0.15)),
    ],
    sAnims: { plus: POP(12, 8.9, 1.15) },
  },

  "message-square-dot": {
    dur: 1.5,
    auto: false,
    parts: [path(MSQ_TR), G("dot", [circle(18.6, 6.4, 3.1, fill())])],
    sAnims: { dot: POP(18.6, 6.4, 1.3) },
  },

  "message-square-heart": {
    dur: 1.6,
    auto: false,
    parts: [path(MSQ), G("pop", [path(HEART_C(12, 11.6, 0.82))])],
    sAnims: { pop: POP(12, 11.6) },
  },

  "message-square-lock": {
    dur: 1.7,
    auto: false,
    parts: [
      path(MSQ_BR),
      rect(14.4, 15.4, 6.2, 4.8, 1.2),
      G("pin", [path("M15.5 15.4L15.5 14.2C15.5 13.1 16.4 12.2 17.5 12.2C18.6 12.2 19.5 13.1 19.5 14.2L19.5 15.4")]),
    ],
    gAnims: { pin: tn("translate", ["0 0", "0 0", "0 1.2", "0 1.2", "0 0"], [0, 0.25, 0.5, 0.75, 1]) },
  },

  "message-square-more": {
    dur: 1.6,
    auto: false,
    parts: [
      path(MSQ),
      A(circle(8.3, 11.3, 0.55, fill()), PULSE(0.15)),
      A(circle(12, 11.3, 0.55, fill()), PULSE(0.28)),
      A(circle(15.7, 11.3, 0.55, fill()), PULSE(0.41)),
    ],
  },

  "message-square-off": {
    dur: 1.6,
    auto: false,
    parts: [path(MSQ), A(line(7.4, 17.4, 17.4, 7.4), BLINK(0.15))],
  },

  "message-square-plus": {
    dur: 1.6,
    auto: false,
    parts: [path(MSQ), G("pop", [line(12, 8.4, 12, 14.2), line(9.1, 11.3, 14.9, 11.3)])],
    sAnims: { pop: POP(12, 11.3) },
  },

  "message-square-quote": {
    dur: 1.6,
    auto: false,
    parts: [
      path(MSQ),
      G("quote", [
        path("M10.4 14C11.3 14 12 13.3 12 12.5L12 9.4L10.4 9.4"),
        path("M15.4 14C16.3 14 17 13.3 17 12.5L17 9.4L15.4 9.4"),
      ]),
    ],
    sAnims: { quote: POP(13.7, 11.7, 1.12) },
  },

  "message-square-reply": {
    dur: 1.7,
    auto: false,
    parts: [
      path(MSQ),
      G("reply", [
        path("M10.3 13.6L8 11.3L10.3 9"),
        path("M8 11.3L14.5 11.3C15.6 11.3 16.5 12.2 16.5 13.3L16.5 14.4"),
      ]),
    ],
    gAnims: { reply: DIP(-0.9, 0) },
  },

  "message-square-share": {
    dur: 1.7,
    auto: false,
    parts: [
      path(MSQ_TR),
      G("share", [line(15.4, 9.2, 20.8, 3.8), path("M20.8 9L20.8 3.8L15.6 3.8")]),
    ],
    gAnims: { share: DIP(0.9, -0.9) },
  },

  "message-square-text": {
    dur: 1.6,
    auto: false,
    parts: [
      path(MSQ),
      A(line(7.8, 7.9, 16.2, 7.9), PULSE(0.15)),
      A(line(7.8, 11.5, 16.2, 11.5), PULSE(0.28)),
      A(line(7.8, 15.1, 12.8, 15.1), PULSE(0.41)),
    ],
  },

  "message-square-warning": {
    dur: 1.6,
    auto: false,
    parts: [
      path(MSQ),
      G("bang", [line(12, 7.6, 12, 11.8), circle(12, 14.6, 1.1, fill())]),
    ],
    gAnims: { bang: WIG(12, 11.3, 7) },
  },

  "message-square-x": {
    dur: 1.6,
    auto: false,
    parts: [
      path(MSQ),
      G("deny", [line(9.7, 9, 14.3, 13.6), line(14.3, 9, 9.7, 13.6)]),
    ],
    gAnims: { deny: WIG(12, 11.3, 9) },
  },

  /* ------------------------------ docs ------------------------------ */

  "notepad-text": {
    dur: 1.6,
    auto: false,
    parts: [
      rect(4.4, 4.2, 15.2, 17, 2),
      G("posts", [line(8.6, 2.6, 8.6, 6.2), line(12, 2.6, 12, 6.2), line(15.4, 2.6, 15.4, 6.2)]),
      A(line(8.4, 10.6, 13.8, 10.6), PULSE(0.2)),
      A(line(8.4, 14.2, 16, 14.2), PULSE(0.32)),
      A(line(8.4, 17.8, 13, 17.8), PULSE(0.44)),
    ],
    gAnims: { posts: DIP(0, -0.9) },
  },

  scroll: {
    dur: 1.8,
    auto: false,
    parts: [
      path("M18.6 16.8L18.6 5.6C18.6 4.5 17.7 3.6 16.6 3.6L4.6 3.6"),
      G("roll", [
        path("M8.4 20.8L19.6 20.8C20.7 20.8 21.6 19.9 21.6 18.8L21.6 18.4C21.6 17.9 21.2 17.5 20.7 17.5L11.2 17.5C10.7 17.5 10.3 17.9 10.3 18.4L10.3 18.8C10.3 19.9 9.4 20.8 8.3 20.8C7.2 20.8 6.3 19.9 6.3 18.8L6.3 5.6C6.3 4.5 5.4 3.6 4.3 3.6C3.2 3.6 2.3 4.5 2.3 5.6L2.3 7.2C2.3 7.7 2.7 8.1 3.2 8.1L6.1 8.1"),
      ]),
    ],
    gAnims: { roll: DIP(0, 0.9) },
  },

  "scroll-text": {
    dur: 1.8,
    auto: false,
    parts: [
      path("M18.6 16.8L18.6 5.6C18.6 4.5 17.7 3.6 16.6 3.6L4.6 3.6"),
      G("roll", [
        path("M8.4 20.8L19.6 20.8C20.7 20.8 21.6 19.9 21.6 18.8L21.6 18.4C21.6 17.9 21.2 17.5 20.7 17.5L11.2 17.5C10.7 17.5 10.3 17.9 10.3 18.4L10.3 18.8C10.3 19.9 9.4 20.8 8.3 20.8C7.2 20.8 6.3 19.9 6.3 18.8L6.3 5.6C6.3 4.5 5.4 3.6 4.3 3.6C3.2 3.6 2.3 4.5 2.3 5.6L2.3 7.2C2.3 7.7 2.7 8.1 3.2 8.1L6.1 8.1"),
      ]),
      A(line(10.6, 8.4, 14.9, 8.4), PULSE(0.25)),
      A(line(10.6, 11.8, 14.9, 11.8), PULSE(0.4)),
    ],
    gAnims: { roll: DIP(0, 0.9) },
  },

  sheet: {
    dur: 1.6,
    parts: [
      rect(3.4, 3.4, 17.2, 17.2, 2.2),
      line(3.4, 9.4, 20.6, 9.4),
      line(3.4, 15, 20.6, 15),
      line(9.4, 9.4, 9.4, 20.6),
      line(15, 9.4, 15, 20.6),
    ],
  },

  /* ------------------------------ calendar ------------------------------ */

  "calendar-check-2": {
    dur: 1.6,
    auto: false,
    parts: [
      path(CAL_OPEN),
      path(POSTS),
      line(2.9, 9.8, 21.1, 9.8),
      G("pop", [path("M15.4 18.2L17.3 20.1L20.9 15.9")]),
    ],
    sAnims: { pop: POP(18, 18, 1.18) },
  },

  /* ------------------------------ map pins ------------------------------ */

  "map-pin-house": {
    dur: 1.8,
    auto: false,
    parts: [
      G("drop", [
        path(PIN),
        path("M9.5 10.9L12 8.5L14.5 10.9"),
        path("M10.2 10.6L10.2 13.3C10.2 13.6 10.5 13.9 10.8 13.9L13.2 13.9C13.5 13.9 13.8 13.6 13.8 13.3L13.8 10.6"),
      ]),
    ],
    gAnims: { drop: tn("translate", ["0 -3.6", "0 0.6", "0 -0.25", "0 0"], [0, 0.6, 0.8, 1]) },
  },

  "map-pin-minus": {
    dur: 1.8,
    auto: false,
    parts: [
      G("drop", [path(PIN_BR)]),
      G("mark", [line(16.4, 18.4, 20.8, 18.4)]),
    ],
    gAnims: {
      drop: tn("translate", ["0 -3.6", "0 0.6", "0 -0.25", "0 0"], [0, 0.6, 0.8, 1]),
      mark: tn("translate", ["0 -3.6", "0 0.6", "0 -0.25", "0 0"], [0, 0.6, 0.8, 1]),
    },
  },

  "map-pin-plus": {
    dur: 1.8,
    auto: false,
    parts: [
      G("drop", [path(PIN_BR)]),
      G("mark", [line(18.6, 16.2, 18.6, 20.6), line(16.4, 18.4, 20.8, 18.4)]),
    ],
    gAnims: {
      drop: tn("translate", ["0 -3.6", "0 0.6", "0 -0.25", "0 0"], [0, 0.6, 0.8, 1]),
      mark: tn("translate", ["0 -3.6", "0 0.6", "0 -0.25", "0 0"], [0, 0.6, 0.8, 1]),
    },
  },

  "map-pinned": {
    dur: 1.8,
    auto: false,
    parts: [
      G("drop", [
        path("M12 16.8C12 16.8 17.4 12.3 17.4 8.6A5.4 5.4 0 1 0 6.6 8.6C6.6 12.3 12 16.8 12 16.8Z"),
        circle(12, 8.6, 1.9),
      ]),
      path("M9.4 15.9L5.4 15.9C4.9 15.9 4.5 16.2 4.4 16.6L3.5 20.6C3.4 21.3 3.9 21.9 4.6 21.9L19.4 21.9C20.1 21.9 20.6 21.3 20.5 20.6L19.6 16.6C19.5 16.2 19.1 15.9 18.6 15.9L14.6 15.9"),
    ],
    gAnims: { drop: tn("translate", ["0 -3.4", "0 0.5", "0 -0.2", "0 0"], [0, 0.6, 0.8, 1]) },
  },

  /* ------------------------------ search ------------------------------ */

  "search-check": {
    dur: 1.6,
    auto: false,
    parts: [
      circle(10.8, 10.8, 7.6),
      G("pop", [path("M8.5 11.2L10.2 12.9L13.4 9.3")]),
      A(line(16.3, 16.3, 20.8, 20.8), [
        an("x2", [20.8, 21.5, 20.8], [0, 0.42, 1]),
        an("y2", [20.8, 21.5, 20.8], [0, 0.42, 1]),
      ]),
    ],
    sAnims: { pop: POP(11, 11.1, 1.18) },
  },

  "search-code": {
    dur: 1.6,
    auto: false,
    parts: [
      circle(10.8, 10.8, 7.6),
      G("chev", [path("M9.7 8.7L7.6 10.8L9.7 12.9"), path("M12.1 12.9L14.2 10.8L12.1 8.7")]),
      A(line(16.3, 16.3, 20.8, 20.8), [
        an("x2", [20.8, 21.5, 20.8], [0, 0.42, 1]),
        an("y2", [20.8, 21.5, 20.8], [0, 0.42, 1]),
      ]),
    ],
    sAnims: { chev: POP(10.9, 10.8, 1.12) },
  },

  "search-slash": {
    dur: 1.6,
    auto: false,
    parts: [
      circle(10.8, 10.8, 7.6),
      DRAW(path("M8.7 8.7L13 13"), 0.2, 0.6),
      A(line(16.3, 16.3, 20.8, 20.8), [
        an("x2", [20.8, 21.5, 20.8], [0, 0.42, 1]),
        an("y2", [20.8, 21.5, 20.8], [0, 0.42, 1]),
      ]),
    ],
  },

  "search-x": {
    dur: 1.6,
    auto: false,
    parts: [
      circle(10.8, 10.8, 7.6),
      G("deny", [line(8.9, 8.9, 12.7, 12.7), line(12.7, 8.9, 8.9, 12.7)]),
      A(line(16.3, 16.3, 20.8, 20.8), [
        an("x2", [20.8, 21.5, 20.8], [0, 0.42, 1]),
        an("y2", [20.8, 21.5, 20.8], [0, 0.42, 1]),
      ]),
    ],
    gAnims: { deny: WIG(10.8, 10.8, 9) },
  },

};
