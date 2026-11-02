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

/* small bloom for cog-style glyphs — same cosine-lobe recipe as the core gear */
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
const CLIP_BOARD = rect(4.5, 5.6, 15, 15.2, 2.5);
const CLIP_TAB = rect(8.2, 3, 7.6, 4.2, 2.1);
/* board with the bottom-right corner opened for a pen badge */
const CLIP_OPEN = path("M9.6 20.8H7c-1.4 0-2.5-1.1-2.5-2.5V8.1c0-1.4 1.1-2.5 2.5-2.5h10c1.4 0 2.5 1.1 2.5 2.5v1.6");

/* open-bottom cloud: two bumps over the top, short feet at each end,
   weather/detail hangs through the gap */
const CLOUD =
  "M6.5 18.1c-2.3 0-4.1-1.9-4.1-4.2 0-2 1.5-3.7 3.5-4.1.4-2.4 2.4-4.3 4.9-4.3 2.9 0 5.3 2.1 5.8 4.9.2 0 .4-.1.7-.1 2.3 0 4.2 1.9 4.2 4.2 0 2.3-1.9 4.2-4.2 4.2h-.8";

/* gesture recipes — one signature verb per icon; pose(t=0) = pose(t=1).
 * draw: stroke traces on with pathLength normalization (checks, x, slash).
 * FALL: drop slides down then resets while invisible — requires pp:false. */
const DO = { pathLength: 1, "stroke-dasharray": 1 };
const draw = (a = 0.12, b = 0.7) => [an("stroke-dashoffset", ["1", "1", "0"], [0, a, b])];
const FALL = (dy = 1.8) => [
  tn("translate", [`0 ${-dy}`, `0 ${-dy}`, `0 ${dy}`, `0 ${-dy}`], [0, 0.1, 0.7, 1]),
  an("opacity", ["0", "0", "1", "1", "0", "0"], [0, 0.1, 0.25, 0.55, 0.68, 1]),
];

/* archive box: trapezoid top flaring into a soft body */
const INBOX =
  "M6.4 4.6h11.2c.4 0 .8.2 1 .6l1.9 4.3c.2.4.3.9.3 1.3v6.6c0 1.7-1.4 3-3 3H6.2c-1.7 0-3-1.3-3-3v-6.6c0-.4.1-.9.3-1.3l1.9-4.3c.2-.4.6-.6 1-.6z";
const INBOX_GAP =
  "M8.8 4.6H6.4c-.4 0-.8.2-1 .6l-1.9 4.3c-.2.4-.3.9-.3 1.3v6.6c0 1.7 1.4 3 3 3h11.6c1.7 0 3-1.3 3-3v-6.6c0-.4-.1-.9-.3-1.3l-1.9-4.3c-.2-.4-.6-.6-1-.6h-2.4";
const INBOX_NOTCH =
  "M3.4 10.6h3.5c.5 0 .9.2 1.2.6l.9 1c.3.4.8.6 1.3.6h3.4c.5 0 1-.2 1.3-.6l.9-1c.3-.4.7-.6 1.2-.6h3.5";

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
  /* ---------- archive ---------- */

  archive: {
    auto: false,
    parts: [
      rect(3.4, 3.6, 17.2, 16.8, 3),
      G("lid", [line(3.4, 12, 20.6, 12)]),
      line(9.4, 7.8, 14.6, 7.8),
      line(9.4, 16.2, 14.6, 16.2),
    ],
    gAnims: { lid: tn("rotate", ["0 20.6 12", "0 20.6 12", "-9 20.6 12", "0 20.6 12", "0 20.6 12"], [0, 0.25, 0.5, 0.75, 1]) },
  },

  "archive-arrow-down": {
    auto: false,
    parts: [
      path(INBOX_GAP),
      path(INBOX_NOTCH),
      G("arr", [line(12, 3.1, 12, 8.2), path("M9.6 6.6c.9.9 1.6 1.6 2.4 2.4l2.4-2.4")]),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 1.8", "0 0"], [0, 0.5, 1]) },
  },

  "archive-arrow-up": {
    auto: false,
    parts: [
      path(INBOX_GAP),
      path(INBOX_NOTCH),
      G("arr", [line(12, 9, 12, 3.9), path("M9.6 6.3c.9-.9 1.6-1.6 2.4-2.4l2.4 2.4")]),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 -1.8", "0 0"], [0, 0.5, 1]) },
  },

  "archive-off03": {
    auto: false,
    parts: [
      rect(2.9, 4.6, 18.2, 4.8, 1.9),
      path("M4.8 10.9v7.3c0 1.6 1.3 2.9 2.9 2.9h8.6c1.6 0 2.9-1.3 2.9-2.9v-7.3"),
      A(line(3.4, 3.4, 20.6, 20.6, DO), draw()),
    ],
  },

  "archive-off04": {
    auto: false,
    parts: [path(INBOX), path(INBOX_NOTCH), A(line(3.4, 3.4, 20.6, 20.6, DO), draw())],
  },

  "archive-restore": {
    auto: false,
    parts: [
      rect(3, 3.8, 18, 4.6, 1.9),
      path("M4.8 10v8.3c0 1.5 1.2 2.7 2.7 2.7h1"),
      path("M19.2 10v8.3c0 1.5-1.2 2.7-2.7 2.7h-1"),
      G("arr", [line(12, 14.8, 12, 20.6), path("M9.5 17.4c.9-.9 1.7-1.7 2.5-2.6.8.9 1.6 1.7 2.5 2.6")]),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 -1.8", "0 0"], [0, 0.5, 1]) },
  },

  "archive-x": {
    auto: false,
    parts: [
      path(INBOX),
      path(INBOX_NOTCH),
      G("x", [path("M16.9 3.2l2.7 2.7M19.6 3.2l-2.7 2.7")]),
    ],
    sAnims: { x: { pivot: [18.2, 4.5], anim: tn("scale", ["1", "1", "1.25", "1", "1"], [0, 0.3, 0.5, 0.7, 1]) } },
  },

  archive01: {
    auto: false,
    parts: [
      line(2.9, 20.5, 21.1, 20.5),
      rect(3.6, 4.4, 6.6, 16.1, 2),
      G("lean", [
        rect(13.5, 5.4, 6.4, 15, 1.9, { transform: "rotate(11 16.7 20.4)" }),
        line(14.9, 8.5, 18.5, 8.5, { transform: "rotate(11 16.7 20.4)" }),
        circle(16.7, 17.3, 0.55, { ...fill(), transform: "rotate(11 16.7 20.4)" }),
      ]),
      line(5, 8, 8.8, 8),
      circle(6.9, 17.4, 0.55, fill()),
    ],
    gAnims: { lean: tn("rotate", ["0 16.7 20.4", "0 16.7 20.4", "7 16.7 20.4", "0 16.7 20.4", "0 16.7 20.4"], [0, 0.2, 0.45, 0.7, 1]) },
  },

  archive02: {
    auto: false,
    parts: [
      rect(3, 12.6, 18, 8.2, 2.4),
      G("lift", [
        path("M5.2 12.6v-2.2c0-1.4 1.1-2.5 2.5-2.5h8.6c1.4 0 2.5 1.1 2.5 2.5v2.2"),
        path("M7.2 7.9V6.4c0-1.3 1-2.4 2.4-2.4h4.8c1.3 0 2.4 1.1 2.4 2.4v1.5"),
      ]),
      path("M9.6 16c.5 1 1.4 1.6 2.4 1.6s1.9-.6 2.4-1.6"),
    ],
    gAnims: { lift: tn("translate", ["0 0", "0 -1.1", "0 0"], [0, 0.5, 1]) },
  },

    "archive03": { auto: false,
    parts: [
    rect(4, 8.2, 16, 11.2, 2.4),
    path("M4 8.2L5 6C5.4 5.2 6.2 4.6 7.1 4.6L16.9 4.6C17.8 4.6 18.6 5.2 19 6L20 8.2"),
    G("arr", [
      line(12, 10.2, 12, 15.2),
      path("M9.7 13.4C10.5 14.2 11.3 15 12 15.7C12.7 15 13.5 14.2 14.3 13.4"),
    ]),
  ],
    gAnims: { arr: tn("translate", ["0 0", "0 1.6", "0 0"], [0, 0.5, 1]) } },

  archive04: {
    auto: false,
    parts: [path(INBOX), G("scoop", [path(INBOX_NOTCH)])],
    gAnims: { scoop: tn("translate", ["0 0", "0 0.9", "0 0"], [0, 0.5, 1]) },
  },

  /* ---------- binary ---------- */

  binary: {
    auto: false,
    dur: 1.7,
    parts: [
      G("ones", [
        path("M5.5 5.2l1.9-1.4v4.6"),
        line(5.3, 8.4, 9.5, 8.4),
        path("M14.6 15.8l1.9-1.4v5.4"),
        line(14.3, 19.8, 18.7, 19.8),
      ]),
      G("zeros", [rect(14.3, 3.6, 4.9, 5, 2.3), rect(4.8, 15.4, 4.9, 5, 2.3)]),
    ],
    gAnims: {
      ones: an("opacity", ["1", "1", "0.25", "1", "1"], [0, 0.05, 0.2, 0.4, 1]),
      zeros: an("opacity", ["1", "1", "0.25", "1", "1"], [0, 0.55, 0.7, 0.9, 1]),
    },
  },

  "binary-code": {
    auto: false,
    parts: [
      G("lb", [path("M6.7 8.4l-2.7 3.6 2.7 3.6")]),
      G("rb", [path("M17.2 8.4l2.7 3.6-2.7 3.6")]),
      path("M8.4 9.6l1.6-1.2v7"),
      rect(12, 8.6, 3.2, 6.8, 1.6),
    ],
    gAnims: {
      lb: tn("translate", ["0 0", "-0.9 0", "0 0"], [0, 0.5, 1]),
      rb: tn("translate", ["0 0", "0.9 0", "0 0"], [0, 0.5, 1]),
    },
  },

  /* ---------- brands / objects ---------- */

  "bing": { auto: false, dur: 1.6,
    parts: [G("b", [path("M7.2 3.5v13.4c0 .8.4 1.5 1.1 1.9l2.6 1.5c.5.3 1.1.3 1.6 0l5.1-3c.7-.4 1.1-1.1 1.1-1.9v-1.3c0-.7-.4-1.4-1-1.7l-5.6-2.8c-.6-.3-1-.9-1-1.6V5.1c0-.8-.5-1.5-1.2-1.7L8.4 2.9z")]) ],
    gAnims: { b: tn("translate", ["0 0", "0 -0.6", "0 0"]) } },

  binoculars: {
    auto: false,
    parts: [
      G("scan", [
        path("M4.6 14.2l1.2-7.4c.2-1 1.1-1.8 2.1-1.8 1.4 0 2.4 1.1 2.4 2.5v6.7"),
        circle(6.6, 16.8, 3.4),
        path("M19.4 14.2l-1.2-7.4c-.2-1-1.1-1.8-2.1-1.8-1.4 0-2.4 1.1-2.4 2.5v6.7"),
        circle(17.4, 16.8, 3.4),
        line(10.3, 8.8, 13.7, 8.8),
        circle(12, 11.9, 1.1),
      ]),
    ],
    gAnims: { scan: tn("rotate", ["0 12 12", "-5 12 12", "5 12 12", "0 12 12"], [0, 0.3, 0.65, 1]) },
  },

  box: {
    auto: false,
    parts: [
      rect(3.4, 8.8, 12.6, 12.4, 1.6),
      G("lid", [path("M4.6 8.8l3.8-4.4c.3-.4.8-.6 1.3-.6h9.2c.6 0 .9.7.5 1.2l-3.4 3.8H4.6z")]),
      path("M16 8.8l3.4-3.8c.2-.2.4 0 .4.2v11.4c0 .5-.2.9-.5 1.1l-3.3 3.5V8.8z"),
    ],
    gAnims: { lid: tn("rotate", ["0 4.6 8.8", "0 4.6 8.8", "-9 4.6 8.8", "0 4.6 8.8", "0 4.6 8.8"], [0, 0.25, 0.5, 0.75, 1]) },
  },

    "boxer": { auto: false, dur: 1.8,
      /* boxer shorts: waistband, flared legs, fly seam */
      parts: [
        G("sway", [
          rect(3.8, 3.5, 16.4, 3.9, 1.6),
          path("M5.3 7.4L4 18.8c-.1.9.6 1.6 1.5 1.6H9.1c.8 0 1.5-.5 1.7-1.3L12 14.4l1.2 4.7c.2.8.9 1.3 1.7 1.3h3.6c.9 0 1.6-.7 1.5-1.6L18.7 7.4"),
          line(12, 7.4, 12, 11),
        ]),
      ],
      gAnims: { sway: tn("rotate", ["0 12 3.5", "-4 12 3.5", "4 12 3.5", "0 12 3.5"], [0, 0.3, 0.65, 1]) } },

    "boxes": { auto: false,
    parts: [
    G("top", [
      rect(8.4, 4.5, 7.2, 6.6, 1.7),
    ]),
    rect(3.2, 12.5, 7.6, 7, 1.7),
    rect(13.2, 12.5, 7.6, 7, 1.7),
    line(6.4, 12.5, 6.4, 14.3),
    line(17.6, 12.5, 17.6, 14.3),
  ],
    gAnims: { top: tn("translate", ["0 -1.6", "0 0"]) } },

  "boxing-bag": {
    auto: false,
    parts: [
      line(5.6, 3, 18.4, 3),
      G("swing", [
        path("M8.9 8.4L12 3l3.1 5.4"),
        path("M7 9.4c1.4-.9 3.2-1.3 5-1.3s3.6.4 5 1.3v9.4c-1.4.9-3.2 1.3-5 1.3s-3.6-.4-5-1.3V9.4z"),
        path("M7 11.8c1.6-.8 3.3-1.1 5-1.1s3.4.3 5 1.1"),
        path("M7 15.8c1.6.8 3.3 1.1 5 1.1s3.4-.3 5-1.1"),
      ]),
    ],
    gAnims: { swing: tn("rotate", ["0 12 3", "-7 12 3", "6 12 3", "-2 12 3", "0 12 3"], [0, 0.28, 0.55, 0.8, 1]) },
  },

    "boxing-glove": { dur: 1.4, auto: true, parts: [
      path("M9.5 4h5a5 5 0 0 1 5 5v3a5 5 0 0 1-5 5H8.5"),
      path("M9.5 4C7 4 5.2 5.8 5.2 8.4c0 2.5 1.6 4.2 3.8 4.4"),
      path("M8.5 17v3.5h9V17"),
    ] },

    "boxing-glove01": { dur: 1.4, auto: true, parts: [
      path("M9.5 4h5a5 5 0 0 1 5 5v3a5 5 0 0 1-5 5H8.5", { transform: "translate(24 0) scale(-1 1)" }),
      path("M9.5 4C7 4 5.2 5.8 5.2 8.4c0 2.5 1.6 4.2 3.8 4.4", { transform: "translate(24 0) scale(-1 1)" }),
      path("M8.5 17v3.5h9V17", { transform: "translate(24 0) scale(-1 1)" }),
      path("M13 9.5h2.5"),
    ] },

  /* ---------- clipboard ---------- */

  clipboard: {
    auto: false,
    parts: [CLIP_BOARD, G("clip", [CLIP_TAB])],
    gAnims: { clip: tn("translate", ["0 0", "0 1", "0 0"], [0, 0.5, 1]) },
  },

  "clipboard-check": {
    auto: false,
    parts: [CLIP_BOARD, G("clip", [CLIP_TAB]), A(path("M8.6 13.4l2.4 2.4 4.4-4.4", DO), draw())],
    gAnims: { clip: tn("translate", ["0 0", "0 1", "0 0"], [0, 0.5, 1]) },
  },

  "clipboard-clock": {
    auto: false,
    pp: false,
    parts: [
      path("M10.6 20.8H7c-1.4 0-2.5-1.1-2.5-2.5V8.1c0-1.4 1.1-2.5 2.5-2.5h10c1.4 0 2.5 1.1 2.5 2.5v2"),
      G("clip", [CLIP_TAB]),
      circle(17.4, 17.4, 3.6),
      G("wind", [path("M17.4 15.6v1.8l1.2.8")]),
    ],
    gAnims: {
      clip: tn("translate", ["0 0", "0 1", "0 0"], [0, 0.5, 1]),
      wind: tn("rotate", ["0 17.4 17.4", "360 17.4 17.4"]),
    },
  },

  "clipboard-copy": {
    auto: false,
    parts: [
      path("M9.6 7.2V5.4c0-1.3 1.1-2.4 2.4-2.4h6.4c1.3 0 2.4 1.1 2.4 2.4v10.4c0 1.3-1.1 2.4-2.4 2.4h-1.6"),
      G("front", [rect(3.2, 7.2, 12.4, 13.6, 2.2)]),
      rect(6.6, 5.6, 5.6, 3.2, 1.6),
    ],
    gAnims: { front: tn("translate", ["0 0", "1.3 1.3", "0 0"], [0, 0.5, 1]) },
  },

  "clipboard-list": {
    auto: false,
    parts: [
      CLIP_BOARD,
      CLIP_TAB,
      line(10.6, 11.4, 15.6, 11.4),
      line(10.6, 15.4, 15.6, 15.4),
      A(circle(8.3, 11.4, 0.55, fill()), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.1, 0.25, 0.45, 1])]),
      A(circle(8.3, 15.4, 0.55, fill()), [an("opacity", ["1", "1", "0.3", "1", "1"], [0, 0.45, 0.6, 0.8, 1])]),
    ],
  },

  "clipboard-minus": {
    auto: false,
    parts: [CLIP_BOARD, CLIP_TAB, A(line(8.6, 13.4, 15.4, 13.4, DO), draw())],
  },

  "clipboard-paste": {
    auto: false,
    parts: [
      CLIP_BOARD,
      CLIP_TAB,
      G("arr", [
        line(8.4, 13.4, 12.9, 13.4),
        path("M10.4 10.9c1 .9 1.7 1.7 2.5 2.5-1 .9-1.7 1.7-2.5 2.5"),
      ]),
    ],
    gAnims: { arr: tn("translate", ["0 0", "1.4 0", "0 0"], [0, 0.5, 1]) },
  },

  "clipboard-pen": {
    auto: false,
    parts: [
      CLIP_OPEN,
      CLIP_TAB,
      line(8.4, 11.2, 12.4, 11.2),
      G("pen", [path(pen(12.8, 21.2))]),
    ],
    gAnims: { pen: tn("rotate", ["0 12.8 21.2", "-7 12.8 21.2", "5 12.8 21.2", "0 12.8 21.2"], [0, 0.3, 0.6, 1]) },
  },

  "clipboard-pen-line": {
    auto: false,
    parts: [
      CLIP_OPEN,
      CLIP_TAB,
      G("pen", [path(pen(12.8, 21.2))]),
      /* the pen writes its line across the board */
      A(line(8.4, 11.2, 13.6, 11.2, DO), draw()),
    ],
    gAnims: { pen: tn("rotate", ["0 12.8 21.2", "-7 12.8 21.2", "5 12.8 21.2", "0 12.8 21.2"], [0, 0.3, 0.6, 1]) },
  },

  "clipboard-plus": {
    auto: false,
    parts: [CLIP_BOARD, CLIP_TAB, G("plus", [line(12, 10.9, 12, 16.1), line(9.4, 13.5, 14.6, 13.5)])],
    gAnims: { plus: tn("rotate", ["0 12 13.5", "90 12 13.5"]) },
  },

  "clipboard-type": {
    auto: false,
    parts: [
      CLIP_BOARD,
      CLIP_TAB,
      G("t", [
        path("M9.3 12.6v-.9c0-.4.3-.8.8-.8h3.8c.4 0 .8.4.8.8v.9"),
        line(12, 11.3, 12, 17.6),
        line(10.2, 17.6, 13.8, 17.6),
      ]),
    ],
    sAnims: { t: { pivot: [12, 14.4], anim: tn("scale", ["1", "1", "1.16", "1", "1"], [0, 0.3, 0.5, 0.7, 1]) } },
  },

  "clipboard-x": {
    auto: false,
    parts: [CLIP_BOARD, CLIP_TAB, A(path("M9.6 11.2l4.8 4.8M14.4 11.2l-4.8 4.8", DO), draw(0.08, 0.55))],
  },

  /* ---------- cloud ---------- */

  "cloud-alert": {
    auto: false,
    parts: [
      path(CLOUD),
      A(line(12, 12.6, 12, 16.4), [an("opacity", ["1", "0.25", "1"], [0, 0.4, 0.8])]),
      A(circle(12, 19.5, 0.65, fill()), [an("r", ["0.65", "1", "0.65"], [0, 0.4, 0.8])]),
    ],
  },

    "cloud-angled-rain": { dur: 1.5,
    pp: false,
    auto: false,
    parts: [
    path("M6.55 16.95C4.25 16.95 2.45 15.05 2.45 12.75C2.45 10.75 3.95 9.05 5.95 8.65C6.35 6.25 8.35 4.35 10.85 4.35C13.75 4.35 16.15 6.45 16.65 9.25C16.85 9.25 17.05 9.15 17.35 9.15C19.65 9.15 21.55 11.05 21.55 13.35C21.55 15.65 19.65 17.55 17.35 17.55L16.55 17.55"),
    G("rain", [
      line(8.45, 14.05, 7.45, 16.25),
      line(12.25, 14.05, 11.25, 16.25),
      line(16.05, 14.05, 15.05, 16.25),
      line(10.35, 17.45, 9.35, 19.65),
      line(14.15, 17.45, 13.15, 19.65),
    ]),
  ],
    gAnims: { rain: [tn("translate", ["0 -1.9", "0 -1.9", "0 1.9", "0 -1.9"], [0, 0.1, 0.7, 1]), an("opacity", ["0", "0", "1", "1", "0", "0"], [0, 0.1, 0.25, 0.55, 0.68, 1])] } },

    "cloud-angled-rain-zap": { dur: 1.6,
    pp: false,
    auto: false,
    parts: [
    path("M6.55 16.8C4.25 16.8 2.45 14.9 2.45 12.6C2.45 10.6 3.95 8.9 5.95 8.5C6.35 6.1 8.35 4.2 10.85 4.2C13.75 4.2 16.15 6.3 16.65 9.1C16.85 9.1 17.05 9 17.35 9C19.65 9 21.55 10.9 21.55 13.2C21.55 15.5 19.65 17.4 17.35 17.4L16.55 17.4"),
    A(path("M11.65 11.6L9.35 14.7C9.25 14.9 9.35 15.1 9.55 15.1L11.25 15.1L10.15 18.8C10.05 19.1 10.45 19.3 10.65 19L13.25 15.3C13.35 15.1 13.25 14.9 13.05 14.9L11.35 14.9L12.55 11.8C12.65 11.5 12.35 11.3 12.05 11.6Z"), [an("opacity", ["1", "0.2", "1", "0.5", "1"], [0, 0.12, 0.3, 0.5, 1])]),
    G("rain", [
      line(16.45, 14.3, 15.45, 16.3),
      line(15.05, 17.1, 14.05, 19.1),
    ]),
  ],
    gAnims: { rain: [tn("translate", ["0 -1.9", "0 -1.9", "0 1.9", "0 -1.9"], [0, 0.1, 0.7, 1]), an("opacity", ["0", "0", "1", "1", "0", "0"], [0, 0.1, 0.25, 0.55, 0.68, 1])] } },

    "cloud-angled-zap": { auto: false,
    parts: [
    path("M6.55 16.5C4.25 16.5 2.45 14.6 2.45 12.3C2.45 10.3 3.95 8.6 5.95 8.2C6.35 5.8 8.35 3.9 10.85 3.9C13.75 3.9 16.15 6 16.65 8.8C16.85 8.8 17.05 8.7 17.35 8.7C19.65 8.7 21.55 10.6 21.55 12.9C21.55 15.2 19.65 17.1 17.35 17.1L16.55 17.1"),
    A(path("M12.85 11L10.15 14.8C10.05 15 10.15 15.2 10.35 15.2L12.35 15.2L11.05 19.5C10.95 19.8 11.35 20.1 11.65 19.8L14.75 15.5C14.85 15.3 14.75 15.1 14.55 15.1L12.55 15.1L13.95 11.2C14.05 10.9 13.65 10.6 13.45 11Z"), [an("opacity", ["1", "0.15", "1", "0.45", "1"], [0, 0.12, 0.3, 0.5, 1])]),
  ] },

  "cloud-backup": {
    auto: false,
    pp: false,
    dur: 1.8,
    parts: [
      path(CLOUD),
      G("spin", [
        path("M16.1 20c-1.6 1.4-4 1.3-5.5-.2-1.4-1.4-1.5-3.6-.2-5.1 1.4-1.5 3.9-1.7 5.5-.4l.8.7"),
        path("M16.9 13.4v1.9h-2"),
      ]),
    ],
    gAnims: { spin: tn("rotate", ["0 13.4 16.6", "360 13.4 16.6"]) },
  },

    "cloud-big-rain": { dur: 1.5,
    pp: false,
    auto: false,
    parts: [
    path("M6.55 16.65C4.25 16.65 2.45 14.75 2.45 12.45C2.45 10.45 3.95 8.75 5.95 8.35C6.35 5.95 8.35 4.05 10.85 4.05C13.75 4.05 16.15 6.15 16.65 8.95C16.85 8.95 17.05 8.85 17.35 8.85C19.65 8.85 21.55 10.75 21.55 13.05C21.55 15.35 19.65 17.25 17.35 17.25L16.55 17.25"),
    G("drop", [
      path("M11.05 14.75C10.05 15.85 8.95 16.85 8.95 17.95C8.95 19.15 9.85 19.95 11.05 19.95S13.15 19.05 13.15 17.95C13.15 16.85 12.05 15.85 11.05 14.75Z"),
    ]),
  ],
    gAnims: { drop: [tn("translate", ["0 -1.7", "0 -1.7", "0 1.7", "0 -1.7"], [0, 0.1, 0.7, 1]), an("opacity", ["0", "0", "1", "1", "0", "0"], [0, 0.1, 0.25, 0.55, 0.68, 1])] } },

  "cloud-check": {
    auto: false,
    parts: [path(CLOUD), A(path("M9.3 17.4l2 2 4.4-4.4", DO), draw())],
  },

    "cloud-cog": { auto: false,
    parts: [
    /* cloud ends open around the cog, both tails capped with 2px of air */
    path("M5.7 16.6C3.8 16.2 2.45 14.6 2.45 12.57C2.45 10.57 3.95 8.87 5.95 8.47C6.35 6.07 8.35 4.17 10.85 4.17C13.75 4.17 16.15 6.27 16.65 9.07C16.85 9.07 17.05 8.97 17.35 8.97C19.65 8.97 21.55 10.87 21.55 13.17C21.55 15.2 20.1 16.9 18.3 17.3"),
    G("turn", cog(12, 17.4, 0.8)),
  ],
    gAnims: { turn: tn("rotate", ["0 12 17.4", "60 12 17.4"]) } },

  "cloud-download": {
    auto: false,
    parts: [
      path("M6.8 15.6h-.2a4.01 4.01 0 0 1-.4-8 5.8 5.8 0 0 1 11.2 1.3h.5a3.35 3.35 0 0 1 0 6.7h-.7"),
      G("arr", [line(12, 10, 12, 20.4), path("M9 17.4l3 3 3-3")]),
    ],
    gAnims: { arr: tn("translate", ["0 0", "0 1.8", "0 0"], [0, 0.5, 1]) },
  },

    "cloud-drizzle": { dur: 1.6,
    pp: false,
    auto: false,
    parts: [
    path("M6.55 16.65C4.25 16.65 2.45 14.75 2.45 12.45C2.45 10.45 3.95 8.75 5.95 8.35C6.35 5.95 8.35 4.05 10.85 4.05C13.75 4.05 16.15 6.15 16.65 8.95C16.85 8.95 17.05 8.85 17.35 8.85C19.65 8.85 21.55 10.75 21.55 13.05C21.55 15.35 19.65 17.25 17.35 17.25L16.55 17.25"),
    G("rain", [
      line(8.35, 13.35, 8.35, 14.55),
      line(8.35, 17.15, 8.35, 18.35),
      line(12.05, 14.95, 12.05, 16.15),
      line(12.05, 18.75, 12.05, 19.95),
      line(15.75, 13.35, 15.75, 14.55),
      line(15.75, 17.15, 15.75, 18.35),
    ]),
  ],
    gAnims: { rain: [tn("translate", ["0 -1.6", "0 -1.6", "0 1.6", "0 -1.6"], [0, 0.1, 0.7, 1]), an("opacity", ["0", "0", "1", "1", "0", "0"], [0, 0.1, 0.25, 0.55, 0.68, 1])] } },

    "cloud-fast-wind": { dur: 1.4,
    pp: false,
    auto: false,
    parts: [
    path("M6.55 16.2C4.25 16.2 2.45 14.3 2.45 12C2.45 10 3.95 8.3 5.95 7.9C6.35 5.5 8.35 3.6 10.85 3.6C13.75 3.6 16.15 5.7 16.65 8.5C16.85 8.5 17.05 8.4 17.35 8.4C19.65 8.4 21.55 10.3 21.55 12.6C21.55 14.9 19.65 16.8 17.35 16.8L16.55 16.8"),
    G("gust", [
      line(7.05, 13.7, 10.45, 13.7),
      path("M6.45 16.3L12.05 16.3C13.35 16.3 14.35 17.2 14.35 18.4C14.35 19.5 13.35 20.4 12.05 20.4C11.15 20.4 10.35 20 10.05 19.3"),
    ]),
  ],
    gAnims: { gust: [tn("translate", ["-3 0", "-3 0", "3.5 0", "3.5 0", "-3 0"], [0, 0.1, 0.6, 0.78, 1]), an("opacity", ["0", "0", "1", "1", "0", "0"], [0, 0.1, 0.22, 0.5, 0.65, 1])] } },

    "cloud-fog": { dur: 1.8,
    auto: false,
    parts: [
    path("M6.55 16.95C4.25 16.95 2.45 15.05 2.45 12.75C2.45 10.75 3.95 9.05 5.95 8.65C6.35 6.25 8.35 4.35 10.85 4.35C13.75 4.35 16.15 6.45 16.65 9.25C16.85 9.25 17.05 9.15 17.35 9.15C19.65 9.15 21.55 11.05 21.55 13.35C21.55 15.65 19.65 17.55 17.35 17.55L16.55 17.55"),
    G("fog", [
      line(9.85, 16.45, 16.65, 16.45),
      line(7.45, 16.45, 8.45, 16.45),
      line(7.45, 19.65, 14.25, 19.65),
      line(15.65, 19.65, 16.65, 19.65),
    ]),
  ],
    gAnims: { fog: tn("translate", ["-1.2 0", "1.2 0", "-1.2 0"], [0, 0.5, 1]) } },

    "cloud-hail": { dur: 1.5,
    pp: false,
    auto: false,
    parts: [
    path("M6.55 17.08C4.25 17.08 2.45 15.18 2.45 12.88C2.45 10.88 3.95 9.18 5.95 8.78C6.35 6.38 8.35 4.48 10.85 4.48C13.75 4.48 16.15 6.58 16.65 9.38C16.85 9.38 17.05 9.28 17.35 9.28C19.65 9.28 21.55 11.18 21.55 13.48C21.55 15.78 19.65 17.68 17.35 17.68L16.55 17.68"),
    G("hail", [
      line(8.25, 14.17, 8.25, 15.37),
      line(12.05, 15.77, 12.05, 16.97),
      line(15.85, 14.17, 15.85, 15.37),
      circle(8.25, 18.37, 0.55, { fill: "currentColor", stroke: "none" }),
      circle(12.05, 19.97, 0.55, { fill: "currentColor", stroke: "none" }),
      circle(15.85, 18.37, 0.55, { fill: "currentColor", stroke: "none" }),
    ]),
  ],
    gAnims: { hail: [tn("translate", ["0 -1.5", "0 -1.5", "0 1.5", "0 -1.5"], [0, 0.1, 0.7, 1]), an("opacity", ["0", "0", "1", "1", "0", "0"], [0, 0.1, 0.25, 0.55, 0.68, 1])] } },
};
